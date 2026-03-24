package com.padelvision.shared;

import com.padelvision.domain.club.Club;
import com.padelvision.domain.club.ClubRepository;
import com.padelvision.domain.club.dto.ClubResponse;
import com.padelvision.domain.stream.StreamRepository;
import com.padelvision.domain.tournament.TournamentRepository;
import com.padelvision.domain.user.User;
import com.padelvision.domain.user.UserRepository;
import com.padelvision.domain.user.dto.UserResponse;
import com.padelvision.shared.dto.StatsResponse;
import com.padelvision.shared.enums.StreamStatus;
import com.padelvision.shared.pagination.PageResponse;
import com.padelvision.shared.response.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Admin", description = "Admin endpoints")
public class AdminController {

    private final UserRepository userRepository;
    private final ClubRepository clubRepository;
    private final StreamRepository streamRepository;
    private final TournamentRepository tournamentRepository;

    @GetMapping("/users")
    public ResponseEntity<ApiResponse<PageResponse<UserResponse>>> getUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<User> users = userRepository.findAll(PageRequest.of(page, size));
        Page<UserResponse> responsePage = users.map(this::toUserResponse);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.from(responsePage)));
    }

    @GetMapping("/clubs")
    public ResponseEntity<ApiResponse<PageResponse<ClubResponse>>> getClubs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<Club> clubs = clubRepository.findAll(PageRequest.of(page, size));
        Page<ClubResponse> responsePage = clubs.map(this::toClubResponse);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.from(responsePage)));
    }

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<StatsResponse>> getPlatformStats() {
        StatsResponse stats = StatsResponse.builder()
                .totalUsers(userRepository.count())
                .totalClubs(clubRepository.count())
                .totalStreams(streamRepository.count())
                .activeStreams(streamRepository.countByStatus(StreamStatus.LIVE))
                .totalTournaments(tournamentRepository.count())
                .build();
        return ResponseEntity.ok(ApiResponse.ok(stats));
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

    private ClubResponse toClubResponse(Club club) {
        return ClubResponse.builder()
                .id(club.getId())
                .name(club.getName())
                .slug(club.getSlug())
                .city(club.getCity())
                .address(club.getAddress())
                .description(club.getDescription())
                .logo(club.getLogo())
                .banner(club.getBanner())
                .courtCount(club.getCourtCount())
                .plan(club.getPlan() != null ? club.getPlan().name() : null)
                .isVerified(club.isVerified())
                .latitude(club.getLatitude())
                .longitude(club.getLongitude())
                .build();
    }
}
