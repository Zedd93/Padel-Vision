package com.padelvision.domain.stream.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class StreamStartRequest {
    @NotBlank(message = "Title is required")
    private String title;
    private String description;
    private String matchId;
}
