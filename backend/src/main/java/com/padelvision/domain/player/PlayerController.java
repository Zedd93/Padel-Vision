package com.padelvision.domain.player;

import com.padelvision.domain.player.dto.PlayerResponse;
import com.padelvision.shared.response.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/players")
@RequiredArgsConstructor
@Tag(name = "Players", description = "Player endpoints")
public class PlayerController {

    private final PlayerService playerService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<PlayerResponse>>> getPlayers(
            @RequestParam(required = false) String clubId) {
        List<PlayerResponse> players = playerService.getPlayers(clubId).stream()
                .map(this::toPlayerResponse)
                .toList();
        return ResponseEntity.ok(ApiResponse.ok(players));
    }

    @GetMapping("/{slug}")
    public ResponseEntity<ApiResponse<PlayerResponse>> getPlayerBySlug(@PathVariable String slug) {
        Player player = playerService.getPlayerBySlug(slug);
        PlayerResponse response = toPlayerResponse(player);
        response.setFollowersCount(playerService.getFollowerCount(player.getId()));
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/rankings")
    public ResponseEntity<ApiResponse<List<PlayerResponse>>> getRankings() {
        List<PlayerResponse> players = playerService.getRankings().stream()
                .map(this::toPlayerResponse)
                .toList();
        return ResponseEntity.ok(ApiResponse.ok(players));
    }

    private PlayerResponse toPlayerResponse(Player player) {
        return PlayerResponse.builder()
                .id(player.getId())
                .name(player.getName())
                .slug(player.getSlug())
                .clubId(player.getClubId())
                .avatar(player.getAvatar())
                .stats(player.getStats())
                .clubName(player.getClub() != null ? player.getClub().getName() : null)
                .followersCount(0)
                .build();
    }
}
