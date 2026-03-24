package com.padelvision.domain.club;

import com.padelvision.shared.exception.BadRequestException;
import com.padelvision.shared.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class PlaytomicService {

    private final ClubRepository clubRepository;
    private final PlaytomicIntegrationRepository playtomicIntegrationRepository;

    /**
     * Connect a club to Playtomic by saving credentials and testing authentication.
     * Mirrors: POST /api/playtomic/connect
     */
    @Transactional
    public Map<String, Object> connect(String clubId, String clientId, String clientSecret, String tenantId) {
        if (clubId == null || clientId == null || clientSecret == null || tenantId == null) {
            throw new BadRequestException("Missing required fields: clubId, clientId, clientSecret, tenantId");
        }

        Club club = clubRepository.findById(clubId)
                .orElseThrow(() -> new ResourceNotFoundException("Club", "id", clubId));

        // TODO: Test credentials by calling Playtomic auth API
        log.info("TODO: Authenticate with Playtomic for club {}", clubId);

        Instant expiresAt = Instant.now().plusSeconds(3600);

        PlaytomicIntegration integration = playtomicIntegrationRepository.findByClubId(clubId)
                .orElse(null);

        if (integration != null) {
            // Update existing
            integration.setClientId(clientId);
            integration.setClientSecret(clientSecret);
            integration.setTenantId(tenantId);
            integration.setAccessToken("stub_token");
            integration.setTokenExpiresAt(expiresAt);
            integration.setEnabled(true);
            integration.setLastSyncStatus("pending");
            integration.setLastSyncError(null);
        } else {
            // Create new
            integration = PlaytomicIntegration.builder()
                    .club(club)
                    .clientId(clientId)
                    .clientSecret(clientSecret)
                    .tenantId(tenantId)
                    .accessToken("stub_token")
                    .tokenExpiresAt(expiresAt)
                    .isEnabled(true)
                    .build();
        }

        integration = playtomicIntegrationRepository.save(integration);

        Map<String, Object> result = new HashMap<>();
        result.put("status", "connected");
        result.put("id", integration.getId());
        result.put("tenantId", integration.getTenantId());
        result.put("tokenExpiresAt", expiresAt.toString());
        return result;
    }

    /**
     * Disconnect a club from Playtomic.
     * Mirrors: POST /api/playtomic/disconnect
     */
    @Transactional
    public void disconnect(String clubId) {
        if (clubId == null) {
            throw new BadRequestException("Missing clubId");
        }
        playtomicIntegrationRepository.deleteByClubId(clubId);
        log.info("Playtomic disconnected for club {}", clubId);
    }

    /**
     * Get Playtomic integration status for a club.
     * Mirrors: GET /api/playtomic/status/:clubId
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getStatus(String clubId) {
        PlaytomicIntegration integration = playtomicIntegrationRepository.findByClubId(clubId)
                .orElse(null);

        Map<String, Object> result = new HashMap<>();

        if (integration == null) {
            result.put("connected", false);
            return result;
        }

        result.put("connected", true);
        result.put("isEnabled", integration.isEnabled());
        result.put("tenantId", integration.getTenantId());
        result.put("lastSyncAt", integration.getLastSyncAt() != null ? integration.getLastSyncAt().toString() : null);
        result.put("lastSyncStatus", integration.getLastSyncStatus());
        result.put("lastSyncError", integration.getLastSyncError());
        result.put("tokenExpired", integration.getTokenExpiresAt() == null
                || integration.getTokenExpiresAt().isBefore(Instant.now()));
        return result;
    }

    /**
     * Fetch players from Playtomic API for a club.
     * Mirrors: GET /api/playtomic/players/:clubId
     * NOTE: Stubbed — replace with real Playtomic API call in production.
     */
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getPlayers(String clubId) {
        PlaytomicIntegration integration = playtomicIntegrationRepository.findByClubId(clubId)
                .orElseThrow(() -> new ResourceNotFoundException("PlaytomicIntegration", "clubId", clubId));

        // TODO: Call Playtomic API — playtomicService.getPlayers(tenantId, token, params)
        log.info("TODO: Fetch players from Playtomic API for club {}", clubId);
        return List.of();
    }

    /**
     * Fetch bookings from Playtomic API for a club.
     * Mirrors: GET /api/playtomic/bookings/:clubId
     * NOTE: Stubbed — replace with real Playtomic API call in production.
     */
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getBookings(String clubId) {
        PlaytomicIntegration integration = playtomicIntegrationRepository.findByClubId(clubId)
                .orElseThrow(() -> new ResourceNotFoundException("PlaytomicIntegration", "clubId", clubId));

        // TODO: Call Playtomic API — playtomicService.getBookings(tenantId, token, params)
        log.info("TODO: Fetch bookings from Playtomic API for club {}", clubId);
        return List.of();
    }

    /**
     * Sync data from Playtomic for a club.
     * Mirrors: POST /api/playtomic/sync/:clubId
     * NOTE: Stubbed — replace with real Playtomic API call in production.
     */
    @Transactional
    public Map<String, Object> syncData(String clubId) {
        PlaytomicIntegration integration = playtomicIntegrationRepository.findByClubId(clubId)
                .orElseThrow(() -> new ResourceNotFoundException("PlaytomicIntegration", "clubId", clubId));

        try {
            // TODO: Refresh token if expired, fetch players, update sync status
            log.info("TODO: Sync Playtomic data for club {}", clubId);

            integration.setLastSyncAt(Instant.now());
            integration.setLastSyncStatus("success");
            integration.setLastSyncError(null);
            playtomicIntegrationRepository.save(integration);

            Map<String, Object> result = new HashMap<>();
            result.put("status", "synced");
            result.put("playerCount", 0);
            result.put("syncedAt", Instant.now().toString());
            return result;

        } catch (Exception e) {
            integration.setLastSyncAt(Instant.now());
            integration.setLastSyncStatus("error");
            integration.setLastSyncError(e.getMessage());
            playtomicIntegrationRepository.save(integration);

            log.error("Playtomic sync failed for club {}", clubId, e);
            throw new RuntimeException("Sync failed: " + e.getMessage(), e);
        }
    }
}
