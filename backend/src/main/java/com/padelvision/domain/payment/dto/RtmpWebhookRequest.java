package com.padelvision.domain.payment.dto;

import lombok.Data;

@Data
public class RtmpWebhookRequest {
    private String action;
    private String streamKey;
    private String clientId;
}
