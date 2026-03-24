package com.padelvision.domain.user;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "bits_wallets")
public class BitsWallet {

    @Id
    @Column(name = "id", length = 36)
    private String id;

    @Column(name = "user_id", unique = true, insertable = false, updatable = false)
    private String userId;

    @Builder.Default
    @Column(name = "balance", nullable = false)
    private int balance = 0;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", unique = true)
    private User user;

    @PrePersist
    public void prePersist() {
        if (this.id == null) {
            this.id = UUID.randomUUID().toString();
        }
    }
}
