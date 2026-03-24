package com.padelvision.domain.user;

import com.padelvision.domain.user.dto.UserResponse;
import com.padelvision.domain.user.dto.UserUpdateRequest;
import com.padelvision.shared.dto.UserProfileResponse;
import com.padelvision.shared.pagination.PageResponse;
import com.padelvision.shared.response.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Tag(name = "Users", description = "User profile endpoints")
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserResponse>> getCurrentUser() {
        String userId = getAuthenticatedUserId();
        User user = userService.getUserById(userId);
        return ResponseEntity.ok(ApiResponse.ok(toUserResponse(user)));
    }

    @PutMapping("/me")
    public ResponseEntity<ApiResponse<UserResponse>> updateUser(@Valid @RequestBody UserUpdateRequest request) {
        String userId = getAuthenticatedUserId();
        User user = userService.updateUser(
                userId,
                request.getName(),
                request.getUsername(),
                request.getImage(),
                request.getCity()
        );
        return ResponseEntity.ok(ApiResponse.ok(toUserResponse(user)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<UserProfileResponse>> getUserById(@PathVariable String id) {
        User user = userService.getUserById(id);
        Map<String, Object> stats = userService.getUserStats(id);

        UserProfileResponse profile = UserProfileResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .username(user.getUsername())
                .name(user.getName())
                .image(user.getImage())
                .city(user.getCity())
                .role(user.getRole() != null ? user.getRole().name() : null)
                .viewerTier(user.getViewerTier() != null ? user.getViewerTier().name() : null)
                .createdAt(user.getCreatedAt())
                .matchesPlayed(0)
                .winRate(0.0)
                .clipsCount(0)
                .totalViews(0)
                .eloRating(0.0)
                .clubName(user.getClub() != null ? user.getClub().getName() : null)
                .badges(List.of())
                .build();

        return ResponseEntity.ok(ApiResponse.ok(profile));
    }

    @GetMapping("/{id}/posts")
    public ResponseEntity<ApiResponse<PageResponse<Object>>> getUserPosts(
            @PathVariable String id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<Object> posts = userService.getUserPosts(id, PageRequest.of(page, size));
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.from(posts)));
    }

    @GetMapping("/{id}/stats")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getUserStats(@PathVariable String id) {
        Map<String, Object> stats = userService.getUserStats(id);
        return ResponseEntity.ok(ApiResponse.ok(stats));
    }

    private String getAuthenticatedUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth.getName();
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
