package com.padelvision.domain.stream;

import com.padelvision.domain.club.Club;
import com.padelvision.domain.club.ClubRepository;
import com.padelvision.domain.match.Match;
import com.padelvision.domain.match.MatchRepository;
import com.padelvision.shared.enums.StreamStatus;
import com.padelvision.shared.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class StreamService {

    private final StreamRepository streamRepository;
    private final ClubRepository clubRepository;
    private final MatchRepository matchRepository;

    @Value("${padelvision.hls.base-url:http://localhost:8000}")
    private String hlsBaseUrl;

    /**
     * Get all live streams with club info (ordered by viewer count desc).
     * Mirrors: GET /api/streams/live
     */
    @Transactional(readOnly = true)
    public List<Stream> getLiveStreams() {
        List<Stream> streams = streamRepository.findByStatus(StreamStatus.LIVE);
        // Eagerly touch club data for serialization
        streams.forEach(s -> {
            if (s.getClub() != null) {
                s.getClub().getName();
            }
        });
        return streams;
    }

    /**
     * Get a single stream by ID with club, match and tags.
     * Mirrors: GET /api/streams/:id
     */
    @Transactional(readOnly = true)
    public Stream getStreamById(String id) {
        Stream stream = streamRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Stream", "id", id));
        // Initialize lazy associations
        if (stream.getClub() != null) {
            stream.getClub().getName();
        }
        if (stream.getMatch() != null) {
            stream.getMatch().getId();
        }
        if (stream.getTags() != null) {
            stream.getTags().size();
        }
        return stream;
    }

    /**
     * Create a stream entry (status OFFLINE until RTMP connects).
     * Mirrors: POST /api/club/stream/start
     */
    @Transactional
    public Stream startStream(String clubId, String title, String matchId) {
        Club club = clubRepository.findById(clubId)
                .orElseThrow(() -> new ResourceNotFoundException("Club", "id", clubId));

        Stream.StreamBuilder builder = Stream.builder()
                .clubId(clubId)
                .club(club)
                .title(title != null ? title : club.getName() + " \u2014 Na \u017cywo")
                .status(StreamStatus.OFFLINE)
                .hlsUrl(hlsBaseUrl + "/" + club.getStreamKey() + "/master.m3u8");

        if (matchId != null) {
            Match match = matchRepository.findById(matchId).orElse(null);
            if (match != null) {
                builder.match(match).matchId(matchId);
            }
        }

        Stream stream = builder.build();
        stream = streamRepository.save(stream);

        log.info("Stream created for club {} (stream {}), awaiting RTMP", club.getName(), stream.getId());
        return stream;
    }

    /**
     * Stop all live streams for a club.
     * Mirrors: POST /api/club/stream/stop
     */
    @Transactional
    public int stopStream(String clubId) {
        List<Stream> liveStreams = streamRepository.findByClubIdAndStatus(clubId, StreamStatus.LIVE);
        Instant now = Instant.now();

        for (Stream stream : liveStreams) {
            stream.setStatus(StreamStatus.OFFLINE);
            stream.setEndedAt(now);
        }

        streamRepository.saveAll(liveStreams);
        log.info("Stopped {} live stream(s) for club {}", liveStreams.size(), clubId);
        return liveStreams.size();
    }

    /**
     * Update the live score on a stream's linked match and broadcast via WebSocket.
     * Mirrors: PUT /api/club/stream/:id/score
     */
    @Transactional
    public void updateScore(String streamId, Map<String, Object> scoreData) {
        Stream stream = streamRepository.findById(streamId)
                .orElseThrow(() -> new ResourceNotFoundException("Stream", "id", streamId));

        if (stream.getMatchId() != null) {
            Match match = matchRepository.findById(stream.getMatchId())
                    .orElseThrow(() -> new ResourceNotFoundException("Match", "id", stream.getMatchId()));
            match.setScore(scoreData);
            matchRepository.save(match);
        }

        // WebSocket broadcast would be handled in the controller/WebSocket layer
        log.debug("Score updated for stream {}", streamId);
    }

    /**
     * Handle RTMP publish event: find club by stream key, create LIVE stream.
     * Mirrors: POST /api/webhooks/rtmp (event=publish)
     */
    @Transactional
    public Stream handleRtmpPublish(String streamKey) {
        Club club = clubRepository.findByStreamKey(streamKey)
                .orElseThrow(() -> new ResourceNotFoundException("Club", "streamKey", streamKey));

        Stream stream = Stream.builder()
                .clubId(club.getId())
                .club(club)
                .title(club.getName() + " \u2014 Na \u017cywo")
                .status(StreamStatus.LIVE)
                .hlsUrl(hlsBaseUrl + "/" + streamKey + "/master.m3u8")
                .startedAt(Instant.now())
                .build();

        stream = streamRepository.save(stream);
        log.info("[RTMP] Stream LIVE: {} ({})", club.getName(), stream.getId());
        return stream;
    }

    /**
     * Handle RTMP unpublish event: set all live streams for club to OFFLINE.
     * Mirrors: POST /api/webhooks/rtmp (event=unpublish)
     */
    @Transactional
    public void handleRtmpUnpublish(String streamKey) {
        Club club = clubRepository.findByStreamKey(streamKey)
                .orElseThrow(() -> new ResourceNotFoundException("Club", "streamKey", streamKey));

        List<Stream> liveStreams = streamRepository.findByClubIdAndStatus(club.getId(), StreamStatus.LIVE);
        Instant now = Instant.now();

        for (Stream stream : liveStreams) {
            stream.setStatus(StreamStatus.OFFLINE);
            stream.setEndedAt(now);
        }

        streamRepository.saveAll(liveStreams);
        log.info("[RTMP] Stream OFFLINE: {} ({} streams)", club.getName(), liveStreams.size());
    }
}
