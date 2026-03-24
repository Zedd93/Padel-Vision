-- Clubs, MultistreamConfigs, PlaytomicIntegrations

CREATE TABLE clubs (
    id                VARCHAR(30) PRIMARY KEY,
    user_id           VARCHAR(30) NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    name              VARCHAR(255) NOT NULL,
    slug              VARCHAR(255) NOT NULL UNIQUE,
    city              VARCHAR(255) NOT NULL,
    address           VARCHAR(500),
    nip               VARCHAR(20),
    description       TEXT,
    logo              VARCHAR(1024),
    banner            VARCHAR(1024),
    social_links      JSONB,
    court_count       INTEGER NOT NULL DEFAULT 1,
    stream_key        VARCHAR(30) NOT NULL UNIQUE,
    plan              club_plan NOT NULL DEFAULT 'STARTER',
    stripe_account_id VARCHAR(255),
    is_verified       BOOLEAN NOT NULL DEFAULT FALSE,
    latitude          DOUBLE PRECISION,
    longitude         DOUBLE PRECISION,
    created_at        TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE multistream_configs (
    id         VARCHAR(30) PRIMARY KEY,
    club_id    VARCHAR(30) NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    platform   VARCHAR(50) NOT NULL,
    rtmp_url   VARCHAR(1024) NOT NULL,
    stream_key VARCHAR(512) NOT NULL,
    enabled    BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (club_id, platform)
);

CREATE TABLE playtomic_integrations (
    id               VARCHAR(30) PRIMARY KEY,
    club_id          VARCHAR(30) NOT NULL UNIQUE REFERENCES clubs(id) ON DELETE CASCADE,
    client_id        VARCHAR(255) NOT NULL,
    client_secret    TEXT NOT NULL,
    tenant_id        VARCHAR(255) NOT NULL,
    access_token     TEXT,
    token_expires_at TIMESTAMP,
    is_enabled       BOOLEAN NOT NULL DEFAULT TRUE,
    last_sync_at     TIMESTAMP,
    last_sync_status VARCHAR(50) NOT NULL DEFAULT 'pending',
    last_sync_error  TEXT,
    created_at       TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMP NOT NULL DEFAULT NOW()
);
