package com.padelvision.domain.user;

import com.padelvision.domain.user.dto.AuthResponse;
import com.padelvision.domain.user.dto.LoginRequest;
import com.padelvision.domain.user.dto.RegisterRequest;
import com.padelvision.domain.user.dto.TokenRefreshRequest;
import com.padelvision.shared.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response, "Rejestracja zakonczona pomyslnie"));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.ok(response, "Logowanie zakonczone pomyslnie"));
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<AuthResponse>> refreshToken(@Valid @RequestBody TokenRefreshRequest request) {
        AuthResponse response = authService.refreshToken(request);
        return ResponseEntity.ok(ApiResponse.ok(response, "Token odswiezony pomyslnie"));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(@RequestHeader("Authorization") String authHeader) {
        String refreshToken = authHeader;
        if (authHeader.startsWith("Bearer ")) {
            refreshToken = authHeader.substring(7);
        }
        authService.logout(refreshToken);
        return ResponseEntity.ok(ApiResponse.ok(null, "Wylogowano pomyslnie"));
    }
}
