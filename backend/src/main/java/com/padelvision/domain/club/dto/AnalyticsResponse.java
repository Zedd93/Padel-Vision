package com.padelvision.domain.club.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AnalyticsResponse {
    private long totalStreams;
    private long totalViewers;
    private long avgViewers;
    private long peakConcurrent;
    private long totalFollowers;
}
