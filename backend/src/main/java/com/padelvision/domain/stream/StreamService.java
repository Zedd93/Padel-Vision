package com.padelvision.domain.stream;

import com.padelvision.domain.club.Club;
import com.padelvision.domain.club.ClubRepository;
import com.padelvision.domain.match.Match;
import com.padelvision.domain.match.MatchRepository;
import com.padelvision.integration.youtube.YouTubeLiveService;
import com.padelvision.integration.youtube.YouTubeProperties;
import com.padelvision.shared.enums.StreamStatus;
import com.padelvision.shared.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
    private final YouTubeLiveService youTubeLiveService;
    private final YouTubeProperties youTubeProperties;

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
     * Tworzy transmisj\u0119 na kanale YouTube klubu i zapisuje j\u0105 jako OFFLINE.
     * Na \u017cywo wchodzi sama, gdy OBS zacznie nadawa\u0107 \u2014 wykrywa to
     * {@code YouTubeStatusPoller}.
     * Mirrors: POST /api/club/stream/start
     */
    @Transactional
    public Stream startStream(String clubId, String title, String matchId) {
        Club club = clubRepository.findById(clubId)
                .orElseThrow(() -> new ResourceNotFoundException("Club", "id", clubId));

        String streamTitle = title != null ? title : club.getName() + " \u2014 Na \u017cywo";
        String broadcastId = youTubeLiveService.createBroadcast(clubId, streamTitle, club.getDescription());

        Stream.StreamBuilder builder = Stream.builder()
                .clubId(clubId)
                .club(club)
                .title(streamTitle)
                .status(StreamStatus.OFFLINE)
                .youtubeBroadcastId(broadcastId)
                // dla transmisji na \u017cywo id broadcastu jest zarazem id filmu
                .youtubeVideoId(broadcastId)
                .youtubePrivacy(youTubeProperties.getDefaultPrivacy())
                .latencyPreference(youTubeProperties.getDefaultLatency())
                // miniatura generowana przez YouTube \u2014 zero koszt\u00f3w po naszej stronie
                .thumbnailUrl("https://i.ytimg.com/vi/" + broadcastId + "/maxresdefault.jpg");

        if (matchId != null) {
            Match match = matchRepository.findById(matchId).orElse(null);
            if (match != null) {
                builder.match(match).matchId(matchId);
            }
        }

        Stream stream = builder.build();
        stream = streamRepository.save(stream);

        log.info("Stream created for club {} (stream {}, broadcast {}), awaiting OBS",
                club.getName(), stream.getId(), broadcastId);
        return stream;
    }

    /**
     * Kończy transmisje klubu — także te, które czekają jeszcze na sygnał
     * z OBS, żeby nie zostawiać w YouTube wiszących broadcastów.
     * Mirrors: POST /api/club/stream/stop
     */
    @Transactional
    public int stopStream(String clubId) {
        List<Stream> active =
                streamRepository.findByClubIdAndEndedAtIsNullAndYoutubeBroadcastIdIsNotNull(clubId);
        Instant now = Instant.now();

        for (Stream stream : active) {
            youTubeLiveService.endBroadcast(clubId, stream.getYoutubeBroadcastId());
            stream.setStatus(StreamStatus.OFFLINE);
            stream.setEndedAt(now);
            stream.setViewerCount(0);
        }

        streamRepository.saveAll(active);
        log.info("Stopped {} stream(s) for club {}", active.size(), clubId);
        return active.size();
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

}
