package com.padelvision.domain.tournament;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

@Repository
public interface TournamentRepository extends JpaRepository<Tournament, String> {

    List<Tournament> findByClubId(String clubId);

    List<Tournament> findByDateGreaterThanEqualOrderByDateAsc(Instant date);

    Page<Tournament> findByClubIdOrderByDateDesc(String clubId, Pageable pageable);
}
