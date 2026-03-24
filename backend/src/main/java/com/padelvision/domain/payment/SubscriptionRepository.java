package com.padelvision.domain.payment;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SubscriptionRepository extends JpaRepository<Subscription, String> {

    List<Subscription> findByUserId(String userId);

    Optional<Subscription> findByStripeSubId(String stripeSubId);

    Optional<Subscription> findByUserIdAndClubIdAndStatus(String userId, String clubId, String status);
}
