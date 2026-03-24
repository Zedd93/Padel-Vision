package com.padelvision.shared;

import com.padelvision.domain.club.Club;
import com.padelvision.domain.club.ClubRepository;
import com.padelvision.domain.player.Player;
import com.padelvision.domain.player.PlayerRepository;
import com.padelvision.domain.tournament.Tournament;
import com.padelvision.domain.tournament.TournamentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class SearchService {

    private final ClubRepository clubRepository;
    private final TournamentRepository tournamentRepository;
    private final PlayerRepository playerRepository;

    /**
     * Search across clubs, tournaments, and players by name.
     * Mirrors: GET /api/search
     */
    @Transactional(readOnly = true)
    public Map<String, Object> search(String query) {
        Map<String, Object> result = new HashMap<>();

        if (query == null || query.isBlank()) {
            result.put("clubs", List.of());
            result.put("tournaments", List.of());
            result.put("players", List.of());
            return result;
        }

        String trimmed = query.trim();

        // Use JPA findAll and filter in-memory for case-insensitive contains.
        // In production, consider using Specifications or full-text search.
        List<Club> clubs = clubRepository.findAll().stream()
                .filter(c -> c.getName() != null && c.getName().toLowerCase().contains(trimmed.toLowerCase()))
                .limit(5)
                .toList();

        List<Tournament> tournaments = tournamentRepository.findAll().stream()
                .filter(t -> t.getName() != null && t.getName().toLowerCase().contains(trimmed.toLowerCase()))
                .limit(5)
                .toList();

        List<Player> players = playerRepository.findAll().stream()
                .filter(p -> p.getName() != null && p.getName().toLowerCase().contains(trimmed.toLowerCase()))
                .limit(5)
                .toList();

        result.put("clubs", clubs);
        result.put("tournaments", tournaments);
        result.put("players", players);

        return result;
    }
}
