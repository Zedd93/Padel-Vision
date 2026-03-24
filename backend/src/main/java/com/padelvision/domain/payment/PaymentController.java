package com.padelvision.domain.payment;

import com.padelvision.domain.payment.dto.BuyBitsRequest;
import com.padelvision.domain.payment.dto.CancelSubRequest;
import com.padelvision.domain.payment.dto.CheckoutRequest;
import com.padelvision.domain.payment.dto.PpvRequest;
import com.padelvision.domain.payment.dto.TransactionResponse;
import com.padelvision.shared.response.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/stripe")
@RequiredArgsConstructor
@Tag(name = "Payments", description = "Stripe payment endpoints")
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping("/checkout")
    public ResponseEntity<ApiResponse<Map<String, Object>>> createCheckout(
            @Valid @RequestBody CheckoutRequest request) {
        String userId = getAuthenticatedUserId();
        Map<String, Object> result = paymentService.createCheckoutSession(userId, request.getPriceId(), "subscription");
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @PostMapping("/buy-bits")
    public ResponseEntity<ApiResponse<TransactionResponse>> buyBits(@Valid @RequestBody BuyBitsRequest request) {
        String userId = getAuthenticatedUserId();
        Map<String, Object> result = paymentService.buyBits(userId, request.getPackageId(), request.getAmount());

        TransactionResponse response = TransactionResponse.builder()
                .id((String) result.get("sessionId"))
                .type("BUY_BITS")
                .amount((double) request.getAmount())
                .currency("PLN")
                .build();
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/ppv")
    public ResponseEntity<ApiResponse<TransactionResponse>> purchasePpv(@Valid @RequestBody PpvRequest request) {
        String userId = getAuthenticatedUserId();
        Map<String, Object> result = paymentService.purchasePpv(userId, request.getStreamId(), null);

        TransactionResponse response = TransactionResponse.builder()
                .id((String) result.get("sessionId"))
                .type("PPV")
                .build();
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/cancel-subscription")
    public ResponseEntity<ApiResponse<Void>> cancelSubscription(@Valid @RequestBody CancelSubRequest request) {
        paymentService.cancelSubscription(request.getSubscriptionId());
        return ResponseEntity.ok(ApiResponse.ok(null, "Subscription cancelled"));
    }

    private String getAuthenticatedUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth.getName();
    }
}
