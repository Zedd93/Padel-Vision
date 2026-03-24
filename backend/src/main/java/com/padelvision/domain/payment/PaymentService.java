package com.padelvision.domain.payment;

import com.padelvision.domain.club.Club;
import com.padelvision.domain.club.ClubRepository;
import com.padelvision.domain.tournament.Tournament;
import com.padelvision.domain.tournament.TournamentRepository;
import com.padelvision.domain.user.BitsWallet;
import com.padelvision.domain.user.BitsWalletRepository;
import com.padelvision.domain.user.User;
import com.padelvision.domain.user.UserRepository;
import com.padelvision.shared.exception.BadRequestException;
import com.padelvision.shared.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentService {

    private final SubscriptionRepository subscriptionRepository;
    private final TransactionRepository transactionRepository;
    private final UserRepository userRepository;
    private final ClubRepository clubRepository;
    private final TournamentRepository tournamentRepository;
    private final BitsWalletRepository bitsWalletRepository;

    /**
     * Create a Stripe checkout session for a subscription.
     * Mirrors: POST /api/stripe/checkout
     * NOTE: Stripe integration is stubbed — replace with real Stripe SDK calls in production.
     */
    @Transactional
    public Map<String, Object> createCheckoutSession(String userId, String priceId, String mode) {
        if (priceId == null || priceId.isBlank()) {
            throw new BadRequestException("Missing priceId");
        }

        // TODO: Integrate with Stripe SDK — stripe.checkout.sessions.create(...)
        log.info("TODO: Create Stripe checkout session for user {} with priceId {}", userId, priceId);

        String sessionId = "cs_demo_" + System.currentTimeMillis();
        Map<String, Object> result = new HashMap<>();
        result.put("sessionId", sessionId);
        result.put("url", "https://checkout.stripe.com/pay/" + sessionId);
        return result;
    }

    /**
     * Buy bits (in-app currency).
     * Mirrors: POST /api/stripe/buy-bits
     * NOTE: Stripe integration is stubbed.
     */
    @Transactional
    public Map<String, Object> buyBits(String userId, String packageId, int amount) {
        if (userId == null || amount <= 0) {
            throw new BadRequestException("Missing userId or invalid amount");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        // TODO: Create Stripe payment intent, then on success upsert BitsWallet and create Transaction
        log.info("TODO: Create Stripe payment for {} bits for user {}", amount, userId);

        String sessionId = "cs_bits_" + System.currentTimeMillis();
        Map<String, Object> result = new HashMap<>();
        result.put("sessionId", sessionId);
        result.put("url", "https://checkout.stripe.com/pay/" + sessionId);
        result.put("bits", amount);
        return result;
    }

    /**
     * Purchase pay-per-view access for a tournament.
     * Mirrors: POST /api/stripe/ppv
     * NOTE: Stripe integration is stubbed.
     */
    @Transactional
    public Map<String, Object> purchasePpv(String userId, String tournamentId, Double price) {
        if (userId == null || tournamentId == null) {
            throw new BadRequestException("Missing userId or tournamentId");
        }

        Tournament tournament = tournamentRepository.findById(tournamentId)
                .orElseThrow(() -> new ResourceNotFoundException("Tournament", "id", tournamentId));

        // TODO: stripe.checkout.sessions.create with PPV price
        log.info("TODO: Create Stripe PPV checkout for tournament {} user {}", tournamentId, userId);

        String sessionId = "cs_ppv_" + System.currentTimeMillis();
        Map<String, Object> result = new HashMap<>();
        result.put("sessionId", sessionId);
        result.put("url", "https://checkout.stripe.com/pay/" + sessionId);
        result.put("tournament", tournament.getName());
        return result;
    }

    /**
     * Handle Stripe webhook events.
     * Mirrors: POST /api/webhooks/stripe
     * NOTE: Stubbed — implement real event handling in production.
     */
    @Transactional
    public void handleWebhook(String payload, String signature) {
        // TODO: Verify stripe signature with stripe.webhooks.constructEvent(payload, signature, secret)
        // Handle event types:
        //   checkout.session.completed -> activate subscription / add bits / grant PPV
        //   invoice.payment_succeeded -> renew subscription
        //   invoice.payment_failed -> mark subscription past_due
        //   account.updated -> update Stripe Connect status
        //   payout.paid -> record payout completion
        log.info("TODO: Handle Stripe webhook event (payload length: {})", payload != null ? payload.length() : 0);
    }

    /**
     * Cancel a subscription.
     */
    @Transactional
    public void cancelSubscription(String subscriptionId) {
        Subscription subscription = subscriptionRepository.findById(subscriptionId)
                .orElseThrow(() -> new ResourceNotFoundException("Subscription", "id", subscriptionId));

        // TODO: Cancel in Stripe — stripe.subscriptions.del(subscription.getStripeSubId())
        subscription.setStatus("canceled");
        subscriptionRepository.save(subscription);
        log.info("Subscription {} canceled", subscriptionId);
    }

    /**
     * Get user's wallet balance and recent transactions.
     * Mirrors: GET /api/user/:userId/wallet
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getUserWallet(String userId) {
        BitsWallet wallet = bitsWalletRepository.findByUserId(userId).orElse(null);

        Page<Transaction> transactions = transactionRepository.findByUserIdOrderByCreatedAtDesc(
                userId, Pageable.ofSize(20));

        Map<String, Object> result = new HashMap<>();
        result.put("balance", wallet != null ? wallet.getBalance() : 0);
        result.put("transactions", transactions.getContent());
        return result;
    }

    /**
     * Get user subscriptions.
     */
    @Transactional(readOnly = true)
    public List<Subscription> getUserSubscriptions(String userId) {
        return subscriptionRepository.findByUserId(userId);
    }
}
