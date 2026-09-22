package com.padelvision.infrastructure.websocket;

import com.padelvision.domain.stream.ChatMessage;
import com.padelvision.domain.stream.ChatMessageRepository;
import com.padelvision.domain.stream.Stream;
import com.padelvision.domain.stream.StreamRepository;
import com.padelvision.domain.user.User;
import com.padelvision.domain.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.security.Principal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class ChatWebSocketControllerTest {

    private static final String STREAM_ID = "stream-1";

    private final ChatMessageRepository chatMessageRepository = mock(ChatMessageRepository.class);
    private final StreamRepository streamRepository = mock(StreamRepository.class);
    private final UserRepository userRepository = mock(UserRepository.class);
    private final ChatWebSocketController controller =
            new ChatWebSocketController(chatMessageRepository, streamRepository, userRepository);

    private final User author = User.builder()
            .id("user-123")
            .username("prawdziwy_autor")
            .email("autor@example.com")
            .build();
    private final Stream stream = Stream.builder().id(STREAM_ID).build();

    @BeforeEach
    void setUp() {
        when(userRepository.findById("user-123")).thenReturn(Optional.of(author));
        when(streamRepository.findById(STREAM_ID)).thenReturn(Optional.of(stream));
        when(chatMessageRepository.save(any(ChatMessage.class))).thenAnswer(invocation -> {
            ChatMessage saved = invocation.getArgument(0);
            saved.setId("msg-1");
            return saved;
        });
    }

    @Test
    void anonymousMessageIsDropped() {
        ChatMessagePayload result = controller.handleChatMessage(STREAM_ID, payload("cześć"), null);

        assertThat(result).isNull();
        verify(chatMessageRepository, never()).save(any());
    }

    /**
     * Regresja: autor był brany z treści wiadomości, więc każdy mógł pisać
     * jako dowolny użytkownik. Teraz liczy się wyłącznie token.
     */
    @Test
    void authorComesFromTokenNotFromPayload() {
        ChatMessagePayload forged = payload("podszywam się");
        forged.setUserId("ktos-inny");
        forged.setUsername("admin");

        ChatMessagePayload result = controller.handleChatMessage(STREAM_ID, forged, principal("user-123"));

        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo("msg-1");
        assertThat(result.getUserId()).isEqualTo("user-123");
        assertThat(result.getUsername()).isEqualTo("prawdziwy_autor");
        assertThat(result.getContent()).isEqualTo("podszywam się");
    }

    /**
     * Regresja: kontroler ustawiał tylko pola streamId/userId, które w encji
     * są tylko do odczytu - do bazy szedł NULL i zapis się wywalał.
     */
    @Test
    void savedMessageHasStreamAndUserRelationsSet() {
        controller.handleChatMessage(STREAM_ID, payload("gem!"), principal("user-123"));

        ArgumentCaptor<ChatMessage> captor = ArgumentCaptor.forClass(ChatMessage.class);
        verify(chatMessageRepository).save(captor.capture());
        assertThat(captor.getValue().getStream()).isSameAs(stream);
        assertThat(captor.getValue().getUser()).isSameAs(author);
        assertThat(captor.getValue().getContent()).isEqualTo("gem!");
    }

    @Test
    void contentIsTrimmed() {
        ChatMessagePayload result =
                controller.handleChatMessage(STREAM_ID, payload("   as serwisowy  "), principal("user-123"));

        assertThat(result.getContent()).isEqualTo("as serwisowy");
    }

    @Test
    void blankMessageIsDropped() {
        assertThat(controller.handleChatMessage(STREAM_ID, payload("   "), principal("user-123"))).isNull();
        assertThat(controller.handleChatMessage(STREAM_ID, payload(null), principal("user-123"))).isNull();
        verify(chatMessageRepository, never()).save(any());
    }

    @Test
    void tooLongMessageIsDropped() {
        String tooLong = "a".repeat(ChatWebSocketController.MAX_MESSAGE_LENGTH + 1);

        assertThat(controller.handleChatMessage(STREAM_ID, payload(tooLong), principal("user-123"))).isNull();
        verify(chatMessageRepository, never()).save(any());
    }

    @Test
    void messageToUnknownStreamIsDropped() {
        when(streamRepository.findById("nie-ma")).thenReturn(Optional.empty());

        assertThat(controller.handleChatMessage("nie-ma", payload("halo"), principal("user-123"))).isNull();
        verify(chatMessageRepository, never()).save(any());
    }

    @Test
    void anonymousCommandIsDropped() {
        ChatCommandPayload command = new ChatCommandPayload();
        command.setCommand("/wynik");

        assertThat(controller.handleChatCommand(STREAM_ID, command, null)).isNull();
    }

    private ChatMessagePayload payload(String content) {
        ChatMessagePayload payload = new ChatMessagePayload();
        payload.setContent(content);
        return payload;
    }

    private Principal principal(String userId) {
        return () -> userId;
    }
}
