package com.padelvision.integration.youtube;

import com.padelvision.domain.club.Club;
import com.padelvision.integration.youtube.dto.YouTubeConnectionResponse;
import com.padelvision.shared.response.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.util.Map;
import java.util.Optional;

/**
 * Łączenie klubu z kanałem YouTube (OAuth 2.0).
 * <p>
 * Uwaga: {@code @PreAuthorize} jest na poszczególnych metodach, a nie na klasie —
 * {@code /callback} wywołuje przeglądarka po przekierowaniu z Google i nie niesie
 * nagłówka JWT. Tożsamość klubu odtwarzamy z jednorazowego parametru {@code state}.
 */
@Slf4j
@RestController
@RequestMapping("/api/club/youtube")
@RequiredArgsConstructor
@Tag(name = "YouTube", description = "Połączenie klubu z kanałem YouTube")
public class YouTubeOAuthController {

    private final YouTubeOAuthService oauthService;
    private final YouTubeProperties properties;

    /** Zwraca URL ekranu zgody Google — frontend przekierowuje na niego klub. */
    @GetMapping("/connect")
    @PreAuthorize("hasRole('CLUB')")
    public ResponseEntity<ApiResponse<Map<String, String>>> connect() {
        String url = oauthService.buildAuthorizationUrl(getAuthenticatedUserId());
        return ResponseEntity.ok(ApiResponse.ok(Map.of("authorizationUrl", url)));
    }

    /**
     * Odbiera przekierowanie z Google. Zawsze kończy się przekierowaniem do
     * frontendu — błędy trafiają tam jako parametry zapytania, bo klub patrzy
     * w tym momencie na przeglądarkę, a nie na odpowiedź API.
     */
    @GetMapping("/callback")
    public ResponseEntity<Void> callback(
            @RequestParam(required = false) String code,
            @RequestParam(required = false) String state,
            @RequestParam(required = false) String error) {

        if (error != null) {
            log.warn("[YouTube] Klub odrzucił zgodę: {}", error);
            return redirect("error", "Zgoda nie została udzielona");
        }
        if (code == null || state == null) {
            return redirect("error", "Niekompletna odpowiedź z Google");
        }

        try {
            String channelTitle = oauthService.handleCallback(code, state);
            return redirect("connected", channelTitle);
        } catch (RuntimeException e) {
            log.error("[YouTube] Callback nieudany: {}", e.getMessage());
            return redirect("error", e.getMessage());
        }
    }

    /** Stan połączenia — używane przez Studio. */
    @GetMapping("/status")
    @PreAuthorize("hasRole('CLUB')")
    public ResponseEntity<ApiResponse<YouTubeConnectionResponse>> status() {
        Club club = oauthService.requireClubForUser(getAuthenticatedUserId());
        YouTubeChannelConnection connection = oauthService.findConnection(club.getId());

        if (connection == null) {
            return ResponseEntity.ok(ApiResponse.ok(
                    YouTubeConnectionResponse.builder().connected(false).build()));
        }

        return ResponseEntity.ok(ApiResponse.ok(YouTubeConnectionResponse.builder()
                .connected(true)
                .channelId(connection.getChannelId())
                .channelTitle(connection.getChannelTitle())
                .status(connection.getStatus().name())
                .connectedAt(connection.getConnectedAt())
                .ingestAddress(connection.getIngestAddress())
                .ingestStreamName(connection.getIngestStreamName())
                .build()));
    }

    @DeleteMapping("/disconnect")
    @PreAuthorize("hasRole('CLUB')")
    public ResponseEntity<ApiResponse<Void>> disconnect() {
        Club club = oauthService.requireClubForUser(getAuthenticatedUserId());
        oauthService.disconnect(club.getId());
        return ResponseEntity.ok(ApiResponse.ok(null, "Kanał YouTube rozłączony"));
    }

    private ResponseEntity<Void> redirect(String result, String detail) {
        URI target = UriComponentsBuilder.fromUriString(properties.getPostConnectRedirect())
                .queryParam("youtube", result)
                .queryParamIfPresent("detail", Optional.ofNullable(detail))
                .build()
                .toUri();

        return ResponseEntity.status(HttpStatus.FOUND).location(target).build();
    }

    private String getAuthenticatedUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth.getName();
    }
}
