-- YouTube Live — fundament integracji (Faza 1)
-- Plan: docs/YOUTUBE_MIGRATION_PLAN.md §6.1
--
-- Migracja jest wyłącznie addytywna. hls_url i s3_url zostają nullable do
-- czasu, aż YouTube będzie stabilny na produkcji (patrz §9 planu).

ALTER TABLE streams
    ADD COLUMN youtube_video_id     VARCHAR(24),
    ADD COLUMN youtube_broadcast_id VARCHAR(24),
    ADD COLUMN youtube_privacy      VARCHAR(16) NOT NULL DEFAULT 'unlisted',
    ADD COLUMN latency_preference   VARCHAR(16) NOT NULL DEFAULT 'low';

CREATE INDEX idx_streams_youtube_broadcast ON streams(youtube_broadcast_id);

-- Połączenie klubu z kanałem YouTube (OAuth 2.0).
-- refresh_token_enc i access_token_enc trzymają szyfrogram AES-256-GCM,
-- nigdy tokenu w czystej postaci — klucz w YOUTUBE_TOKEN_ENC_KEY.
CREATE TABLE youtube_channel_connections (
    id                      VARCHAR(36) PRIMARY KEY,
    club_id                 VARCHAR(30) NOT NULL UNIQUE REFERENCES clubs(id) ON DELETE CASCADE,
    channel_id              VARCHAR(64) NOT NULL,
    channel_title           VARCHAR(255),
    refresh_token_enc       TEXT NOT NULL,
    access_token_enc        TEXT,
    access_token_expires_at TIMESTAMP,
    scopes                  TEXT NOT NULL,
    reusable_stream_id      VARCHAR(64),
    ingest_address          VARCHAR(255),
    ingest_stream_name      VARCHAR(128),
    status                  VARCHAR(24) NOT NULL DEFAULT 'CONNECTED',
    connected_at            TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_youtube_connections_status ON youtube_channel_connections(status);
