package com.padelvision.domain.stream.dto;

import com.padelvision.domain.stream.Stream;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;

@Data
@Builder
public class StreamResponse {
    private String id;
    private String clubId;
    private String title;
    private String description;
    private String status;

    /** @deprecated pozostałość po własnym HLS — usuwane po migracji na YouTube */
    @Deprecated
    private String hlsUrl;

    private String youtubeVideoId;

    /** Gotowy adres do osadzenia w odtwarzaczu YouTube. */
    private String embedUrl;

    /** normal | low | ultraLow — frontend kompensuje o to opóźnienie overlaya wyniku */
    private String latencyPreference;

    private String thumbnailUrl;
    private int viewerCount;
    private int peakViewers;
    private Instant startedAt;
    private Instant endedAt;
    private Instant createdAt;
    private String clubName;
    private String clubSlug;
    private String clubCity;
    private String clubLogo;

    public static StreamResponse from(Stream stream) {
        String videoId = stream.getYoutubeVideoId();

        return StreamResponse.builder()
                .id(stream.getId())
                .clubId(stream.getClubId())
                .title(stream.getTitle())
                .description(stream.getDescription())
                .status(stream.getStatus() != null ? stream.getStatus().name() : null)
                .hlsUrl(stream.getHlsUrl())
                .youtubeVideoId(videoId)
                .embedUrl(videoId != null ? "https://www.youtube.com/embed/" + videoId : null)
                .latencyPreference(stream.getLatencyPreference())
                .thumbnailUrl(stream.getThumbnailUrl())
                .viewerCount(stream.getViewerCount())
                .peakViewers(stream.getPeakViewers())
                .startedAt(stream.getStartedAt())
                .endedAt(stream.getEndedAt())
                .createdAt(stream.getCreatedAt())
                .clubName(stream.getClub() != null ? stream.getClub().getName() : null)
                .clubSlug(stream.getClub() != null ? stream.getClub().getSlug() : null)
                .clubCity(stream.getClub() != null ? stream.getClub().getCity() : null)
                .clubLogo(stream.getClub() != null ? stream.getClub().getLogo() : null)
                .build();
    }
}
