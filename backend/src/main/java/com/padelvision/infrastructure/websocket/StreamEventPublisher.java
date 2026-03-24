package com.padelvision.infrastructure.websocket;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Map;

/**
 * Publishes real-time stream events via STOMP WebSocket.
 * Used by StreamService when streams go live/offline.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class StreamEventPublisher {

    private final SimpMessagingTemplate messagingTemplate;

    public void publishStreamLive(String streamId, String clubName, String title) {
        log.info("Publishing stream:live event for stream {}", streamId);
        messagingTemplate.convertAndSend("/topic/streams.events", Map.of(
                "event", "stream:live",
                "streamId", streamId,
                "clubName", clubName,
                "title", title,
                "timestamp", Instant.now().toString()
        ));
    }

    public void publishStreamOffline(String streamId, String clubName) {
        log.info("Publishing stream:offline event for stream {}", streamId);
        messagingTemplate.convertAndSend("/topic/streams.events", Map.of(
                "event", "stream:offline",
                "streamId", streamId,
                "clubName", clubName,
                "timestamp", Instant.now().toString()
        ));
    }

    public void publishScoreUpdate(String streamId, Map<String, Object> score) {
        messagingTemplate.convertAndSend("/topic/stream." + streamId + ".score", score);
    }

    public void publishVodAnalysisProgress(String jobId, int progress, String status) {
        messagingTemplate.convertAndSend("/topic/vod.analysis." + jobId, Map.of(
                "progress", progress,
                "status", status,
                "timestamp", Instant.now().toString()
        ));
    }

    public void publishVodExportProgress(String jobId, int progress, String status) {
        messagingTemplate.convertAndSend("/topic/vod.export." + jobId, Map.of(
                "progress", progress,
                "status", status,
                "timestamp", Instant.now().toString()
        ));
    }
}
