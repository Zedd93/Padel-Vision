package com.padelvision.domain.stream;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, String> {

    List<ChatMessage> findByStreamIdOrderByCreatedAtAsc(String streamId);

    Page<ChatMessage> findByStreamIdOrderByCreatedAtDesc(String streamId, Pageable pageable);
}
