package com.padelvision.domain.payment;

import com.padelvision.domain.club.Club;
import com.padelvision.domain.user.User;
import com.padelvision.shared.enums.SubscriptionType;
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
@Table(name = "subscriptions")
public class Subscription {

    @Id
    @Column(name = "id", length = 36)
    private String id;

    @Column(name = "user_id", insertable = false, updatable = false)
    private String userId;

    @Column(name = "club_id", insertable = false, updatable = false)
    private String clubId;

    @Enumerated(EnumType.STRING)
    @Column(name = "type")
    private SubscriptionType type;

    @Column(name = "tier")
    private String tier;

    @Column(name = "stripe_sub_id", unique = true)
    private String stripeSubId;

    @Builder.Default
    @Column(name = "status", nullable = false)
    private String status = "active";

    @Column(name = "current_period_end")
    private Instant currentPeriodEnd;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

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
