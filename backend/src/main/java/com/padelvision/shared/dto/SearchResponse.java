package com.padelvision.shared.dto;

import com.padelvision.domain.club.dto.ClubResponse;
import com.padelvision.domain.player.dto.PlayerResponse;
import com.padelvision.domain.tournament.dto.TournamentResponse;
import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class SearchResponse {
    private List<ClubResponse> clubs;
    private List<TournamentResponse> tournaments;
    private List<PlayerResponse> players;
}
