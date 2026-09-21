package com.padelvision.integration.youtube.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

/**
 * Odpowiedź z https://oauth2.googleapis.com/token.
 * {@code refreshToken} przychodzi tylko przy pierwszej zgodzie
 * (wymaga {@code access_type=offline} i {@code prompt=consent}).
 */
@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class GoogleTokenResponse {

    @JsonProperty("access_token")
    private String accessToken;

    @JsonProperty("refresh_token")
    private String refreshToken;

    @JsonProperty("expires_in")
    private Long expiresIn;

    @JsonProperty("token_type")
    private String tokenType;

    @JsonProperty("scope")
    private String scope;
}
