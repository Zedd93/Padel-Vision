package com.padelvision.infrastructure.websocket;

import com.padelvision.infrastructure.security.JwtService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

/**
 * Uwierzytelnia połączenia STOMP tokenem JWT z nagłówka CONNECT.
 * <p>
 * Połączenie bez tokenu jest dozwolone — widz bez konta może czytać czat
 * i oglądać wynik. Taki użytkownik nie ma jednak principala, więc
 * {@link ChatWebSocketController} odrzuci jego wiadomości.
 * <p>
 * Nieprawidłowy token nie zrywa połączenia, tylko traktuje je jak anonimowe —
 * tak samo zachowuje się {@code JwtAuthenticationFilter} dla REST.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class WebSocketAuthInterceptor implements ChannelInterceptor {

    private static final String AUTHORIZATION_HEADER = "Authorization";
    private static final String BEARER_PREFIX = "Bearer ";

    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor =
                MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        if (accessor == null || accessor.getCommand() != StompCommand.CONNECT) {
            return message;
        }

        String header = accessor.getFirstNativeHeader(AUTHORIZATION_HEADER);
        if (!StringUtils.hasText(header) || !header.startsWith(BEARER_PREFIX)) {
            return message;
        }

        String token = header.substring(BEARER_PREFIX.length());
        try {
            if (jwtService.validateToken(token)) {
                String userId = jwtService.extractUserId(token);
                String email = jwtService.extractClaims(token).get("email", String.class);
                UserDetails userDetails = userDetailsService.loadUserByUsername(email);

                // Ten sam kształt principala co w REST: nazwa = ID użytkownika
                accessor.setUser(new UsernamePasswordAuthenticationToken(
                        userId, null, userDetails.getAuthorities()));
            }
        } catch (Exception e) {
            log.debug("Połączenie WebSocket bez ważnego tokenu: {}", e.getMessage());
        }

        return message;
    }
}
