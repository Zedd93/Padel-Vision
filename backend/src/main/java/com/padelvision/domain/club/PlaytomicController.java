package com.padelvision.domain.club;

import com.padelvision.domain.club.dto.PlaytomicConnectRequest;
import com.padelvision.domain.club.dto.PlaytomicStatusResponse;
import com.padelvision.shared.response.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/playtomic")
@RequiredArgsConstructor
@Tag(name = "Playtomic", description = "Playtomic integration endpoints")
public class PlaytomicController {

    private final PlaytomicService playtomicService;

    @PostMapping("/connect")
    public ResponseEntity<ApiResponse<Map<String, Object>>> connect(@Valid @RequestBody PlaytomicConnectRequest request) {
        Map<String, Object> result = playtomicService.connect(
                request.getClubId(),
                request.getClientId(),
                request.getClientSecret(),
                request.getTenantId()
        );
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/status/{clubId}")
    public ResponseEntity<ApiResponse<PlaytomicStatusResponse>> getStatus(@PathVariable String clubId) {
        Map<String, Object> status = playtomicService.getStatus(clubId);

        PlaytomicStatusResponse response = PlaytomicStatusResponse.builder()
                .clubId(clubId)
                .isEnabled(Boolean.TRUE.equals(status.get("isEnabled")))
                .lastSyncAt(status.get("lastSyncAt") != null ? Instant.parse((String) status.get("lastSyncAt")) : null)
                .lastSyncStatus((String) status.get("lastSyncStatus"))
                .build();
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/disconnect")
    public ResponseEntity<ApiResponse<Void>> disconnect(@RequestParam String clubId) {
        playtomicService.disconnect(clubId);
        return ResponseEntity.ok(ApiResponse.ok(null, "Disconnected from Playtomic"));
    }

    @GetMapping("/players/{clubId}")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getPlayers(@PathVariable String clubId) {
        List<Map<String, Object>> players = playtomicService.getPlayers(clubId);
        return ResponseEntity.ok(ApiResponse.ok(players));
    }

    @GetMapping("/bookings/{clubId}")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getBookings(@PathVariable String clubId) {
        List<Map<String, Object>> bookings = playtomicService.getBookings(clubId);
        return ResponseEntity.ok(ApiResponse.ok(bookings));
    }

    @PostMapping("/sync/{clubId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> syncData(@PathVariable String clubId) {
        Map<String, Object> result = playtomicService.syncData(clubId);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }
}
