package com.padelvision.domain.tournament.dto;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;

@Data
@Builder
public class TournamentResponse {
    private String id;
    private String clubId;
    private String name;
    private String format;
    private String category;
    private String level;
    private Instant date;
    private Instant endDate;
    private Integer maxPairs;
    private Double entryFee;
    private String prizes;
    private boolean isPPV;
    private Double ppvPrice;
    private String clubName;
    private String clubCity;
}
