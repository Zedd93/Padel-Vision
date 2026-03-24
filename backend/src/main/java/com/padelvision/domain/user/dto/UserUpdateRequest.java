package com.padelvision.domain.user.dto;

import lombok.Data;

@Data
public class UserUpdateRequest {
    private String name;
    private String username;
    private String image;
    private String city;
}
