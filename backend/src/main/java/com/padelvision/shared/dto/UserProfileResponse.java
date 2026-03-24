package com.padelvision.shared.dto;

import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.Instant;
import java.util.List;

@Data
@Builder
public class UserProfileResponse {
    private String id;
    private String email;
    private String username;
    private String name;
    private String image;
    private String city;
    private String role;
    private String viewerTier;
    private Instant createdAt;
    private int matchesPlayed;
    private double winRate;
    private int clipsCount;
    private long totalViews;
    private double eloRating;
    private String clubName;
    private List<String> badges;
}
