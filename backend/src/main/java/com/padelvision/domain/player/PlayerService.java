package com.padelvision.domain.player;

import com.padelvision.shared.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class PlayerService {

    private final PlayerRepository playerRepository;
    private final FollowRepository followRepository;

    /**
     * Get player by slug with club info and follower count.
     * Mirrors: GET /api/players/:slug
     */
    @Transactional(readOnly = true)
    public Player getPlayerBySlug(String slug) {
        Player player = playerRepository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Player", "slug", slug));

        // Initialize club data for serialization
        if (player.getClub() != null) {
            player.getClub().getName();
        }

        return player;
    }

    /**
     * Get follower count for a player.
     */
    @Transactional(readOnly = true)
    public long getFollowerCount(String playerId) {
        return followRepository.countByPlayerId(playerId);
    }

    /**
     * Get players, optionally filtered by club.
     * Mirrors: GET /api/players
     */
    @Transactional(readOnly = true)
    public List<Player> getPlayers(String clubId) {
        List<Player> players;
        if (clubId != null) {
            players = playerRepository.findByClubId(clubId);
        } else {
            players = playerRepository.findAll();
        }

        // Initialize club data
        players.forEach(p -> {
            if (p.getClub() != null) {
                p.getClub().getName();
            }
        });

        return players;
    }

    /**
     * Get player rankings sorted by ELO (from stats JSON).
     */
    @Transactional(readOnly = true)
    public List<Player> getRankings() {
        List<Player> players = playerRepository.findAll();

        // Sort by ELO descending (from stats JSON map)
        players.sort(Comparator.<Player, Double>comparing(p -> {
            if (p.getStats() != null && p.getStats().containsKey("elo")) {
                Object elo = p.getStats().get("elo");
                if (elo instanceof Number) {
                    return ((Number) elo).doubleValue();
                }
            }
            return 0.0;
        }).reversed());

        // Initialize club data
        players.forEach(p -> {
            if (p.getClub() != null) {
                p.getClub().getName();
            }
        });

        return players;
    }
}
