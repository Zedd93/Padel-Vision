package com.padelvision.domain.tournament.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.time.Instant;

@Data
public class TournamentCreateRequest {
    @NotBlank(message = "Name is required")
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
}
