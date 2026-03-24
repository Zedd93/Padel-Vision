package com.padelvision.domain.stream.dto;

import lombok.Data;

import java.util.Map;

@Data
public class ScoreUpdateRequest {
    private Map<String, Object> score;
}
