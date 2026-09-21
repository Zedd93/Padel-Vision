package com.padelvision.integration.youtube;

import com.padelvision.domain.stream.Stream;
import com.padelvision.domain.stream.StreamRepository;
import com.padelvision.integration.youtube.dto.BroadcastState;
import com.padelvision.shared.enums.StreamStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Zastępuje webhook RTMP: cyklicznie pyta YouTube o stan transmisji i
 * przepisuje go na {@link StreamStatus}.
 * <p>
 * Odpytujemy wyłącznie transmisje, które mają broadcast i nie mają jeszcze
 * {@code endedAt} — zakończone wypadają z pollingu i nie zużywają quoty.
 * Zapytania są grupowane po klubie, bo każde wywołanie wymaga tokenu
 * właściciela kanału; jedno zapytanie obejmuje do 50 transmisji klubu
 * i kosztuje 1 jednostkę.
 * <p>
 * Klub, dla którego YouTube zwróci błąd (cofnięta zgoda, wyczerpana quota),
 * jest pomijany — pozostałe kluby są przetwarzane normalnie.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class YouTubeStatusPoller {

    private static final List<StreamStatus> PENDING_STATUSES =
            List.of(StreamStatus.OFFLINE, StreamStatus.LIVE);

    private final StreamRepository streamRepository;
    private final YouTubeLiveService liveService;
    private final YouTubeProperties properties;

    @Scheduled(fixedDelayString = "${youtube.poll-interval-ms:60000}")
    public void pollBroadcastStates() {
        if (!properties.isConfigured()) {
            return;
        }

        List<Stream> pending = streamRepository
                .findByYoutubeBroadcastIdIsNotNullAndEndedAtIsNullAndStatusIn(PENDING_STATUSES);
        if (pending.isEmpty()) {
            return;
        }

        Map<String, List<Stream>> byClub = pending.stream()
                .collect(Collectors.groupingBy(Stream::getClubId));

        for (Map.Entry<String, List<Stream>> entry : byClub.entrySet()) {
            try {
                pollClub(entry.getKey(), entry.getValue());
            } catch (RuntimeException e) {
                log.warn("[YouTube] Pominięto klub {} przy odpytywaniu statusów: {}",
                        entry.getKey(), e.getMessage());
            }
        }
    }

    private void pollClub(String clubId, List<Stream> streams) {
        List<String> broadcastIds = streams.stream()
                .map(Stream::getYoutubeBroadcastId)
                .toList();

        Map<String, BroadcastState> states = liveService.fetchBroadcastStates(clubId, broadcastIds);

        for (Stream stream : streams) {
            BroadcastState state = states.get(stream.getYoutubeBroadcastId());
            if (state == null) {
                // YouTube nie zna tej transmisji — najpewniej usunięta ręcznie
                log.warn("[YouTube] Transmisja {} nieznana w YouTube — oznaczam jako zakończoną",
                        stream.getYoutubeBroadcastId());
                markEnded(stream);
                streamRepository.save(stream);
                continue;
            }

            if (apply(stream, state)) {
                streamRepository.save(stream);
            }
        }
    }

    /** @return true, gdy transmisja wymaga zapisu */
    private boolean apply(Stream stream, BroadcastState state) {
        boolean changed = false;

        if (state.isLive()) {
            if (stream.getStatus() != StreamStatus.LIVE) {
                stream.setStatus(StreamStatus.LIVE);
                stream.setStartedAt(stream.getStartedAt() != null ? stream.getStartedAt() : Instant.now());
                log.info("[YouTube] Transmisja {} weszła na żywo", stream.getYoutubeBroadcastId());
                changed = true;
            }
            if (state.concurrentViewers() != stream.getViewerCount()) {
                stream.setViewerCount(state.concurrentViewers());
                changed = true;
            }
            if (state.concurrentViewers() > stream.getPeakViewers()) {
                stream.setPeakViewers(state.concurrentViewers());
                changed = true;
            }
        } else if (state.isFinished()) {
            log.info("[YouTube] Transmisja {} zakończona ({})",
                    stream.getYoutubeBroadcastId(), state.lifeCycleStatus());
            markEnded(stream);
            changed = true;
        }
        // created / ready / testing — czekamy na sygnał z OBS, nic nie zmieniamy

        return changed;
    }

    private void markEnded(Stream stream) {
        stream.setStatus(StreamStatus.OFFLINE);
        stream.setEndedAt(Instant.now());
        stream.setViewerCount(0);
    }
}
