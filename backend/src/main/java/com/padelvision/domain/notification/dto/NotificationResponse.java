package com.padelvision.domain.notification.dto;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.Map;

@Data
@Builder
public class NotificationResponse {
    private String id;
    private String type;
    private Map<String, Object> payload;
    private boolean read;
    private Instant createdAt;
}
