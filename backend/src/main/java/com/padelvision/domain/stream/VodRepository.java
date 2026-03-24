package com.padelvision.domain.stream;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface VodRepository extends JpaRepository<Vod, String> {

    Optional<Vod> findByStreamId(String streamId);
}
