-- Tournaments, Matches

CREATE TABLE tournaments (
    id         VARCHAR(30) PRIMARY KEY,
    club_id    VARCHAR(30) NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    name       VARCHAR(255) NOT NULL,
    format     tournament_format NOT NULL,
    category   tournament_category NOT NULL,
    level      tournament_level NOT NULL,
    date       TIMESTAMP NOT NULL,
    end_date   TIMESTAMP,
    max_pairs  INTEGER,
    entry_fee  DOUBLE PRECISION,
    prizes     TEXT,
    is_ppv     BOOLEAN NOT NULL DEFAULT FALSE,
    ppv_price  DOUBLE PRECISION,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE matches (
    id             VARCHAR(30) PRIMARY KEY,
    tournament_id  VARCHAR(30) NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    court_number   INTEGER,
    round          INTEGER,
    position       INTEGER,
    team1_player1  VARCHAR(255),
    team1_player2  VARCHAR(255),
    team2_player1  VARCHAR(255),
    team2_player2  VARCHAR(255),
    score          JSONB,
    winner_id      VARCHAR(255),
    scheduled_at   TIMESTAMP,
    started_at     TIMESTAMP,
    ended_at       TIMESTAMP,
    created_at     TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Add FK from streams.match_id to matches
ALTER TABLE streams ADD CONSTRAINT fk_streams_match
    FOREIGN KEY (match_id) REFERENCES matches(id);
