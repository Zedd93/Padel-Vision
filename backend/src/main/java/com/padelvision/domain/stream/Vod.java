package com.padelvision.domain.stream;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "vods")
public class Vod {

    @Id
    @Column(name = "id", length = 36)
    private String id;

    @Column(name = "stream_id", unique = true, insertable = false, updatable = false)
    private String streamId;

    @Column(name = "s3_url")
    private String s3Url;

    @Column(name = "thumbnail_url")
    private String thumbnailUrl;

    @Column(name = "duration")
    private int duration;

    @Column(name = "file_size")
    private Long fileSize;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "stream_id", unique = true)
    private Stream stream;

    @OneToMany(mappedBy = "vod", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Highlight> highlights = new ArrayList<>();

    @PrePersist
    public void prePersist() {
        if (this.id == null) {
            this.id = UUID.randomUUID().toString();
        }
    }
}
