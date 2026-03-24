-- Users, Accounts, Sessions, VerificationTokens, BitsWallets

CREATE TABLE users (
    id              VARCHAR(30) PRIMARY KEY,
    email           VARCHAR(255) NOT NULL UNIQUE,
    email_verified  TIMESTAMP,
    username        VARCHAR(50) NOT NULL UNIQUE,
    password_hash   VARCHAR(255),
    name            VARCHAR(255),
    image           VARCHAR(1024),
    city            VARCHAR(255),
    role            user_role NOT NULL DEFAULT 'VIEWER',
    viewer_tier     viewer_tier NOT NULL DEFAULT 'FREE',
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE accounts (
    id                  VARCHAR(30) PRIMARY KEY,
    user_id             VARCHAR(30) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type                VARCHAR(50) NOT NULL,
    provider            VARCHAR(50) NOT NULL,
    provider_account_id VARCHAR(255) NOT NULL,
    refresh_token       TEXT,
    access_token        TEXT,
    expires_at          INTEGER,
    token_type          VARCHAR(50),
    scope               VARCHAR(255),
    id_token            TEXT,
    session_state       VARCHAR(255),
    UNIQUE (provider, provider_account_id)
);

CREATE TABLE sessions (
    id            VARCHAR(30) PRIMARY KEY,
    session_token VARCHAR(255) NOT NULL UNIQUE,
    user_id       VARCHAR(30) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires       TIMESTAMP NOT NULL
);

CREATE TABLE verification_tokens (
    identifier VARCHAR(255) NOT NULL,
    token      VARCHAR(255) NOT NULL UNIQUE,
    expires    TIMESTAMP NOT NULL,
    UNIQUE (identifier, token)
);

CREATE TABLE bits_wallets (
    id      VARCHAR(30) PRIMARY KEY,
    user_id VARCHAR(30) NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    balance INTEGER NOT NULL DEFAULT 0
);
