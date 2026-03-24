package com.padelvision.shared.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class StatsResponse {
    private long totalUsers;
    private long totalClubs;
    private long totalStreams;
    private long activeStreams;
    private long totalTournaments;
}
