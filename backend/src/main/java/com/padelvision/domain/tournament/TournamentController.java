package com.padelvision.domain.tournament;

import com.padelvision.domain.club.Club;
import com.padelvision.domain.club.ClubService;
import com.padelvision.domain.tournament.dto.TournamentCreateRequest;
import com.padelvision.domain.tournament.dto.TournamentResponse;
import com.padelvision.domain.tournament.dto.TournamentUpdateRequest;
import com.padelvision.shared.response.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tournaments")
@RequiredArgsConstructor
@Tag(name = "Tournaments", description = "Tournament endpoints")
public class TournamentController {

    private final TournamentService tournamentService;
    private final ClubService clubService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<TournamentResponse>>> getTournaments() {
        List<TournamentResponse> tournaments = tournamentService.getTournaments().stream()
                .map(this::toTournamentResponse)
                .toList();
        return ResponseEntity.ok(ApiResponse.ok(tournaments));
    }

    @GetMapping("/trending")
    public ResponseEntity<ApiResponse<List<TournamentResponse>>> getTrendingTournaments() {
        List<TournamentResponse> tournaments = tournamentService.getTrendingTournaments().stream()
                .map(this::toTournamentResponse)
                .toList();
        return ResponseEntity.ok(ApiResponse.ok(tournaments));
    }

    @PostMapping
    @PreAuthorize("hasRole('CLUB')")
    public ResponseEntity<ApiResponse<TournamentResponse>> createTournament(
            @Valid @RequestBody TournamentCreateRequest request) {
        String userId = getAuthenticatedUserId();
        Club club = clubService.getClubSettings(userId);

        Tournament tournament = tournamentService.createTournament(
                club.getId(),
                request.getName(),
                request.getFormat(),
                request.getCategory(),
                request.getLevel(),
                request.getDate(),
                request.getEndDate(),
                request.getMaxPairs(),
                request.getEntryFee(),
                request.getPrizes(),
                request.isPPV(),
                request.getPpvPrice()
        );
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(toTournamentResponse(tournament)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('CLUB')")
    public ResponseEntity<ApiResponse<TournamentResponse>> updateTournament(
            @PathVariable String id,
            @Valid @RequestBody TournamentUpdateRequest request) {
        Tournament tournament = tournamentService.updateTournament(
                id,
                request.getName(),
                request.getDate(),
                request.getEndDate(),
                request.getMaxPairs(),
                request.getEntryFee(),
                request.getPrizes(),
                request.getIsPPV(),
                request.getPpvPrice()
        );
        return ResponseEntity.ok(ApiResponse.ok(toTournamentResponse(tournament)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('CLUB')")
    public ResponseEntity<ApiResponse<Void>> deleteTournament(@PathVariable String id) {
        tournamentService.deleteTournament(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "Tournament deleted"));
    }

    private String getAuthenticatedUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth.getName();
    }

    private TournamentResponse toTournamentResponse(Tournament tournament) {
        return TournamentResponse.builder()
                .id(tournament.getId())
                .clubId(tournament.getClubId())
                .name(tournament.getName())
                .format(tournament.getFormat() != null ? tournament.getFormat().name() : null)
                .category(tournament.getCategory() != null ? tournament.getCategory().name() : null)
                .level(tournament.getLevel() != null ? tournament.getLevel().name() : null)
                .date(tournament.getDate())
                .endDate(tournament.getEndDate())
                .maxPairs(tournament.getMaxPairs())
                .entryFee(tournament.getEntryFee())
                .prizes(tournament.getPrizes())
                .isPPV(tournament.isPPV())
                .ppvPrice(tournament.getPpvPrice())
                .clubName(tournament.getClub() != null ? tournament.getClub().getName() : null)
                .clubCity(tournament.getClub() != null ? tournament.getClub().getCity() : null)
                .build();
    }
}
