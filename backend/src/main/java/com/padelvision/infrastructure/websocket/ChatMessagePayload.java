package com.padelvision.infrastructure.websocket;

import lombok.Data;

@Data
public class ChatMessagePayload {
    /** ID zapisanej wiadomości - klient używa go jako klucza listy. */
    private String id;
    private String userId;
    private String username;
    private String userImage;
    private String content;
    private String timestamp;
}
