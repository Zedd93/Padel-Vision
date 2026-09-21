package com.padelvision.domain.tournament;

import com.padelvision.domain.club.Club;
import com.padelvision.domain.match.Match;
import com.padelvision.shared.enums.TournamentCategory;
import com.padelvision.shared.enums.TournamentFormat;
import com.padelvision.shared.enums.TournamentLevel;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "tournaments")
public class Tournament {

    @Id
    @Column(name = "id", length = 36)
    private String id;

    @Column(name = "club_id", insertable = false, updatable = false)
    private String clubId;

    @Column(name = "name", nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(name = "format")
    private TournamentFormat format;

    @Enumerated(EnumType.STRING)
    @Column(name = "category")
    private TournamentCategory category;

    @Enumerated(EnumType.STRING)
    @Column(name = "level")
    private TournamentLevel level;

    @Column(name = "date")
    private Instant date;

    @Column(name = "end_date")
    private Instant endDate;

    @Column(name = "max_pairs")
    private Integer maxPairs;

    @Column(name = "entry_fee")
    private Double entryFee;

    @Column(name = "prizes", length = 5000)
    private String prizes;

    @Builder.Default
    @Column(name = "is_ppv", nullable = false)
    private boolean isPPV = false;

    @Column(name = "ppv_price")
    private Double ppvPrice;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "club_id")
    private Club club;

    @OneToMany(mappedBy = "tournament", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Match> matches = new ArrayList<>();

    @PrePersist
    public void prePersist() {
        if (this.id == null) {
            this.id = UUID.randomUUID().toString();
        }
    }
}
