package com.padelvision.domain.payment;

import com.padelvision.domain.payment.dto.WalletResponse;
import com.padelvision.shared.response.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
@Tag(name = "Wallet", description = "User wallet endpoints")
public class WalletController {

    private final PaymentService paymentService;

    @GetMapping("/{userId}/wallet")
    public ResponseEntity<ApiResponse<WalletResponse>> getWallet(@PathVariable String userId) {
        Map<String, Object> walletData = paymentService.getUserWallet(userId);

        WalletResponse response = WalletResponse.builder()
                .userId(userId)
                .balance(walletData.get("balance") != null ? ((Number) walletData.get("balance")).intValue() : 0)
                .build();
        return ResponseEntity.ok(ApiResponse.ok(response));
    }
}
