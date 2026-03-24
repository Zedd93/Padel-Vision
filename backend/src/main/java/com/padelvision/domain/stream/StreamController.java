package com.padelvision.domain.stream;

import com.padelvision.domain.stream.dto.StreamResponse;
import com.padelvision.shared.response.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/streams")
@RequiredArgsConstructor
@Tag(name = "Streams", description = "Public stream endpoints")
public class StreamController {

    private final StreamService streamService;

    @GetMapping("/live")
    public ResponseEntity<ApiResponse<List<StreamResponse>>> getLiveStreams() {
        List<StreamResponse> streams = streamService.getLiveStreams().stream()
                .map(this::toStreamResponse)
                .toList();
        return ResponseEntity.ok(ApiResponse.ok(streams));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<StreamResponse>> getStreamById(@PathVariable String id) {
        Stream stream = streamService.getStreamById(id);
        return ResponseEntity.ok(ApiResponse.ok(toStreamResponse(stream)));
    }

    @GetMapping("/archived")
    public ResponseEntity<ApiResponse<List<StreamResponse>>> getArchivedStreams(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        // Archived streams can be fetched via the service; for now return empty as
        // the service doesn't have a dedicated archived method yet.
        List<StreamResponse> streams = List.of();
        return ResponseEntity.ok(ApiResponse.ok(streams));
    }

    private StreamResponse toStreamResponse(Stream stream) {
        return StreamResponse.builder()
                .id(stream.getId())
                .clubId(stream.getClubId())
                .title(stream.getTitle())
                .description(stream.getDescription())
                .status(stream.getStatus() != null ? stream.getStatus().name() : null)
                .hlsUrl(stream.getHlsUrl())
                .thumbnailUrl(stream.getThumbnailUrl())
                .viewerCount(stream.getViewerCount())
                .peakViewers(stream.getPeakViewers())
                .startedAt(stream.getStartedAt())
                .endedAt(stream.getEndedAt())
                .createdAt(stream.getCreatedAt())
                .clubName(stream.getClub() != null ? stream.getClub().getName() : null)
                .clubSlug(stream.getClub() != null ? stream.getClub().getSlug() : null)
                .clubCity(stream.getClub() != null ? stream.getClub().getCity() : null)
                .clubLogo(stream.getClub() != null ? stream.getClub().getLogo() : null)
                .build();
    }
}
