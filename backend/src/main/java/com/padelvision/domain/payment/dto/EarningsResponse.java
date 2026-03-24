package com.padelvision.domain.payment.dto;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;

@Data
@Builder
public class EarningsResponse {
    private double totalEarnings;
    private double monthlyEarnings;
    private double pendingPayout;
    private Instant lastPayoutDate;
}
