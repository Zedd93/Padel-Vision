package com.padelvision.integration.youtube;

import com.fasterxml.jackson.databind.JsonNode;
import com.padelvision.integration.youtube.dto.BroadcastState;
import com.padelvision.integration.youtube.dto.IngestTarget;
import com.padelvision.shared.exception.BadRequestException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;

import java.time.Instant;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Cykl życia transmisji na YouTube.
 * <p>
 * Model jest taki: każdy klub ma <b>jeden</b> wielokrotnego użytku obiekt
 * {@code liveStream} (stały adres RTMP i klucz do OBS), a każdy mecz to nowy
 * {@code liveBroadcast} podpięty pod ten sam strumień. Dzięki temu klub
 * konfiguruje OBS raz, a my oszczędzamy quotę.
 * <p>
 * Koszty quoty (limit dobowy to domyślnie 10 000 jednostek):
 * <ul>
 *   <li>liveStreams.insert — 50, raz na klub</li>
 *   <li>liveBroadcasts.insert + bind — 100 na transmisję</li>
 *   <li>liveBroadcasts.list — 1, niezależnie od liczby id w zapytaniu</li>
 *   <li>liveBroadcasts.transition — 50, tylko przy ręcznym zakończeniu</li>
 * </ul>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class YouTubeLiveService {

    private static final int QUOTA_INSERT = 50;
    private static final int QUOTA_BIND = 50;
    private static final int QUOTA_LIST = 1;
    private static final int QUOTA_TRANSITION = 50;

    /** YouTube przyjmuje maksymalnie 50 identyfikatorów w jednym zapytaniu list. */
    static final int MAX_IDS_PER_REQUEST = 50;

    private final YouTubeApiClient api;
    private final YouTubeChannelConnectionRepository connectionRepository;
    private final YouTubeProperties properties;

    /* ─── Strumień wielokrotnego użytku (raz na klub) ─────────── */

    /**
     * Zwraca cel RTMP klubu, tworząc go przy pierwszym wywołaniu.
     * Dane ingestu lądują w {@link YouTubeChannelConnection}, więc Studio
     * pokazuje je bez odpytywania YouTube.
     */
    @Transactional
    public IngestTarget ensureReusableStream(String clubId) {
        YouTubeChannelConnection connection = connectionRepository.findByClubId(clubId)
                .orElseThrow(() -> new BadRequestException(
                        "Klub nie ma połączonego kanału YouTube — połącz go w Studio"));

        if (connection.getReusableStreamId() != null && connection.getIngestStreamName() != null) {
            return new IngestTarget(
                    connection.getReusableStreamId(),
                    connection.getIngestAddress(),
                    connection.getIngestStreamName());
        }

        Map<String, Object> body = Map.of(
                "snippet", Map.of("title", "PadelVision — " + connection.getChannelTitle()),
                "cdn", Map.of(
                        "frameRate", "variable",
                        "ingestionType", "rtmp",
                        "resolution", "variable"),
                "contentDetails", Map.of("isReusable", true));

        JsonNode created = api.post(clubId, "/liveStreams",
                params("part", "snippet,cdn,contentDetails,status"), body, QUOTA_INSERT);

        JsonNode ingestion = created.path("cdn").path("ingestionInfo");
        IngestTarget target = new IngestTarget(
                created.path("id").asText(),
                ingestion.path("ingestionAddress").asText(),
                ingestion.path("streamName").asText());

        connection.setReusableStreamId(target.streamId());
        connection.setIngestAddress(target.ingestAddress());
        connection.setIngestStreamName(target.streamName());
        connectionRepository.save(connection);

        log.info("[YouTube] Utworzono stały strumień RTMP dla klubu {} (stream {})",
                clubId, target.streamId());
        return target;
    }

    /* ─── Transmisja ──────────────────────────────────────────── */

    /**
     * Tworzy transmisję i wiąże ją ze stałym strumieniem klubu.
     * <p>
     * {@code enableAutoStart} sprawia, że YouTube przechodzi na żywo sam,
     * gdy OBS zacznie nadawać, a {@code enableAutoStop} kończy transmisję po
     * zaniku sygnału. Dzięki temu nie potrzebujemy webhooka RTMP ani ręcznych
     * przejść stanu — i oszczędzamy 100 jednostek quoty na transmisję.
     *
     * @return identyfikator transmisji, który jest zarazem id filmu na YouTube
     */
    @Transactional
    public String createBroadcast(String clubId, String title, String description) {
        IngestTarget target = ensureReusableStream(clubId);

        Map<String, Object> snippet = new HashMap<>();
        snippet.put("title", trimTitle(title));
        snippet.put("scheduledStartTime", Instant.now().toString());
        if (description != null && !description.isBlank()) {
            snippet.put("description", description);
        }

        Map<String, Object> body = Map.of(
                "snippet", snippet,
                "status", Map.of(
                        "privacyStatus", properties.getDefaultPrivacy(),
                        // wymagane przez COPPA — transmisje z padla nie są dla dzieci
                        "selfDeclaredMadeForKids", false),
                "contentDetails", Map.of(
                        "enableAutoStart", true,
                        "enableAutoStop", true,
                        "enableDvr", true,
                        "enableEmbed", true,
                        "recordFromStart", true,
                        "latencyPreference", properties.getDefaultLatency(),
                        // monitor stream musi być wyłączony, żeby autoStart działał
                        "monitorStream", Map.of("enableMonitorStream", false)));

        JsonNode broadcast = api.post(clubId, "/liveBroadcasts",
                params("part", "snippet,contentDetails,status"), body, QUOTA_INSERT);

        String broadcastId = broadcast.path("id").asText();
        if (broadcastId.isBlank()) {
            throw new BadRequestException("YouTube nie zwrócił identyfikatora transmisji");
        }

        bind(clubId, broadcastId, target.streamId());

        log.info("[YouTube] Klub {} — transmisja {} gotowa, czeka na sygnał z OBS",
                clubId, broadcastId);
        return broadcastId;
    }

    private void bind(String clubId, String broadcastId, String streamId) {
        MultiValueMap<String, String> query = new LinkedMultiValueMap<>();
        query.add("id", broadcastId);
        query.add("streamId", streamId);
        query.add("part", "id,contentDetails");

        api.post(clubId, "/liveBroadcasts/bind", query, null, QUOTA_BIND);
    }

    /**
     * Kończy transmisję ręcznie. Przy {@code enableAutoStop} YouTube zrobi to
     * sam po zaniku sygnału, więc odrzucenie przejścia (transmisja nigdy nie
     * weszła na żywo albo już się zakończyła) nie jest błędem.
     */
    public void endBroadcast(String clubId, String broadcastId) {
        MultiValueMap<String, String> query = new LinkedMultiValueMap<>();
        query.add("id", broadcastId);
        query.add("broadcastStatus", "complete");
        query.add("part", "id,status");

        try {
            api.post(clubId, "/liveBroadcasts/transition", query, null, QUOTA_TRANSITION);
            log.info("[YouTube] Transmisja {} zakończona", broadcastId);
        } catch (BadRequestException e) {
            log.warn("[YouTube] Nie udało się zakończyć transmisji {} przez API ({}). "
                    + "YouTube zakończy ją sam po zaniku sygnału", broadcastId, e.getMessage());
        }
    }

    /* ─── Odczyt stanu ────────────────────────────────────────── */

    /**
     * Pobiera stan wielu transmisji jednego klubu. Całe zapytanie kosztuje
     * 1 jednostkę niezależnie od liczby identyfikatorów, więc poller zawsze
     * grupuje transmisje po klubie i woła to raz.
     * <p>
     * Identyfikatory nieznane YouTube po prostu nie wracają w odpowiedzi.
     */
    public Map<String, BroadcastState> fetchBroadcastStates(String clubId, List<String> broadcastIds) {
        Map<String, BroadcastState> states = new LinkedHashMap<>();
        if (broadcastIds.isEmpty()) {
            return states;
        }

        for (int from = 0; from < broadcastIds.size(); from += MAX_IDS_PER_REQUEST) {
            List<String> chunk = broadcastIds.subList(
                    from, Math.min(from + MAX_IDS_PER_REQUEST, broadcastIds.size()));

            MultiValueMap<String, String> query = new LinkedMultiValueMap<>();
            query.add("part", "status,statistics");
            query.add("id", String.join(",", chunk));
            query.add("maxResults", String.valueOf(MAX_IDS_PER_REQUEST));

            JsonNode response = api.get(clubId, "/liveBroadcasts", query, QUOTA_LIST);

            for (JsonNode item : response.path("items")) {
                states.put(item.path("id").asText(), new BroadcastState(
                        item.path("status").path("lifeCycleStatus").asText("unknown"),
                        item.path("statistics").path("concurrentViewers").asInt(0)));
            }
        }
        return states;
    }

    /* ─── Pomocnicze ──────────────────────────────────────────── */

    /** YouTube odrzuca tytuły dłuższe niż 100 znaków. */
    private String trimTitle(String title) {
        if (title == null || title.isBlank()) {
            return "PadelVision — transmisja na żywo";
        }
        return title.length() <= 100 ? title : title.substring(0, 97) + "...";
    }

    private MultiValueMap<String, String> params(String key, String value) {
        MultiValueMap<String, String> query = new LinkedMultiValueMap<>();
        query.add(key, value);
        return query;
    }
}
