package com.padelvision.domain.payment;

import com.padelvision.domain.club.ClubService;
import com.padelvision.domain.payment.dto.EarningsResponse;
import com.padelvision.shared.response.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/club")
@RequiredArgsConstructor
@Tag(name = "Earnings", description = "Club earnings endpoints")
public class EarningsController {

    private final ClubService clubService;

    @GetMapping("/{clubId}/earnings")
    public ResponseEntity<ApiResponse<EarningsResponse>> getEarnings(@PathVariable String clubId) {
        Map<String, Object> analytics = clubService.getClubAnalytics(clubId);

        EarningsResponse response = EarningsResponse.builder()
                .totalEarnings(toDouble(analytics.get("totalRevenue")))
                .monthlyEarnings(0)
                .pendingPayout(toDouble(analytics.get("balance")))
                .lastPayoutDate(null)
                .build();
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    private double toDouble(Object value) {
        if (value instanceof Number) {
            return ((Number) value).doubleValue();
        }
        return 0.0;
    }
}
