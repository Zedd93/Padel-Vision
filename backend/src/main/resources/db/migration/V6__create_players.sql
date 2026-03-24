-- Players, Follows

CREATE TABLE players (
    id         VARCHAR(30) PRIMARY KEY,
    name       VARCHAR(255) NOT NULL,
    slug       VARCHAR(255) NOT NULL UNIQUE,
    club_id    VARCHAR(30) NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    avatar     VARCHAR(1024),
    stats      JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE follows (
    id          VARCHAR(30) PRIMARY KEY,
    follower_id VARCHAR(30) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    club_id     VARCHAR(30) REFERENCES clubs(id) ON DELETE CASCADE,
    player_id   VARCHAR(30) REFERENCES players(id) ON DELETE CASCADE,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (follower_id, club_id),
    UNIQUE (follower_id, player_id)
);
