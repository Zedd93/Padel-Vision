package com.padelvision.domain.payment.dto;

import jakarta.validation.constraints.Min;
import lombok.Data;

@Data
public class BuyBitsRequest {
    @Min(value = 1, message = "Amount must be at least 1")
    private int amount;
    private String packageId;
}
