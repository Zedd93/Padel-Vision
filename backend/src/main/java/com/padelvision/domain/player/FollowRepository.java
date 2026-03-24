package com.padelvision.domain.player;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FollowRepository extends JpaRepository<Follow, String> {

    Optional<Follow> findByFollowerIdAndClubId(String followerId, String clubId);

    Optional<Follow> findByFollowerIdAndPlayerId(String followerId, String playerId);

    long countByClubId(String clubId);

    long countByPlayerId(String playerId);

    List<Follow> findByFollowerId(String followerId);
}
