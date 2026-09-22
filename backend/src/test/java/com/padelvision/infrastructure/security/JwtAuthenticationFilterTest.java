package com.padelvision.infrastructure.security;

import io.jsonwebtoken.Claims;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.User;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class JwtAuthenticationFilterTest {

    private final JwtService jwtService = mock(JwtService.class);
    private final UserDetailsServiceImpl userDetailsService = mock(UserDetailsServiceImpl.class);
    private final JwtAuthenticationFilter filter =
            new JwtAuthenticationFilter(jwtService, userDetailsService);

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    /**
     * Regresja: nazwą zalogowanego użytkownika był e-mail, a kontrolery
     * (Studio, klub, powiadomienia, płatności, profil) szukają po
     * auth.getName() jako po ID - każde takie zapytanie kończyło się 404.
     */
    @Test
    void principalNameIsUserIdNotEmail() throws Exception {
        givenValidToken("token", "user-123", "klub@example.com", "ROLE_CLUB");

        filter.doFilter(requestWithBearer("/api/club/youtube/status", "token"),
                new MockHttpServletResponse(), new MockFilterChain());

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        assertThat(auth).isNotNull();
        assertThat(auth.getName()).isEqualTo("user-123");
        assertThat(auth.getAuthorities())
                .extracting(GrantedAuthority::getAuthority)
                .containsExactly("ROLE_CLUB");
    }

    @Test
    void invalidTokenLeavesRequestAnonymous() throws Exception {
        when(jwtService.validateToken("zly-token")).thenReturn(false);

        filter.doFilter(requestWithBearer("/api/users/me", "zly-token"),
                new MockHttpServletResponse(), new MockFilterChain());

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
    }

    @Test
    void requestWithoutTokenLeavesRequestAnonymous() throws Exception {
        filter.doFilter(new MockHttpServletRequest("GET", "/api/users/me"),
                new MockHttpServletResponse(), new MockFilterChain());

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
    }

    private void givenValidToken(String token, String userId, String email, String role) {
        Claims claims = mock(Claims.class);
        when(claims.get("email", String.class)).thenReturn(email);
        when(jwtService.validateToken(token)).thenReturn(true);
        when(jwtService.extractUserId(token)).thenReturn(userId);
        when(jwtService.extractClaims(token)).thenReturn(claims);
        when(userDetailsService.loadUserByUsername(email)).thenReturn(
                new User(email, "", List.of(new SimpleGrantedAuthority(role))));
    }

    private MockHttpServletRequest requestWithBearer(String path, String token) {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", path);
        request.addHeader("Authorization", "Bearer " + token);
        return request;
    }
}
