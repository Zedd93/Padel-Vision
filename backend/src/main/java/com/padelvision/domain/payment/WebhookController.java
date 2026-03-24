package com.padelvision.domain.payment;

import com.padelvision.domain.payment.dto.RtmpWebhookRequest;
import com.padelvision.domain.stream.StreamService;
import com.padelvision.shared.response.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/webhooks")
@RequiredArgsConstructor
@Tag(name = "Webhooks", description = "Webhook endpoints for Stripe and RTMP")
public class WebhookController {

    private final PaymentService paymentService;
    private final StreamService streamService;

    @PostMapping("/stripe")
    public ResponseEntity<ApiResponse<Void>> handleStripeWebhook(
            @RequestBody String payload,
            @RequestHeader("Stripe-Signature") String signature) {
        paymentService.handleWebhook(payload, signature);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    @PostMapping("/rtmp")
    public ResponseEntity<ApiResponse<Void>> handleRtmpWebhook(@RequestBody RtmpWebhookRequest request) {
        log.info("RTMP webhook received: action={}, streamKey={}", request.getAction(), request.getStreamKey());

        if ("publish".equals(request.getAction())) {
            streamService.handleRtmpPublish(request.getStreamKey());
        } else if ("unpublish".equals(request.getAction())) {
            streamService.handleRtmpUnpublish(request.getStreamKey());
        }

        return ResponseEntity.ok(ApiResponse.ok(null));
    }
}
