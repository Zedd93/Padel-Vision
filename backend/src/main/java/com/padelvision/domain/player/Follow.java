package com.padelvision.domain.player;

import com.padelvision.domain.club.Club;
import com.padelvision.domain.user.User;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "follows", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"follower_id", "club_id"}),
        @UniqueConstraint(columnNames = {"follower_id", "player_id"})
})
public class Follow {

    @Id
    @Column(name = "id", length = 36)
    private String id;

    @Column(name = "follower_id", insertable = false, updatable = false)
    private String followerId;

    @Column(name = "club_id", insertable = false, updatable = false)
    private String clubId;

    @Column(name = "player_id", insertable = false, updatable = false)
    private String playerId;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "follower_id")
    private User follower;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "club_id")
    private Club club;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "player_id")
    private Player player;

    @PrePersist
    public void prePersist() {
        if (this.id == null) {
            this.id = UUID.randomUUID().toString();
        }
    }
}
