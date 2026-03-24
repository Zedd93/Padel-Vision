-- Streams, Vods, Highlights, StreamTags, ChatMessages

CREATE TABLE streams (
    id            VARCHAR(30) PRIMARY KEY,
    club_id       VARCHAR(30) NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    match_id      VARCHAR(30) UNIQUE,
    title         VARCHAR(500) NOT NULL,
    description   TEXT,
    status        stream_status NOT NULL DEFAULT 'OFFLINE',
    hls_url       VARCHAR(1024),
    thumbnail_url VARCHAR(1024),
    viewer_count  INTEGER NOT NULL DEFAULT 0,
    peak_viewers  INTEGER NOT NULL DEFAULT 0,
    started_at    TIMESTAMP,
    ended_at      TIMESTAMP,
    created_at    TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE vods (
    id            VARCHAR(30) PRIMARY KEY,
    stream_id     VARCHAR(30) NOT NULL UNIQUE REFERENCES streams(id) ON DELETE CASCADE,
    s3_url        VARCHAR(1024) NOT NULL,
    thumbnail_url VARCHAR(1024),
    duration      INTEGER NOT NULL,
    file_size     BIGINT,
    created_at    TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE highlights (
    id         VARCHAR(30) PRIMARY KEY,
    vod_id     VARCHAR(30) NOT NULL REFERENCES vods(id) ON DELETE CASCADE,
    title      VARCHAR(255) NOT NULL,
    start_time INTEGER NOT NULL,
    end_time   INTEGER NOT NULL,
    s3_url     VARCHAR(1024),
    metadata   JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE chat_messages (
    id         VARCHAR(30) PRIMARY KEY,
    stream_id  VARCHAR(30) NOT NULL REFERENCES streams(id) ON DELETE CASCADE,
    user_id    VARCHAR(30) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content    VARCHAR(2000) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_chat_messages_stream_created ON chat_messages(stream_id, created_at);

CREATE TABLE stream_tags (
    id        VARCHAR(30) PRIMARY KEY,
    stream_id VARCHAR(30) NOT NULL REFERENCES streams(id) ON DELETE CASCADE,
    tag       VARCHAR(100) NOT NULL
);

CREATE INDEX idx_stream_tags_tag ON stream_tags(tag);
