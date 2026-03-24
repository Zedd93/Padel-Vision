package com.padelvision.domain.stream;

import com.padelvision.shared.enums.StreamStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StreamRepository extends JpaRepository<Stream, String> {

    List<Stream> findByStatus(StreamStatus status);

    List<Stream> findByClubIdAndStatus(String clubId, StreamStatus status);

    List<Stream> findByClubId(String clubId);

    Page<Stream> findByStatusIn(List<StreamStatus> statuses, Pageable pageable);

    long countByStatus(StreamStatus status);
}
