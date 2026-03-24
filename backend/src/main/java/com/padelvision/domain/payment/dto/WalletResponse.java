package com.padelvision.domain.payment.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class WalletResponse {
    private String userId;
    private int balance;
}
