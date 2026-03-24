package com.padelvision.domain.club;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PlaytomicIntegrationRepository extends JpaRepository<PlaytomicIntegration, String> {

    Optional<PlaytomicIntegration> findByClubId(String clubId);

    void deleteByClubId(String clubId);
}
