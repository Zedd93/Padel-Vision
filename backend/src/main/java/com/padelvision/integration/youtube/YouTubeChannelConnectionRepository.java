package com.padelvision.integration.youtube;

import com.padelvision.shared.enums.YouTubeConnectionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface YouTubeChannelConnectionRepository extends JpaRepository<YouTubeChannelConnection, String> {

    Optional<YouTubeChannelConnection> findByClubId(String clubId);

    Optional<YouTubeChannelConnection> findByChannelId(String channelId);

    List<YouTubeChannelConnection> findByStatus(YouTubeConnectionStatus status);
}
