package com.padelvision.domain.match.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.Map;

@Data
public class ScoreSubmitRequest {
    @NotBlank(message = "Match ID is required")
    private String matchId;
    private Map<String, Object> score;
    private String streamId;
}
