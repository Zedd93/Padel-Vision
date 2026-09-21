package com.padelvision.integration.youtube;

import com.fasterxml.jackson.databind.JsonNode;
import com.padelvision.domain.club.Club;
import com.padelvision.domain.club.ClubRepository;
import com.padelvision.integration.youtube.dto.GoogleTokenResponse;
import com.padelvision.shared.enums.YouTubeConnectionStatus;
import com.padelvision.shared.exception.BadRequestException;
import com.padelvision.shared.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.util.UriComponentsBuilder;

import java.time.Duration;
import java.time.Instant;
import java.util.UUID;

/**
 * Flow OAuth 2.0 dla kanałów YouTube klubów.
 * <p>
 * Nic w tej klasie nie loguje tokenów — ani w treści, ani w komunikatach
 * wyjątków. Do logów trafiają wyłącznie identyfikatory klubu i kanału.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class YouTubeOAuthService {

    private static final String AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
    private static final String TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
    private static final String REVOKE_ENDPOINT = "https://oauth2.googleapis.com/revoke";
    private static final String CHANNELS_ENDPOINT =
            "https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true";

    private static final String SCOPE = "https://www.googleapis.com/auth/youtube.force-ssl";
    private static final String STATE_KEY_PREFIX = "youtube:oauth:state:";
    private static final Duration STATE_TTL = Duration.ofMinutes(10);

    /** Margines, o jaki odświeżamy access token przed jego faktycznym wygaśnięciem. */
    private static final Duration EXPIRY_MARGIN = Duration.ofMinutes(2);

    private final YouTubeProperties properties;
    private final TokenCipher tokenCipher;
    private final YouTubeChannelConnectionRepository connectionRepository;
    private final ClubRepository clubRepository;
    private final StringRedisTemplate redisTemplate;

    private final RestClient http = RestClient.create();

    /* ─── Krok 1: budowa URL zgody ────────────────────────────── */

    /**
     * Buduje URL ekranu zgody Google i zapisuje jednorazowy {@code state}
     * w Redis, żeby callback (który nie niesie JWT) dało się powiązać z klubem.
     */
    public String buildAuthorizationUrl(String userId) {
        requireConfigured();
        Club club = requireClubForUser(userId);

        String state = UUID.randomUUID().toString();
        redisTemplate.opsForValue().set(STATE_KEY_PREFIX + state, club.getId(), STATE_TTL);

        return UriComponentsBuilder.fromUriString(AUTH_ENDPOINT)
                .queryParam("client_id", properties.getClientId())
                .queryParam("redirect_uri", properties.getRedirectUri())
                .queryParam("response_type", "code")
                .queryParam("scope", SCOPE)
                // offline + consent są wymagane, żeby w ogóle dostać refresh token
                .queryParam("access_type", "offline")
                .queryParam("prompt", "consent")
                .queryParam("include_granted_scopes", "true")
                .queryParam("state", state)
                .build()
                .toUriString();
    }

    /* ─── Krok 2: callback ────────────────────────────────────── */

    /**
     * Wymienia kod autoryzacyjny na tokeny i zapisuje połączenie klubu.
     *
     * @return tytuł podłączonego kanału (do logu i komunikatu dla klubu)
     */
    @Transactional
    public String handleCallback(String code, String state) {
        requireConfigured();

        String stateKey = STATE_KEY_PREFIX + state;
        String clubId = redisTemplate.opsForValue().get(stateKey);
        if (clubId == null) {
            throw new BadRequestException("Sesja łączenia z YouTube wygasła — zacznij od nowa");
        }
        // state jest jednorazowy — kasujemy niezależnie od dalszego wyniku
        redisTemplate.delete(stateKey);

        Club club = clubRepository.findById(clubId)
                .orElseThrow(() -> new ResourceNotFoundException("Club", "id", clubId));

        GoogleTokenResponse tokens = exchangeCode(code);

        if (tokens.getRefreshToken() == null || tokens.getRefreshToken().isBlank()) {
            throw new BadRequestException(
                    "Google nie zwrócił tokenu odświeżającego. Usuń dostęp aplikacji na "
                            + "myaccount.google.com/connections i spróbuj ponownie");
        }
        if (tokens.getScope() == null || !tokens.getScope().contains("youtube.force-ssl")) {
            throw new BadRequestException(
                    "Brak zgody na zarządzanie kanałem YouTube — przy logowaniu trzeba zaznaczyć "
                            + "uprawnienie do YouTube");
        }

        JsonNode channel = fetchChannel(tokens.getAccessToken());
        String channelId = channel.path("id").asText(null);
        String channelTitle = channel.path("snippet").path("title").asText(null);
        if (channelId == null) {
            throw new BadRequestException(
                    "Wybrane konto Google nie ma kanału YouTube — wybierz kanał klubu");
        }

        YouTubeChannelConnection connection = connectionRepository.findByClubId(clubId)
                .orElseGet(() -> YouTubeChannelConnection.builder()
                        .club(club)
                        .build());

        connection.setClub(club);
        connection.setChannelId(channelId);
        connection.setChannelTitle(channelTitle);
        connection.setRefreshTokenEnc(tokenCipher.encrypt(tokens.getRefreshToken()));
        connection.setAccessTokenEnc(tokenCipher.encrypt(tokens.getAccessToken()));
        connection.setAccessTokenExpiresAt(expiryFrom(tokens.getExpiresIn()));
        connection.setScopes(tokens.getScope());
        connection.setStatus(YouTubeConnectionStatus.CONNECTED);

        connectionRepository.save(connection);

        log.info("[YouTube] Klub {} połączony z kanałem {} ({})",
                club.getName(), channelTitle, channelId);
        return channelTitle;
    }

    /* ─── Odczyt stanu i tokenów ──────────────────────────────── */

    @Transactional(readOnly = true)
    public YouTubeChannelConnection findConnection(String clubId) {
        return connectionRepository.findByClubId(clubId).orElse(null);
    }

    @Transactional(readOnly = true)
    public Club requireClubForUser(String userId) {
        return clubRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Club", "userId", userId));
    }

    /**
     * Zwraca ważny access token klubu, odświeżając go w razie potrzeby.
     * Używane przez wszystkie wywołania YouTube Data API (Faza 2).
     * <p>
     * Celowo bez {@code @Transactional}: gdy Google odrzuci odświeżenie,
     * zapisujemy status REVOKED i rzucamy wyjątek. We wspólnej transakcji
     * ten zapis wycofałby się razem z wyjątkiem i status byłby tracony.
     */
    public String getFreshAccessToken(String clubId) {
        requireConfigured();

        YouTubeChannelConnection connection = connectionRepository.findByClubId(clubId)
                .orElseThrow(() -> new BadRequestException(
                        "Klub nie ma połączonego kanału YouTube"));

        if (connection.getStatus() == YouTubeConnectionStatus.REVOKED) {
            throw new BadRequestException(
                    "Zgoda na dostęp do kanału YouTube została cofnięta — połącz kanał ponownie");
        }

        Instant expiresAt = connection.getAccessTokenExpiresAt();
        boolean stillValid = connection.getAccessTokenEnc() != null
                && expiresAt != null
                && Instant.now().isBefore(expiresAt.minus(EXPIRY_MARGIN));

        if (stillValid) {
            return tokenCipher.decrypt(connection.getAccessTokenEnc());
        }

        GoogleTokenResponse refreshed = refreshToken(connection);
        connection.setAccessTokenEnc(tokenCipher.encrypt(refreshed.getAccessToken()));
        connection.setAccessTokenExpiresAt(expiryFrom(refreshed.getExpiresIn()));
        connection.setStatus(YouTubeConnectionStatus.CONNECTED);
        connectionRepository.save(connection);

        return refreshed.getAccessToken();
    }

    /* ─── Rozłączenie ─────────────────────────────────────────── */

    @Transactional
    public void disconnect(String clubId) {
        YouTubeChannelConnection connection = connectionRepository.findByClubId(clubId)
                .orElseThrow(() -> new BadRequestException(
                        "Klub nie ma połączonego kanału YouTube"));

        // Cofnięcie zgody po stronie Google jest "best effort" — nawet gdy
        // padnie (token już wygasły, brak sieci), lokalne połączenie kasujemy.
        try {
            String refreshToken = tokenCipher.decrypt(connection.getRefreshTokenEnc());
            MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
            form.add("token", refreshToken);

            http.post()
                    .uri(REVOKE_ENDPOINT)
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .body(form)
                    .retrieve()
                    .toBodilessEntity();
        } catch (RestClientException | IllegalStateException e) {
            log.warn("[YouTube] Nie udało się cofnąć zgody dla klubu {} — kasuję połączenie lokalnie: {}",
                    clubId, e.getMessage());
        }

        connectionRepository.delete(connection);
        log.info("[YouTube] Klub {} rozłączony z kanałem {}", clubId, connection.getChannelId());
    }

    /* ─── Wywołania do Google ─────────────────────────────────── */

    private GoogleTokenResponse exchangeCode(String code) {
        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("code", code);
        form.add("client_id", properties.getClientId());
        form.add("client_secret", properties.getClientSecret());
        form.add("redirect_uri", properties.getRedirectUri());
        form.add("grant_type", "authorization_code");

        try {
            return http.post()
                    .uri(TOKEN_ENDPOINT)
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .body(form)
                    .retrieve()
                    .body(GoogleTokenResponse.class);
        } catch (RestClientResponseException e) {
            log.error("[YouTube] Wymiana kodu na token nieudana: HTTP {}", e.getStatusCode());
            throw new BadRequestException(
                    "Google odrzucił kod autoryzacyjny. Sprawdź, czy adres przekierowania "
                            + "w konsoli Google zgadza się z YOUTUBE_REDIRECT_URI");
        }
    }

    private GoogleTokenResponse refreshToken(YouTubeChannelConnection connection) {
        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("client_id", properties.getClientId());
        form.add("client_secret", properties.getClientSecret());
        form.add("refresh_token", tokenCipher.decrypt(connection.getRefreshTokenEnc()));
        form.add("grant_type", "refresh_token");

        try {
            return http.post()
                    .uri(TOKEN_ENDPOINT)
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .body(form)
                    .retrieve()
                    .body(GoogleTokenResponse.class);
        } catch (RestClientResponseException e) {
            boolean revoked = e.getResponseBodyAsString().contains("invalid_grant");
            connection.setStatus(revoked
                    ? YouTubeConnectionStatus.REVOKED
                    : YouTubeConnectionStatus.ERROR);
            connectionRepository.save(connection);

            log.error("[YouTube] Odświeżenie tokenu klubu {} nieudane: HTTP {} (revoked={})",
                    connection.getClubId(), e.getStatusCode(), revoked);

            throw new BadRequestException(revoked
                    ? "Zgoda na dostęp do kanału YouTube wygasła lub została cofnięta — połącz kanał ponownie"
                    : "Google odrzucił odświeżenie tokenu YouTube");
        }
    }

    private JsonNode fetchChannel(String accessToken) {
        try {
            JsonNode body = http.get()
                    .uri(CHANNELS_ENDPOINT)
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken)
                    .retrieve()
                    .body(JsonNode.class);

            if (body == null || !body.path("items").isArray() || body.path("items").isEmpty()) {
                throw new BadRequestException(
                        "Wybrane konto Google nie ma kanału YouTube — wybierz kanał klubu");
            }
            return body.path("items").get(0);
        } catch (RestClientResponseException e) {
            log.error("[YouTube] channels.list nieudane: HTTP {}", e.getStatusCode());
            throw new BadRequestException(
                    "Nie udało się odczytać kanału YouTube. Sprawdź, czy YouTube Data API v3 "
                            + "jest włączone w projekcie Google Cloud");
        }
    }

    /* ─── Pomocnicze ──────────────────────────────────────────── */

    private void requireConfigured() {
        if (!properties.isConfigured()) {
            throw new BadRequestException(
                    "Integracja YouTube nie jest skonfigurowana — ustaw YOUTUBE_CLIENT_ID, "
                            + "YOUTUBE_CLIENT_SECRET i YOUTUBE_TOKEN_ENC_KEY (docs/YOUTUBE_SETUP.md)");
        }
    }

    private Instant expiryFrom(Long expiresInSeconds) {
        long seconds = expiresInSeconds != null ? expiresInSeconds : 3600L;
        return Instant.now().plusSeconds(seconds);
    }
}
