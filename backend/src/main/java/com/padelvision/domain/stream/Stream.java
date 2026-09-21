package com.padelvision.domain.stream;

import com.padelvision.domain.club.Club;
import com.padelvision.domain.match.Match;
import com.padelvision.shared.enums.StreamStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "streams")
public class Stream {

    @Id
    @Column(name = "id", length = 36)
    private String id;

    @Column(name = "club_id", insertable = false, updatable = false)
    private String clubId;

    @Column(name = "match_id", unique = true, insertable = false, updatable = false)
    private String matchId;

    @Column(name = "title")
    private String title;

    @Column(name = "description", length = 10000)
    private String description;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private StreamStatus status = StreamStatus.OFFLINE;

    /**
     * @deprecated Pozostałość po własnym pipelinie RTMP/HLS. Kolumna zostaje
     * nullable na czas migracji na YouTube — usunięcie w V12
     * (docs/YOUTUBE_MIGRATION_PLAN.md §9).
     */
    @Deprecated
    @Column(name = "hls_url")
    private String hlsUrl;

    /** Identyfikator filmu na YouTube — ten sam co broadcast id. */
    @Column(name = "youtube_video_id", length = 24)
    private String youtubeVideoId;

    @Column(name = "youtube_broadcast_id", length = 24)
    private String youtubeBroadcastId;

    /** unlisted | public | private */
    @Column(name = "youtube_privacy", length = 16)
    private String youtubePrivacy;

    /** normal | low | ultraLow */
    @Column(name = "latency_preference", length = 16)
    private String latencyPreference;

    @Column(name = "thumbnail_url")
    private String thumbnailUrl;

    @Builder.Default
    @Column(name = "viewer_count", nullable = false)
    private int viewerCount = 0;

    @Builder.Default
    @Column(name = "peak_viewers", nullable = false)
    private int peakViewers = 0;

    @Column(name = "started_at")
    private Instant startedAt;

    @Column(name = "ended_at")
    private Instant endedAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "club_id")
    private Club club;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "match_id", unique = true)
    private Match match;

    @OneToOne(mappedBy = "stream", cascade = CascadeType.ALL, orphanRemoval = true)
    private Vod vod;

    @OneToMany(mappedBy = "stream", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<ChatMessage> chatMessages = new ArrayList<>();

    @OneToMany(mappedBy = "stream", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<StreamTag> tags = new ArrayList<>();

    @PrePersist
    public void prePersist() {
        if (this.id == null) {
            this.id = UUID.randomUUID().toString();
        }
    }
}
