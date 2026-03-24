-- Subscriptions, Transactions

CREATE TABLE subscriptions (
    id                 VARCHAR(30) PRIMARY KEY,
    user_id            VARCHAR(30) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    club_id            VARCHAR(30) REFERENCES clubs(id) ON DELETE CASCADE,
    type               subscription_type NOT NULL,
    tier               VARCHAR(50),
    stripe_sub_id      VARCHAR(255) UNIQUE,
    status             VARCHAR(50) NOT NULL DEFAULT 'active',
    current_period_end TIMESTAMP,
    created_at         TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at         TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE transactions (
    id                VARCHAR(30) PRIMARY KEY,
    user_id           VARCHAR(30) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type              transaction_type NOT NULL,
    amount            DOUBLE PRECISION NOT NULL,
    currency          VARCHAR(10) NOT NULL DEFAULT 'PLN',
    stripe_payment_id VARCHAR(255),
    metadata          JSONB,
    created_at        TIMESTAMP NOT NULL DEFAULT NOW()
);
