package com.padelvision.domain.stream;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HighlightRepository extends JpaRepository<Highlight, String> {

    List<Highlight> findByVodIdOrderByStartTimeAsc(String vodId);
}
