package com.padelvision.domain.payment.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CancelSubRequest {
    @NotBlank(message = "Subscription ID is required")
    private String subscriptionId;
}
