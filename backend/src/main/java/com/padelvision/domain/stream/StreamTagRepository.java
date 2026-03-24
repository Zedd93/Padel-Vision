package com.padelvision.domain.stream;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StreamTagRepository extends JpaRepository<StreamTag, String> {

    List<StreamTag> findByStreamId(String streamId);

    List<StreamTag> findByTag(String tag);
}
