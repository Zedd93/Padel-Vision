package com.padelvision.domain.club;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "playtomic_integrations")
public class PlaytomicIntegration {

    @Id
    @Column(name = "id", length = 36)
    private String id;

    @Column(name = "club_id", unique = true, insertable = false, updatable = false)
    private String clubId;

    @Column(name = "client_id")
    private String clientId;

    @Column(name = "client_secret", length = 2048)
    private String clientSecret;

    @Column(name = "tenant_id")
    private String tenantId;

    @Column(name = "access_token", length = 4096)
    private String accessToken;

    @Column(name = "token_expires_at")
    private Instant tokenExpiresAt;

    @Builder.Default
    @Column(name = "is_enabled", nullable = false)
    private boolean isEnabled = true;

    @Column(name = "last_sync_at")
    private Instant lastSyncAt;

    @Builder.Default
    @Column(name = "last_sync_status")
    private String lastSyncStatus = "pending";

    @Column(name = "last_sync_error", length = 5000)
    private String lastSyncError;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "club_id", unique = true)
    private Club club;

    @PrePersist
    public void prePersist() {
        if (this.id == null) {
            this.id = UUID.randomUUID().toString();
        }
    }
}
