package com.padelvision.domain.tournament;

import com.padelvision.domain.club.Club;
import com.padelvision.domain.club.ClubRepository;
import com.padelvision.shared.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class TournamentService {

    private final TournamentRepository tournamentRepository;
    private final ClubRepository clubRepository;

    /**
     * Get all tournaments with club info.
     * Mirrors: GET /api/tournaments
     */
    @Transactional(readOnly = true)
    public List<Tournament> getTournaments() {
        List<Tournament> tournaments = tournamentRepository.findAll();
        // Initialize club data for serialization
        tournaments.forEach(t -> {
            if (t.getClub() != null) {
                t.getClub().getName();
            }
        });
        return tournaments;
    }

    /**
     * Get tournaments by club with pagination.
     */
    @Transactional(readOnly = true)
    public Page<Tournament> getTournamentsByClub(String clubId, Pageable pageable) {
        return tournamentRepository.findByClubIdOrderByDateDesc(clubId, pageable);
    }

    /**
     * Get trending/upcoming tournaments (date >= now).
     * Mirrors: GET /api/tournaments/trending
     */
    @Transactional(readOnly = true)
    public List<Tournament> getTrendingTournaments() {
        List<Tournament> tournaments = tournamentRepository
                .findByDateGreaterThanEqualOrderByDateAsc(Instant.now());
        // Initialize club data
        tournaments.forEach(t -> {
            if (t.getClub() != null) {
                t.getClub().getName();
            }
        });
        return tournaments;
    }

    /**
     * Create a new tournament for a club.
     */
    @Transactional
    public Tournament createTournament(String clubId, String name, String format,
                                       String category, String level,
                                       Instant date, Instant endDate,
                                       Integer maxPairs, Double entryFee,
                                       String prizes, boolean isPPV, Double ppvPrice) {
        Club club = clubRepository.findById(clubId)
                .orElseThrow(() -> new ResourceNotFoundException("Club", "id", clubId));

        Tournament tournament = Tournament.builder()
                .club(club)
                .name(name)
                .date(date)
                .endDate(endDate)
                .maxPairs(maxPairs)
                .entryFee(entryFee)
                .prizes(prizes)
                .isPPV(isPPV)
                .ppvPrice(ppvPrice)
                .build();

        // Set enums if provided
        if (format != null) {
            tournament.setFormat(com.padelvision.shared.enums.TournamentFormat.valueOf(format));
        }
        if (category != null) {
            tournament.setCategory(com.padelvision.shared.enums.TournamentCategory.valueOf(category));
        }
        if (level != null) {
            tournament.setLevel(com.padelvision.shared.enums.TournamentLevel.valueOf(level));
        }

        tournament = tournamentRepository.save(tournament);
        log.info("Tournament created: {} for club {}", tournament.getId(), clubId);
        return tournament;
    }

    /**
     * Update an existing tournament.
     */
    @Transactional
    public Tournament updateTournament(String id, String name, Instant date,
                                       Instant endDate, Integer maxPairs,
                                       Double entryFee, String prizes,
                                       Boolean isPPV, Double ppvPrice) {
        Tournament tournament = tournamentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Tournament", "id", id));

        if (name != null) tournament.setName(name);
        if (date != null) tournament.setDate(date);
        if (endDate != null) tournament.setEndDate(endDate);
        if (maxPairs != null) tournament.setMaxPairs(maxPairs);
        if (entryFee != null) tournament.setEntryFee(entryFee);
        if (prizes != null) tournament.setPrizes(prizes);
        if (isPPV != null) tournament.setPPV(isPPV);
        if (ppvPrice != null) tournament.setPpvPrice(ppvPrice);

        tournament = tournamentRepository.save(tournament);
        log.info("Tournament updated: {}", id);
        return tournament;
    }

    /**
     * Delete a tournament by ID.
     */
    @Transactional
    public void deleteTournament(String id) {
        Tournament tournament = tournamentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Tournament", "id", id));
        tournamentRepository.delete(tournament);
        log.info("Tournament deleted: {}", id);
    }
}
