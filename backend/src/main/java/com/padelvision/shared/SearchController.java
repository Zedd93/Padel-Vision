package com.padelvision.shared;

import com.padelvision.domain.club.Club;
import com.padelvision.domain.club.dto.ClubResponse;
import com.padelvision.domain.player.Player;
import com.padelvision.domain.player.dto.PlayerResponse;
import com.padelvision.domain.tournament.Tournament;
import com.padelvision.domain.tournament.dto.TournamentResponse;
import com.padelvision.shared.dto.SearchResponse;
import com.padelvision.shared.response.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/search")
@RequiredArgsConstructor
@Tag(name = "Search", description = "Global search endpoint")
public class SearchController {

    private final SearchService searchService;

    @SuppressWarnings("unchecked")
    @GetMapping
    public ResponseEntity<ApiResponse<SearchResponse>> search(@RequestParam("q") String query) {
        Map<String, Object> results = searchService.search(query);

        List<ClubResponse> clubs = ((List<Club>) results.get("clubs")).stream()
                .map(club -> ClubResponse.builder()
                        .id(club.getId())
                        .name(club.getName())
                        .slug(club.getSlug())
                        .city(club.getCity())
                        .logo(club.getLogo())
                        .build())
                .toList();

        List<TournamentResponse> tournaments = ((List<Tournament>) results.get("tournaments")).stream()
                .map(t -> TournamentResponse.builder()
                        .id(t.getId())
                        .name(t.getName())
                        .clubId(t.getClubId())
                        .date(t.getDate())
                        .build())
                .toList();

        List<PlayerResponse> players = ((List<Player>) results.get("players")).stream()
                .map(p -> PlayerResponse.builder()
                        .id(p.getId())
                        .name(p.getName())
                        .slug(p.getSlug())
                        .avatar(p.getAvatar())
                        .build())
                .toList();

        SearchResponse response = SearchResponse.builder()
                .clubs(clubs)
                .tournaments(tournaments)
                .players(players)
                .build();

        return ResponseEntity.ok(ApiResponse.ok(response));
    }
}
