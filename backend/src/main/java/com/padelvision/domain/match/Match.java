package com.padelvision.domain.match;

import com.padelvision.domain.stream.Stream;
import com.padelvision.domain.tournament.Tournament;
import io.hypersistence.utils.hibernate.type.json.JsonType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.Type;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "matches")
public class Match {

    @Id
    @Column(name = "id", length = 36)
    private String id;

    @Column(name = "tournament_id", insertable = false, updatable = false)
    private String tournamentId;

    @Column(name = "court_number")
    private Integer courtNumber;

    @Column(name = "round")
    private Integer round;

    @Column(name = "position")
    private Integer position;

    @Column(name = "team1_player1")
    private String team1Player1;

    @Column(name = "team1_player2")
    private String team1Player2;

    @Column(name = "team2_player1")
    private String team2Player1;

    @Column(name = "team2_player2")
    private String team2Player2;

    @Type(JsonType.class)
    @Column(name = "score", columnDefinition = "jsonb")
    private Map<String, Object> score;

    @Column(name = "winner_id")
    private String winnerId;

    @Column(name = "scheduled_at")
    private Instant scheduledAt;

    @Column(name = "started_at")
    private Instant startedAt;

    @Column(name = "ended_at")
    private Instant endedAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tournament_id")
    private Tournament tournament;

    @OneToOne(mappedBy = "match")
    private Stream stream;

    @PrePersist
    public void prePersist() {
        if (this.id == null) {
            this.id = UUID.randomUUID().toString();
        }
    }
}
