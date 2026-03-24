package com.padelvision.domain.club;

import com.padelvision.domain.club.dto.AnalyticsResponse;
import com.padelvision.domain.club.dto.ClubMapResponse;
import com.padelvision.domain.club.dto.ClubResponse;
import com.padelvision.domain.club.dto.ClubUpdateRequest;
import com.padelvision.domain.stream.Stream;
import com.padelvision.domain.stream.StreamRepository;
import com.padelvision.shared.enums.StreamStatus;
import com.padelvision.shared.response.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/clubs")
@RequiredArgsConstructor
@Tag(name = "Clubs", description = "Club endpoints")
public class ClubController {

    private final ClubService clubService;
    private final StreamRepository streamRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<ClubResponse>>> getClubs() {
        List<ClubResponse> clubs = clubService.getClubs().stream()
                .map(this::toClubResponse)
                .toList();
        return ResponseEntity.ok(ApiResponse.ok(clubs));
    }

    @GetMapping("/{slug}")
    public ResponseEntity<ApiResponse<ClubResponse>> getClubBySlug(@PathVariable String slug) {
        Club club = clubService.getClubBySlug(slug);
        ClubResponse response = toClubResponse(club);
        response.setFollowersCount(clubService.getFollowerCount(club.getId()));
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/live-map")
    public ResponseEntity<ApiResponse<List<ClubMapResponse>>> getLiveMapClubs() {
        List<Map<String, Object>> mapData = clubService.getLiveMapClubs();
        List<ClubMapResponse> responses = mapData.stream()
                .map(m -> ClubMapResponse.builder()
                        .id((String) m.get("id"))
                        .name((String) m.get("name"))
                        .slug((String) m.get("slug"))
                        .city((String) m.get("city"))
                        .latitude(m.get("lat") != null ? (Double) m.get("lat") : null)
                        .longitude(m.get("lng") != null ? (Double) m.get("lng") : null)
                        .isLive((Boolean) m.get("isLive"))
                        .viewerCount(m.get("viewers") != null ? (Integer) m.get("viewers") : 0)
                        .build())
                .toList();
        return ResponseEntity.ok(ApiResponse.ok(responses));
    }

    @GetMapping("/settings")
    @PreAuthorize("hasRole('CLUB')")
    public ResponseEntity<ApiResponse<ClubResponse>> getClubSettings() {
        String userId = getAuthenticatedUserId();
        Club club = clubService.getClubSettings(userId);
        return ResponseEntity.ok(ApiResponse.ok(toClubResponse(club)));
    }

    @PutMapping("/settings")
    @PreAuthorize("hasRole('CLUB')")
    public ResponseEntity<ApiResponse<ClubResponse>> updateClubSettings(@Valid @RequestBody ClubUpdateRequest request) {
        String userId = getAuthenticatedUserId();
        Club club = clubService.updateClubSettings(
                userId,
                request.getName(),
                request.getDescription(),
                request.getLogo(),
                request.getBanner(),
                request.getCity(),
                request.getAddress(),
                null, null
        );
        return ResponseEntity.ok(ApiResponse.ok(toClubResponse(club)));
    }

    @GetMapping("/analytics")
    @PreAuthorize("hasRole('CLUB')")
    public ResponseEntity<ApiResponse<AnalyticsResponse>> getClubAnalytics() {
        String userId = getAuthenticatedUserId();
        Club club = clubService.getClubSettings(userId);
        Map<String, Object> analytics = clubService.getClubAnalytics(club.getId());

        AnalyticsResponse response = AnalyticsResponse.builder()
                .totalStreams(toLong(analytics.get("subscriptionCount")))
                .totalViewers(toLong(analytics.get("totalRevenue")))
                .avgViewers(0)
                .peakConcurrent(0)
                .totalFollowers(clubService.getFollowerCount(club.getId()))
                .build();
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    private String getAuthenticatedUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth.getName();
    }

    private long toLong(Object value) {
        if (value instanceof Number) {
            return ((Number) value).longValue();
        }
        return 0L;
    }

    private ClubResponse toClubResponse(Club club) {
        List<Stream> liveStreams = streamRepository.findByClubIdAndStatus(club.getId(), StreamStatus.LIVE);
        int currentViewers = liveStreams.stream().mapToInt(Stream::getViewerCount).sum();

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
                .followersCount(clubService.getFollowerCount(club.getId()))
                .streamsCount(club.getStreams() != null ? club.getStreams().size() : 0)
                .isLive(!liveStreams.isEmpty())
                .currentViewers(currentViewers)
                .build();
    }
}
