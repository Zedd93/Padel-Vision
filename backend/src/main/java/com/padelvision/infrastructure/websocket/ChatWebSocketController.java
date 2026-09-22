package com.padelvision.infrastructure.websocket;

import com.padelvision.domain.stream.ChatMessage;
import com.padelvision.domain.stream.ChatMessageRepository;
import com.padelvision.domain.stream.Stream;
import com.padelvision.domain.stream.StreamRepository;
import com.padelvision.domain.user.User;
import com.padelvision.domain.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

import java.security.Principal;
import java.time.Instant;

/**
 * Czat transmisji przez STOMP.
 * <p>
 * Autora wiadomości bierzemy wyłącznie z principala ustawionego przez
 * {@link WebSocketAuthInterceptor} na podstawie tokenu JWT. Pola
 * {@code userId} i {@code username} przysłane przez klienta są ignorowane —
 * wcześniej każdy mógł pisać jako dowolny użytkownik.
 * <p>
 * Zwrócenie {@code null} z metody z {@code @SendTo} oznacza "nic nie
 * rozgłaszaj" — tak odrzucamy wiadomości anonimowe i niepoprawne.
 * <p>
 * Wynik meczu nie jest już przyjmowany przez STOMP (każdy mógł go rozgłosić).
 * Rozgłasza go {@code StreamService.updateScore}, wywoływany przez chroniony
 * endpoint klubu {@code PUT /api/club/stream/{id}/score}.
 */
@Controller
@RequiredArgsConstructor
@Slf4j
public class ChatWebSocketController {

    static final int MAX_MESSAGE_LENGTH = 500;

    private final ChatMessageRepository chatMessageRepository;
    private final StreamRepository streamRepository;
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
            Principal principal) {

        if (principal == null) {
            log.debug("Odrzucono anonimową wiadomość na czacie transmisji {}", streamId);
            return null;
        }

        String content = payload.getContent() == null ? "" : payload.getContent().strip();
        if (content.isEmpty() || content.length() > MAX_MESSAGE_LENGTH) {
            return null;
        }

        User user = userRepository.findById(principal.getName()).orElse(null);
        Stream stream = streamRepository.findById(streamId).orElse(null);
        if (user == null || stream == null) {
            return null;
        }

        // Klucze obce zapisują relacje stream/user - pola streamId/userId
        // w encji są tylko do odczytu, więc samo ich ustawienie dawało NULL
        ChatMessage message = new ChatMessage();
        message.setStream(stream);
        message.setUser(user);
        message.setContent(content);
        message = chatMessageRepository.save(message);

        ChatMessagePayload outgoing = new ChatMessagePayload();
        outgoing.setId(message.getId());
        outgoing.setUserId(user.getId());
        outgoing.setUsername(user.getUsername());
        outgoing.setUserImage(user.getImage());
        outgoing.setContent(content);
        outgoing.setTimestamp(Instant.now().toString());
        return outgoing;
    }

    /**
     * Chat commands (/wynik, /sety, /gracze)
     * Client sends to: /app/chat.command.{streamId}
     */
    @MessageMapping("/chat.command.{streamId}")
    @SendTo("/topic/stream.{streamId}.chat")
    public ChatMessagePayload handleChatCommand(
            @DestinationVariable String streamId,
            ChatCommandPayload command,
            Principal principal) {

        // Odpowiedź trafia do wszystkich widzów, więc anonimowi nie mogą jej wywołać
        if (principal == null || command.getCommand() == null) {
            return null;
        }

        String response = switch (command.getCommand().toLowerCase()) {
            case "/wynik" -> "Aktualny wynik: sprawdź widget na ekranie";
            case "/sety" -> "Wyniki setów: sprawdź widget na ekranie";
            case "/gracze" -> "Lista graczy: sprawdź szczegóły turnieju";
            default -> "Nieznana komenda: " + command.getCommand();
        };

        ChatMessagePayload systemMessage = new ChatMessagePayload();
        systemMessage.setId("system-" + Instant.now().toEpochMilli());
        systemMessage.setUserId("system");
        systemMessage.setUsername("System");
        systemMessage.setContent(response);
        systemMessage.setTimestamp(Instant.now().toString());
        return systemMessage;
    }
}
