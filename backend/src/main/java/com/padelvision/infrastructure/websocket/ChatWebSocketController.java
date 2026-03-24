package com.padelvision.infrastructure.websocket;

import com.padelvision.domain.stream.ChatMessage;
import com.padelvision.domain.stream.ChatMessageRepository;
import com.padelvision.domain.user.User;
import com.padelvision.domain.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.stereotype.Controller;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Controller
@RequiredArgsConstructor
@Slf4j
public class ChatWebSocketController {

    private final ChatMessageRepository chatMessageRepository;
    private final UserRepository userRepository;

    /**
     * Client sends to: /app/chat.message.{streamId}
     * Broadcast to: /topic/stream.{streamId}.chat
     */
    @MessageMapping("/chat.message.{streamId}")
    @SendTo("/topic/stream.{streamId}.chat")
    public ChatMessagePayload handleChatMessage(
            @DestinationVariable String streamId,
            ChatMessagePayload payload,
            SimpMessageHeaderAccessor headerAccessor) {

        log.debug("Chat message for stream {}: {}", streamId, payload.getContent());

        // Persist message
        ChatMessage message = new ChatMessage();
        message.setId(UUID.randomUUID().toString());
        message.setStreamId(streamId);
        message.setUserId(payload.getUserId());
        message.setContent(payload.getContent());
        message.setCreatedAt(Instant.now());
        chatMessageRepository.save(message);

        // Enrich with username
        userRepository.findById(payload.getUserId())
                .ifPresent(user -> {
                    payload.setUsername(user.getUsername());
                    payload.setUserImage(user.getImage());
                });

        payload.setTimestamp(Instant.now().toString());
        return payload;
    }

    /**
     * Chat commands (/wynik, /sety, /gracze)
     * Client sends to: /app/chat.command.{streamId}
     * Reply to: /user/queue/chat.system
     */
    @MessageMapping("/chat.command.{streamId}")
    @SendTo("/topic/stream.{streamId}.chat")
    public ChatMessagePayload handleChatCommand(
            @DestinationVariable String streamId,
            ChatCommandPayload command) {

        String response = switch (command.getCommand().toLowerCase()) {
            case "/wynik" -> "Aktualny wynik: sprawdź widget na ekranie";
            case "/sety" -> "Wyniki setów: sprawdź widget na ekranie";
            case "/gracze" -> "Lista graczy: sprawdź szczegóły turnieju";
            default -> "Nieznana komenda: " + command.getCommand();
        };

        ChatMessagePayload systemMessage = new ChatMessagePayload();
        systemMessage.setUserId("system");
        systemMessage.setUsername("System");
        systemMessage.setContent(response);
        systemMessage.setTimestamp(Instant.now().toString());
        return systemMessage;
    }

    /**
     * Score update broadcast
     * Client (club) sends to: /app/score.update.{streamId}
     * Broadcast to: /topic/stream.{streamId}.score
     */
    @MessageMapping("/score.update.{streamId}")
    @SendTo("/topic/stream.{streamId}.score")
    public Map<String, Object> handleScoreUpdate(
            @DestinationVariable String streamId,
            Map<String, Object> score) {
        log.info("Score update for stream {}: {}", streamId, score);
        return score;
    }
}
