package com.padelvision.domain.club.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ClubResponse {
    private String id;
    private String name;
    private String slug;
    private String city;
    private String address;
    private String description;
    private String logo;
    private String banner;
    private int courtCount;
    private String plan;
    private boolean isVerified;
    private Double latitude;
    private Double longitude;
    private long followersCount;
    private long streamsCount;
    private boolean isLive;
    private int currentViewers;
}
