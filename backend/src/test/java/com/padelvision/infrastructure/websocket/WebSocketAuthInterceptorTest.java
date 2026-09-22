package com.padelvision.infrastructure.websocket;

import com.padelvision.infrastructure.security.JwtService;
import io.jsonwebtoken.Claims;
import org.junit.jupiter.api.Test;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetailsService;

import java.security.Principal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class WebSocketAuthInterceptorTest {

    private final JwtService jwtService = mock(JwtService.class);
    private final UserDetailsService userDetailsService = mock(UserDetailsService.class);
    private final WebSocketAuthInterceptor interceptor =
            new WebSocketAuthInterceptor(jwtService, userDetailsService);
    private final MessageChannel channel = mock(MessageChannel.class);

    @Test
    void validTokenOnConnectSetsUserIdAsPrincipal() {
        Claims claims = mock(Claims.class);
        when(claims.get("email", String.class)).thenReturn("widz@example.com");
        when(jwtService.validateToken("token")).thenReturn(true);
        when(jwtService.extractUserId("token")).thenReturn("user-42");
        when(jwtService.extractClaims("token")).thenReturn(claims);
        when(userDetailsService.loadUserByUsername("widz@example.com")).thenReturn(
                new User("widz@example.com", "", List.of(new SimpleGrantedAuthority("ROLE_VIEWER"))));

        Message<?> result = interceptor.preSend(message(StompCommand.CONNECT, "Bearer token"), channel);

        Principal user = userOf(result);
        assertThat(user).isNotNull();
        assertThat(user.getName()).isEqualTo("user-42");
    }

    /** Widz bez konta może czytać czat - połączenie przechodzi, ale bez principala. */
    @Test
    void connectWithoutTokenStaysAnonymous() {
        Message<?> result = interceptor.preSend(message(StompCommand.CONNECT, null), channel);

        assertThat(result).isNotNull();
        assertThat(userOf(result)).isNull();
    }

    @Test
    void invalidTokenStaysAnonymous() {
        when(jwtService.validateToken("zly")).thenReturn(false);

        Message<?> result = interceptor.preSend(message(StompCommand.CONNECT, "Bearer zly"), channel);

        assertThat(userOf(result)).isNull();
    }

    /** Token sprawdzamy tylko przy CONNECT - kolejne ramki niosą już principala sesji. */
    @Test
    void nonConnectFramesAreNotAuthenticatedAgain() {
        interceptor.preSend(message(StompCommand.SEND, "Bearer token"), channel);

        verify(jwtService, never()).validateToken(anyString());
    }

    private Message<byte[]> message(StompCommand command, String authorization) {
        StompHeaderAccessor accessor = StompHeaderAccessor.create(command);
        if (authorization != null) {
            accessor.addNativeHeader("Authorization", authorization);
        }
        // Interceptor modyfikuje nagłówki - muszą zostać mutowalne
        accessor.setLeaveMutable(true);
        return MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());
    }

    private Principal userOf(Message<?> message) {
        StompHeaderAccessor accessor =
                MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        return accessor != null ? accessor.getUser() : null;
    }
}
