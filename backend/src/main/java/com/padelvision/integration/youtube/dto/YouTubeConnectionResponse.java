package com.padelvision.integration.youtube.dto;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;

/** Stan połączenia klubu z kanałem YouTube — GET /api/club/youtube/status. */
@Data
@Builder
public class YouTubeConnectionResponse {

    private boolean connected;

    private String channelId;

    private String channelTitle;

    /** CONNECTED | REVOKED | ERROR */
    private String status;

    private Instant connectedAt;

    /** Adres RTMP do wklejenia w OBS — uzupełniany w Fazie 2. */
    private String ingestAddress;

    /** Klucz transmisji do OBS — uzupełniany w Fazie 2. */
    private String ingestStreamName;
}
