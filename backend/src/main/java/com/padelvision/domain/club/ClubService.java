package com.padelvision.domain.club;

import com.padelvision.domain.player.FollowRepository;
import com.padelvision.domain.stream.Stream;
import com.padelvision.domain.stream.StreamRepository;
import com.padelvision.shared.enums.StreamStatus;
import com.padelvision.shared.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class ClubService {

    private final ClubRepository clubRepository;
    private final FollowRepository followRepository;
    private final StreamRepository streamRepository;

    /**
     * Get all clubs (basic info).
     * Mirrors: GET /api/clubs
     */
    @Transactional(readOnly = true)
    public List<Club> getClubs() {
        return clubRepository.findAll();
    }

    /**
     * Get club by slug with live streams, tournaments, and follower count.
     * Mirrors: GET /api/clubs/:slug
     */
    @Transactional(readOnly = true)
    public Club getClubBySlug(String slug) {
        Club club = clubRepository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Club", "slug", slug));

        // Initialize lazy collections for serialization
        if (club.getStreams() != null) {
            club.getStreams().size();
        }
        if (club.getTournaments() != null) {
            club.getTournaments().size();
        }

        return club;
    }

    /**
     * Get follower count for a club.
     */
    @Transactional(readOnly = true)
    public long getFollowerCount(String clubId) {
        return followRepository.countByClubId(clubId);
    }

    /**
     * Get club settings for the authenticated club owner.
     * Mirrors: club settings page reads
     */
    @Transactional(readOnly = true)
    public Club getClubSettings(String userId) {
        return clubRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Club", "userId", userId));
    }

    /**
     * Update club settings (name, description, logo, social links, etc.).
     */
    @Transactional
    public Club updateClubSettings(String userId, String name, String description,
                                   String logo, String banner, String city,
                                   String address, Map<String, Object> socialLinks,
                                   Integer courtCount) {
        Club club = clubRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Club", "userId", userId));

        if (name != null) club.setName(name);
        if (description != null) club.setDescription(description);
        if (logo != null) club.setLogo(logo);
        if (banner != null) club.setBanner(banner);
        if (city != null) club.setCity(city);
        if (address != null) club.setAddress(address);
        if (socialLinks != null) club.setSocialLinks(socialLinks);
        if (courtCount != null) club.setCourtCount(courtCount);

        club = clubRepository.save(club);
        log.info("Club settings updated for club {}", club.getId());
        return club;
    }

    /**
     * Get club analytics/earnings data.
     * Mirrors: GET /api/club/:clubId/earnings
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getClubAnalytics(String clubId) {
        Club club = clubRepository.findById(clubId)
                .orElseThrow(() -> new ResourceNotFoundException("Club", "id", clubId));

        // Stub analytics data matching the Express API
        Map<String, Object> analytics = new HashMap<>();
        analytics.put("balance", 0);
        analytics.put("totalRevenue", 0);
        analytics.put("subscriptionCount", 0);
        analytics.put("lastPayout", 0);
        analytics.put("revenueSources", List.of());
        analytics.put("payoutHistory", List.of());

        return analytics;
    }

    /**
     * Get clubs with coordinates for the live map, with live status.
     * Mirrors: GET /api/clubs/live-map
     */
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getLiveMapClubs() {
        List<Club> clubs = clubRepository.findByLatitudeNotNullAndLongitudeNotNull();

        return clubs.stream().map(club -> {
            List<Stream> liveStreams = streamRepository.findByClubIdAndStatus(club.getId(), StreamStatus.LIVE);
            int viewers = liveStreams.stream().mapToInt(Stream::getViewerCount).sum();

            Map<String, Object> map = new HashMap<>();
            map.put("id", club.getId());
            map.put("name", club.getName());
            map.put("slug", club.getSlug());
            map.put("city", club.getCity());
            map.put("lat", club.getLatitude());
            map.put("lng", club.getLongitude());
            map.put("courts", club.getCourtCount());
            map.put("isLive", !liveStreams.isEmpty());
            map.put("viewers", viewers);
            return map;
        }).toList();
    }

    /**
     * Get clubs with coordinates (for map).
     * Mirrors: GET /api/map/clubs
     */
    @Transactional(readOnly = true)
    public List<Club> getClubsByLocation() {
        List<Club> clubs = clubRepository.findByLatitudeNotNullAndLongitudeNotNull();
        // Initialize live streams for each club
        clubs.forEach(club -> {
            List<Stream> liveStreams = streamRepository.findByClubIdAndStatus(club.getId(), StreamStatus.LIVE);
            // Set only live streams on the club object
            club.setStreams(liveStreams);
        });
        return clubs;
    }
}
