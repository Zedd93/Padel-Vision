package com.padelvision.infrastructure.websocket;

import lombok.Data;

@Data
public class ChatCommandPayload {
    private String command;
    private String userId;
}
