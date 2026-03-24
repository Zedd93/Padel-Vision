package com.padelvision.domain.user.dto;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;

@Data
@Builder
public class UserResponse {
    private String id;
    private String email;
    private String username;
    private String name;
    private String image;
    private String city;
    private String role;
    private String viewerTier;
    private Instant createdAt;
}
