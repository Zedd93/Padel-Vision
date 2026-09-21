package com.padelvision.integration.youtube.dto;

/**
 * Cel RTMP, który klub wkleja do OBS. Pochodzi z wielokrotnego użytku
 * obiektu {@code liveStream} — jest stały dla klubu, więc OBS konfiguruje
 * się raz, a nie przed każdym meczem.
 *
 * @param streamId      id obiektu liveStream w YouTube
 * @param ingestAddress np. rtmp://a.rtmp.youtube.com/live2
 * @param streamName    klucz transmisji (sekret klubu)
 */
public record IngestTarget(String streamId, String ingestAddress, String streamName) {
}
