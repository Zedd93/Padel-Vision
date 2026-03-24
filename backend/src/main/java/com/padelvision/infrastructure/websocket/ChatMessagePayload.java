package com.padelvision.infrastructure.websocket;

import lombok.Data;

@Data
public class ChatMessagePayload {
    private String userId;
    private String username;
    private String userImage;
    private String content;
    private String timestamp;
}
