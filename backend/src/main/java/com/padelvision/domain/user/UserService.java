package com.padelvision.domain.user;

import com.padelvision.shared.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final BitsWalletRepository bitsWalletRepository;

    /**
     * Get user by ID.
     */
    @Transactional(readOnly = true)
    public User getUserById(String id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));
    }

    /**
     * Update user profile fields.
     */
    @Transactional
    public User updateUser(String id, String name, String username, String image, String city) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));

        if (name != null) user.setName(name);
        if (username != null) user.setUsername(username);
        if (image != null) user.setImage(image);
        if (city != null) user.setCity(city);

        user = userRepository.save(user);
        log.info("User {} updated", id);
        return user;
    }

    /**
     * Get user's follows, subscriptions, and activity as posts.
     * Placeholder for a feed/posts system.
     */
    @Transactional(readOnly = true)
    public Page<Object> getUserPosts(String id, Pageable pageable) {
        // Verify user exists
        userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));

        // TODO: Implement user posts/activity feed
        return Page.empty(pageable);
    }

    /**
     * Get user stats: wallet balance, follow count, subscription count.
     * Mirrors: GET /api/user/:userId/wallet (partially)
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getUserStats(String id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));

        BitsWallet wallet = bitsWalletRepository.findByUserId(id).orElse(null);

        Map<String, Object> stats = new HashMap<>();
        stats.put("bitsBalance", wallet != null ? wallet.getBalance() : 0);
        stats.put("followCount", user.getFollows() != null ? user.getFollows().size() : 0);
        stats.put("subscriptionCount", user.getSubscriptions() != null ? user.getSubscriptions().size() : 0);

        return stats;
    }
}
