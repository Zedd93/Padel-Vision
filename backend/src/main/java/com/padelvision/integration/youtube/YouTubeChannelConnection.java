package com.padelvision.integration.youtube;

import com.padelvision.domain.club.Club;
import com.padelvision.shared.enums.YouTubeConnectionStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.UUID;

/**
 * Połączenie klubu z jego kanałem YouTube.
 * <p>
 * Tokeny są trzymane wyłącznie jako szyfrogram AES-256-GCM
 * (patrz {@link TokenCipher}) — nigdy w czystej postaci.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "youtube_channel_connections")
public class YouTubeChannelConnection {

    @Id
    @Column(name = "id", length = 36)
    private String id;

    @Column(name = "club_id", unique = true, insertable = false, updatable = false)
    private String clubId;

    @Column(name = "channel_id", nullable = false, length = 64)
    private String channelId;

    @Column(name = "channel_title")
    private String channelTitle;

    // Długości pod VARCHAR w testach na H2; w Postgresie kolumny są TEXT,
    // co Hibernate widzi jako VARCHAR — walidacja schematu przechodzi.
    @Column(name = "refresh_token_enc", nullable = false, length = 2048)
    private String refreshTokenEnc;

    @Column(name = "access_token_enc", length = 2048)
    private String accessTokenEnc;

    @Column(name = "access_token_expires_at")
    private Instant accessTokenExpiresAt;

    @Column(name = "scopes", nullable = false, length = 1024)
    private String scopes;

    /** Wielokrotnego użytku liveStream YouTube — tworzony raz na klub (Faza 2). */
    @Column(name = "reusable_stream_id", length = 64)
    private String reusableStreamId;

    @Column(name = "ingest_address")
    private String ingestAddress;

    @Column(name = "ingest_stream_name", length = 128)
    private String ingestStreamName;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 24)
    private YouTubeConnectionStatus status = YouTubeConnectionStatus.CONNECTED;

    @CreationTimestamp
    @Column(name = "connected_at", updatable = false)
    private Instant connectedAt;

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
