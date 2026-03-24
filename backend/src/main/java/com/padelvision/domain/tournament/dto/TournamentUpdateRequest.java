package com.padelvision.domain.tournament.dto;

import lombok.Data;

import java.time.Instant;

@Data
public class TournamentUpdateRequest {
    private String name;
    private String format;
    private String category;
    private String level;
    private Instant date;
    private Instant endDate;
    private Integer maxPairs;
    private Double entryFee;
    private String prizes;
    private Boolean isPPV;
    private Double ppvPrice;
}
