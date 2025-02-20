package com.yourapp.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "task_links")
@Data
@NoArgsConstructor
public class TaskLink {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "source_task_id")
    private Task sourceTask;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "target_task_id")
    private Task targetTask;

    @Column(name = "link_type", nullable = false)
    @Enumerated(EnumType.STRING)
    private LinkType type;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    public enum LinkType {
        BLOCKS,
        BLOCKED_BY,
        RELATES_TO
    }
} 