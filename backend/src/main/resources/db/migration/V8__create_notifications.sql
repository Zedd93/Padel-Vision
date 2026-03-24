-- Notifications

CREATE TABLE notifications (
    id         VARCHAR(30) PRIMARY KEY,
    user_id    VARCHAR(30) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type       notification_type NOT NULL,
    payload    JSONB NOT NULL,
    read       BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_read ON notifications(user_id, read);
