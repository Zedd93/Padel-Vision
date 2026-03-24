package com.padelvision.domain.match;

import com.padelvision.shared.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class MatchService {

    private final MatchRepository matchRepository;

    /**
     * Get all matches for a tournament, ordered by round and position.
     * Mirrors bracket rendering needs.
     */
    @Transactional(readOnly = true)
    public List<Match> getMatchesByTournament(String tournamentId) {
        return matchRepository.findByTournamentIdOrderByRoundAscPositionAsc(tournamentId);
    }

    /**
     * Submit a score for a match (judge panel).
     * Mirrors: POST /api/judge/score
     */
    @Transactional
    public Match submitScore(String matchId, Map<String, Object> score, String streamId) {
        Match match = matchRepository.findById(matchId)
                .orElseThrow(() -> new ResourceNotFoundException("Match", "id", matchId));

        match.setScore(score);
        match = matchRepository.save(match);

        // WebSocket broadcast would be handled in the controller/WebSocket layer
        log.info("Score submitted for match {}", matchId);
        return match;
    }
}
