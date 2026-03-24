package com.padelvision.domain.match;

import com.padelvision.domain.match.dto.MatchResponse;
import com.padelvision.domain.match.dto.ScoreSubmitRequest;
import com.padelvision.shared.response.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Tag(name = "Matches", description = "Match and judge score endpoints")
public class MatchController {

    private final MatchService matchService;

    @GetMapping("/matches/{tournamentId}")
    public ResponseEntity<ApiResponse<List<MatchResponse>>> getMatchesByTournament(
            @PathVariable String tournamentId) {
        List<MatchResponse> matches = matchService.getMatchesByTournament(tournamentId).stream()
                .map(this::toMatchResponse)
                .toList();
        return ResponseEntity.ok(ApiResponse.ok(matches));
    }

    @PostMapping("/judge/score")
    public ResponseEntity<ApiResponse<MatchResponse>> submitScore(@Valid @RequestBody ScoreSubmitRequest request) {
        Match match = matchService.submitScore(request.getMatchId(), request.getScore(), request.getStreamId());
        return ResponseEntity.ok(ApiResponse.ok(toMatchResponse(match)));
    }

    private MatchResponse toMatchResponse(Match match) {
        return MatchResponse.builder()
                .id(match.getId())
                .tournamentId(match.getTournamentId())
                .courtNumber(match.getCourtNumber())
                .round(match.getRound())
                .position(match.getPosition())
                .team1Player1(match.getTeam1Player1())
                .team1Player2(match.getTeam1Player2())
                .team2Player1(match.getTeam2Player1())
                .team2Player2(match.getTeam2Player2())
                .score(match.getScore())
                .winnerId(match.getWinnerId())
                .scheduledAt(match.getScheduledAt())
                .startedAt(match.getStartedAt())
                .endedAt(match.getEndedAt())
                .build();
    }
}
