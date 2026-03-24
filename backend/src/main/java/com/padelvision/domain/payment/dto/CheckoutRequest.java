package com.padelvision.domain.payment.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CheckoutRequest {
    @NotBlank(message = "Price ID is required")
    private String priceId;
    private String successUrl;
    private String cancelUrl;
}
