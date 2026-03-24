package com.padelvision.domain.club.dto;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;

@Data
@Builder
public class PlaytomicStatusResponse {
    private String clubId;
    private boolean isEnabled;
    private Instant lastSyncAt;
    private String lastSyncStatus;
}
