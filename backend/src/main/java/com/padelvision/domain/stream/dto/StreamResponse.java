package com.padelvision.domain.stream.dto;

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
    private String hlsUrl;
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
}
