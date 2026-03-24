package com.padelvision.domain.payment.dto;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;

@Data
@Builder
public class TransactionResponse {
    private String id;
    private String type;
    private Double amount;
    private String currency;
    private Instant createdAt;
}
