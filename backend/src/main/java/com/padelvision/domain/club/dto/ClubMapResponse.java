package com.padelvision.domain.club.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ClubMapResponse {
    private String id;
    private String name;
    private String slug;
    private String city;
    private Double latitude;
    private Double longitude;
    private boolean isLive;
    private int viewerCount;
}
