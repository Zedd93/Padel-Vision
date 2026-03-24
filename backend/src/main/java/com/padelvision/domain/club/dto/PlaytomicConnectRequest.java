package com.padelvision.domain.club.dto;

import lombok.Data;

@Data
public class PlaytomicConnectRequest {
    private String clubId;
    private String clientId;
    private String clientSecret;
    private String tenantId;
}
