package com.padelvision.domain.player.dto;

import lombok.Builder;
import lombok.Data;

import java.util.Map;

@Data
@Builder
public class PlayerResponse {
    private String id;
    private String name;
    private String slug;
    private String clubId;
    private String avatar;
    private Map<String, Object> stats;
    private String clubName;
    private long followersCount;
}
