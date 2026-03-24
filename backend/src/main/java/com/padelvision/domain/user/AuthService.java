package com.padelvision.domain.user;

import com.padelvision.domain.user.dto.*;
import com.padelvision.infrastructure.security.JwtService;
import com.padelvision.shared.enums.UserRole;
import com.padelvision.shared.enums.ViewerTier;
import com.padelvision.shared.exception.BadRequestException;
import com.padelvision.shared.exception.ConflictException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final StringRedisTemplate redisTemplate;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new ConflictException("Uzytkownik z tym adresem email juz istnieje");
        }
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new ConflictException("Nazwa uzytkownika jest juz zajeta");
        }

        User user = User.builder()
                .email(request.getEmail())
                .username(request.getUsername())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .name(request.getName())
                .role(UserRole.VIEWER)
                .viewerTier(ViewerTier.FREE)
                .build();

        user = userRepository.save(user);
        log.info("Zarejestrowano nowego uzytkownika: {}", user.getId());

        return buildAuthResponse(user);
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new BadRequestException("Nieprawidlowy adres email lub haslo"));

        if (user.getPasswordHash() == null ||
                !passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new BadRequestException("Nieprawidlowy adres email lub haslo");
        }

        log.info("Uzytkownik zalogowal sie: {}", user.getId());
        return buildAuthResponse(user);
    }

    public AuthResponse refreshToken(TokenRefreshRequest request) {
        String refreshToken = request.getRefreshToken();

        if (!jwtService.validateToken(refreshToken)) {
            throw new BadRequestException("Nieprawidlowy lub wygasly refresh token");
        }

        String userId = jwtService.extractUserId(refreshToken);

        // Check if token is still stored in Redis (not blacklisted)
        String storedToken = redisTemplate.opsForValue().get("refresh:" + userId);
        if (storedToken == null || !storedToken.equals(refreshToken)) {
            throw new BadRequestException("Refresh token zostal uniewazniony");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BadRequestException("Nie znaleziono uzytkownika"));

        // Blacklist old token
        redisTemplate.delete("refresh:" + userId);

        log.info("Odswiezono tokeny dla uzytkownika: {}", userId);
        return buildAuthResponse(user);
    }

    public void logout(String refreshToken) {
        if (jwtService.validateToken(refreshToken)) {
            String userId = jwtService.extractUserId(refreshToken);
            redisTemplate.delete("refresh:" + userId);
            log.info("Wylogowano uzytkownika: {}", userId);
        }
    }

    private AuthResponse buildAuthResponse(User user) {
        String accessToken = jwtService.generateAccessToken(user);
        String refreshToken = jwtService.generateRefreshToken(user);

        // Store refresh token in Redis
        redisTemplate.opsForValue().set(
                "refresh:" + user.getId(),
                refreshToken,
                Duration.ofMillis(jwtService.getRefreshExpiryMs())
        );

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .user(toUserResponse(user))
                .build();
    }

    private UserResponse toUserResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .username(user.getUsername())
                .name(user.getName())
                .image(user.getImage())
                .city(user.getCity())
                .role(user.getRole() != null ? user.getRole().name() : null)
                .viewerTier(user.getViewerTier() != null ? user.getViewerTier().name() : null)
                .createdAt(user.getCreatedAt())
                .build();
    }
}
