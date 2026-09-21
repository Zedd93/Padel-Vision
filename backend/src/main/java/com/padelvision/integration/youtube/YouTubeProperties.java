package com.padelvision.integration.youtube;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * Konfiguracja integracji z YouTube Live.
 * Setup krok po kroku: docs/YOUTUBE_SETUP.md
 * <p>
 * Puste wartości są dozwolone — aplikacja startuje bez skonfigurowanego
 * YouTube, a endpointy integracji zwracają wtedy czytelny błąd.
 */
@Data
@Component
@ConfigurationProperties(prefix = "youtube")
public class YouTubeProperties {

    private String clientId = "";

    private String clientSecret = "";

    private String redirectUri = "http://localhost:8080/api/club/youtube/callback";

    /** AES-256-GCM, base64 z {@code openssl rand -base64 32}. */
    private String tokenEncKey = "";

    /** unlisted | public | private */
    private String defaultPrivacy = "unlisted";

    /** normal | low | ultraLow */
    private String defaultLatency = "low";

    private int dailyQuotaUnits = 10_000;

    private long pollIntervalMs = 60_000;

    /** Dokąd wraca przeglądarka klubu po zakończeniu flow OAuth. */
    private String postConnectRedirect = "http://localhost:5173/studio";

    public boolean isConfigured() {
        return !clientId.isBlank() && !clientSecret.isBlank() && !tokenEncKey.isBlank();
    }
}
