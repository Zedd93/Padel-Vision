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
@Table(name = "multistream_configs", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"club_id", "platform"})
})
public class MultistreamConfig {

    @Id
    @Column(name = "id", length = 36)
    private String id;

    @Column(name = "club_id", insertable = false, updatable = false)
    private String clubId;

    @Column(name = "platform", nullable = false)
    private String platform;

    @Column(name = "rtmp_url")
    private String rtmpUrl;

    @Column(name = "stream_key")
    private String streamKey;

    @Builder.Default
    @Column(name = "enabled", nullable = false)
    private boolean enabled = false;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "club_id")
    private Club club;

    @PrePersist
    public void prePersist() {
        if (this.id == null) {
            this.id = UUID.randomUUID().toString();
        }
    }
}
