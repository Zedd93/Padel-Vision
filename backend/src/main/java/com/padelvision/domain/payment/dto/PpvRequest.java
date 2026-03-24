package com.padelvision.domain.payment.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class PpvRequest {
    @NotBlank(message = "Stream ID is required")
    private String streamId;
}
