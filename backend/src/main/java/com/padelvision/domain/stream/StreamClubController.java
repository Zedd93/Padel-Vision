package com.padelvision.domain.stream;

import com.padelvision.domain.club.Club;
import com.padelvision.domain.club.ClubService;
import com.padelvision.domain.stream.dto.ScoreUpdateRequest;
import com.padelvision.domain.stream.dto.StreamResponse;
import com.padelvision.domain.stream.dto.StreamStartRequest;
import com.padelvision.shared.response.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/club/stream")
@RequiredArgsConstructor
@PreAuthorize("hasRole('CLUB')")
@Tag(name = "Club Streaming", description = "Club stream management endpoints")
public class StreamClubController {

    private final StreamService streamService;
    private final ClubService clubService;

    @PostMapping("/start")
    public ResponseEntity<ApiResponse<StreamResponse>> startStream(@Valid @RequestBody StreamStartRequest request) {
        String userId = getAuthenticatedUserId();
        Club club = clubService.getClubSettings(userId);

        Stream stream = streamService.startStream(club.getId(), request.getTitle(), request.getMatchId());
        return ResponseEntity.ok(ApiResponse.ok(StreamResponse.from(stream)));
    }

    @PostMapping("/{id}/stop")
    public ResponseEntity<ApiResponse<Void>> stopStream(@PathVariable String id) {
        String userId = getAuthenticatedUserId();
        Club club = clubService.getClubSettings(userId);

        streamService.stopStream(club.getId());
        return ResponseEntity.ok(ApiResponse.ok(null, "Stream stopped"));
    }

    @PutMapping("/{id}/score")
    public ResponseEntity<ApiResponse<Void>> updateScore(
            @PathVariable String id,
            @Valid @RequestBody ScoreUpdateRequest request) {
        Club club = clubService.getClubSettings(getAuthenticatedUserId());
        streamService.updateScore(club.getId(), id, request.getScore());
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    private String getAuthenticatedUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth.getName();
    }

}
