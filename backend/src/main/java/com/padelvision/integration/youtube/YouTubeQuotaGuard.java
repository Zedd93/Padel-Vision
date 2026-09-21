package com.padelvision.integration.youtube;

import com.padelvision.shared.exception.BadRequestException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.LocalDate;
import java.time.ZoneId;

/**
 * Licznik dobowego zużycia quoty YouTube Data API.
 * <p>
 * Domyślny limit projektu to 10 000 jednostek na dobę, a Google zeruje go
 * o północy czasu pacyficznego — stąd klucz liczony w strefie Los Angeles,
 * a nie lokalnie.
 * <p>
 * Lepiej odmówić wywołania tutaj niż dostać HTTP 403 {@code quotaExceeded}
 * w środku transmisji.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class YouTubeQuotaGuard {

    private static final ZoneId QUOTA_ZONE = ZoneId.of("America/Los_Angeles");
    private static final String KEY_PREFIX = "youtube:quota:";
    private static final Duration KEY_TTL = Duration.ofHours(36);

    private final StringRedisTemplate redisTemplate;
    private final YouTubeProperties properties;

    /**
     * Rezerwuje jednostki quoty przed wywołaniem API.
     *
     * @throws BadRequestException gdy dobowy budżet został wyczerpany
     */
    public void reserve(int units, String operation) {
        String key = KEY_PREFIX + LocalDate.now(QUOTA_ZONE);

        Long used = redisTemplate.opsForValue().increment(key, units);
        if (used == null) {
            // Redis niedostępny — nie blokujemy transmisji z powodu licznika
            log.warn("[YouTube] Nie udało się zliczyć quoty dla {}", operation);
            return;
        }
        if (used == units) {
            redisTemplate.expire(key, KEY_TTL);
        }

        int limit = properties.getDailyQuotaUnits();
        if (used > limit) {
            log.error("[YouTube] Quota wyczerpana: {}/{} jednostek (operacja {})", used, limit, operation);
            throw new BadRequestException(
                    "Dobowy limit YouTube API został wyczerpany (" + limit + " jednostek). "
                            + "Limit zeruje się o północy czasu pacyficznego");
        }

        if (used > limit * 0.8) {
            log.warn("[YouTube] Quota na wyczerpaniu: {}/{} jednostek", used, limit);
        }
        log.debug("[YouTube] {} kosztowało {} jednostek, razem dziś {}", operation, units, used);
    }

    /** Zużycie od początku bieżącej doby quoty. */
    public long usedToday() {
        String value = redisTemplate.opsForValue().get(KEY_PREFIX + LocalDate.now(QUOTA_ZONE));
        return value != null ? Long.parseLong(value) : 0L;
    }
}
