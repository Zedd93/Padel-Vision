package com.padelvision.integration.youtube.dto;

/**
 * Stan transmisji odczytany z YouTube.
 *
 * @param lifeCycleStatus created | ready | testing | live | complete | revoked
 * @param concurrentViewers liczba widzów w tej chwili (0, gdy YouTube jej nie podaje)
 */
public record BroadcastState(String lifeCycleStatus, int concurrentViewers) {

    public boolean isLive() {
        return "live".equals(lifeCycleStatus);
    }

    public boolean isFinished() {
        return "complete".equals(lifeCycleStatus) || "revoked".equals(lifeCycleStatus);
    }
}
