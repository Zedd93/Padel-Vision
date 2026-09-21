package com.padelvision.domain.club;

import com.padelvision.domain.payment.Subscription;
import com.padelvision.domain.player.Follow;
import com.padelvision.domain.player.Player;
import com.padelvision.domain.stream.Stream;
import com.padelvision.domain.tournament.Tournament;
import com.padelvision.domain.user.User;
import com.padelvision.shared.enums.ClubPlan;
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
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "clubs")
public class Club {

    @Id
    @Column(name = "id", length = 36)
    private String id;

    @Column(name = "user_id", unique = true, insertable = false, updatable = false)
    private String userId;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "slug", unique = true, nullable = false)
    private String slug;

    @Column(name = "city")
    private String city;

    @Column(name = "address")
    private String address;

    @Column(name = "nip")
    private String nip;

    @Column(name = "description", length = 10000)
    private String description;

    @Column(name = "logo")
    private String logo;

    @Column(name = "banner")
    private String banner;

    @Type(JsonType.class)
    @Column(name = "social_links", columnDefinition = "jsonb")
    private Map<String, Object> socialLinks;

    @Builder.Default
    @Column(name = "court_count", nullable = false)
    private int courtCount = 1;

    @Column(name = "stream_key", unique = true, length = 36)
    private String streamKey;

    @Enumerated(EnumType.STRING)
    @Column(name = "plan")
    private ClubPlan plan;

    @Column(name = "stripe_account_id")
    private String stripeAccountId;

    @Builder.Default
    @Column(name = "is_verified", nullable = false)
    private boolean isVerified = false;

    @Column(name = "latitude")
    private Double latitude;

    @Column(name = "longitude")
    private Double longitude;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", unique = true)
    private User user;

    @OneToMany(mappedBy = "club", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Stream> streams = new ArrayList<>();

    @OneToMany(mappedBy = "club", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Tournament> tournaments = new ArrayList<>();

    @OneToMany(mappedBy = "club", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Player> players = new ArrayList<>();

    @OneToMany(mappedBy = "club", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Follow> follows = new ArrayList<>();

    @OneToMany(mappedBy = "club", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Subscription> subscriptions = new ArrayList<>();

    @OneToMany(mappedBy = "club", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<MultistreamConfig> multistreamConfigs = new ArrayList<>();

    @OneToOne(mappedBy = "club", cascade = CascadeType.ALL, orphanRemoval = true)
    private PlaytomicIntegration playtomicIntegration;

    @PrePersist
    public void prePersist() {
        if (this.id == null) {
            this.id = UUID.randomUUID().toString();
        }
        if (this.streamKey == null) {
            this.streamKey = UUID.randomUUID().toString();
        }
    }
}
