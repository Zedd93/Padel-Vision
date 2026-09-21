package com.padelvision.integration.youtube;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.padelvision.shared.exception.BadRequestException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.util.UriComponentsBuilder;

/**
 * Cienka warstwa nad YouTube Data API v3: token klubu, rezerwacja quoty
 * i tłumaczenie błędów Google na komunikaty, które da się pokazać klubowi.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class YouTubeApiClient {

    private static final String BASE_URL = "https://www.googleapis.com/youtube/v3";
    private static final ObjectMapper MAPPER = new ObjectMapper();

    private final YouTubeOAuthService oauthService;
    private final YouTubeQuotaGuard quotaGuard;

    private final RestClient http = RestClient.create();

    public JsonNode get(String clubId, String path, MultiValueMap<String, String> query, int quotaUnits) {
        quotaGuard.reserve(quotaUnits, "GET " + path);
        String uri = buildUri(path, query);

        try {
            return http.get()
                    .uri(uri)
                    .header(HttpHeaders.AUTHORIZATION, bearer(clubId))
                    .retrieve()
                    .body(JsonNode.class);
        } catch (RestClientResponseException e) {
            throw translate(e, path);
        }
    }

    public JsonNode post(String clubId, String path, MultiValueMap<String, String> query,
                         Object body, int quotaUnits) {
        quotaGuard.reserve(quotaUnits, "POST " + path);
        String uri = buildUri(path, query);

        try {
            RestClient.RequestBodySpec request = http.post()
                    .uri(uri)
                    .header(HttpHeaders.AUTHORIZATION, bearer(clubId))
                    .contentType(MediaType.APPLICATION_JSON);

            return (body != null ? request.body(body) : request)
                    .retrieve()
                    .body(JsonNode.class);
        } catch (RestClientResponseException e) {
            throw translate(e, path);
        }
    }

    private String bearer(String clubId) {
        return "Bearer " + oauthService.getFreshAccessToken(clubId);
    }

    private String buildUri(String path, MultiValueMap<String, String> query) {
        UriComponentsBuilder builder = UriComponentsBuilder.fromUriString(BASE_URL + path);
        if (query != null) {
            builder.queryParams(query);
        }
        return builder.build().toUriString();
    }

    /**
     * Odpowiedzi błędów Google mają kształt
     * {@code {"error":{"errors":[{"reason":"..."}],"message":"..."}}}.
     * Tłumaczymy najczęstsze przyczyny; reszta leci jako komunikat ogólny.
     */
    private BadRequestException translate(RestClientResponseException e, String path) {
        String reason = extractReason(e);
        log.error("[YouTube] {} nieudane: HTTP {} reason={}", path, e.getStatusCode(), reason);

        return new BadRequestException(switch (reason) {
            case "quotaExceeded", "rateLimitExceeded" ->
                    "Dobowy limit YouTube API wyczerpany — spróbuj po północy czasu pacyficznego";
            case "liveStreamingNotEnabled", "livePermissionBlocked" ->
                    "Kanał YouTube klubu nie ma włączonych transmisji na żywo "
                            + "(youtube.com → Utwórz → Rozpocznij transmisję na żywo, aktywacja do 24 h)";
            case "insufficientPermissions", "forbidden" ->
                    "Brak uprawnień do kanału YouTube — połącz kanał ponownie w Studio";
            case "invalidTitle", "invalidDescription" ->
                    "Tytuł lub opis transmisji jest odrzucany przez YouTube";
            case "errorStreamInactive" ->
                    "YouTube nie odbiera sygnału z OBS — uruchom nadawanie i spróbuj ponownie";
            case "invalidTransition" ->
                    "Transmisja jest w stanie, który nie pozwala na tę operację";
            default -> "YouTube odrzucił operację (" + reason + ")";
        });
    }

    private String extractReason(RestClientResponseException e) {
        try {
            JsonNode error = MAPPER.readTree(e.getResponseBodyAsString()).path("error");

            JsonNode errors = error.path("errors");
            if (errors.isArray() && !errors.isEmpty()) {
                return errors.get(0).path("reason").asText("unknown");
            }
            return error.path("status").asText("unknown");
        } catch (Exception parseFailure) {
            return "unknown";
        }
    }
}
