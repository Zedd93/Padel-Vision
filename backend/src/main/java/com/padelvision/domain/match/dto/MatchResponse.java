package com.padelvision.domain.match.dto;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.Map;

@Data
@Builder
public class MatchResponse {
    private String id;
    private String tournamentId;
    private Integer courtNumber;
    private Integer round;
    private Integer position;
    private String team1Player1;
    private String team1Player2;
    private String team2Player1;
    private String team2Player2;
    private Map<String, Object> score;
    private String winnerId;
    private Instant scheduledAt;
    private Instant startedAt;
    private Instant endedAt;
}
