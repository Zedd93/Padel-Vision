package com.padelvision.domain.match;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MatchRepository extends JpaRepository<Match, String> {

    List<Match> findByTournamentId(String tournamentId);

    List<Match> findByTournamentIdOrderByRoundAscPositionAsc(String tournamentId);
}
