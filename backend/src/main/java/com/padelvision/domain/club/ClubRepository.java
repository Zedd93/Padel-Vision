package com.padelvision.domain.club;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ClubRepository extends JpaRepository<Club, String> {

    Optional<Club> findBySlug(String slug);

    Optional<Club> findByStreamKey(String streamKey);

    Optional<Club> findByUserId(String userId);

    List<Club> findByLatitudeNotNullAndLongitudeNotNull();
}
