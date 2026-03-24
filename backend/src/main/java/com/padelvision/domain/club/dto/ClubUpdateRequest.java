package com.padelvision.domain.club.dto;

import lombok.Data;

@Data
public class ClubUpdateRequest {
    private String name;
    private String city;
    private String address;
    private String description;
    private String logo;
    private String banner;
}
