package com.yourapp.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonManagedReference;

@Entity
@Table(name = "time_tracking")
@Data
@NoArgsConstructor
public class TimeTracking {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "task_id")
    @JsonBackReference("task-timetracking")
    private Task task;

    @Column(name = "started_at", nullable = false)
    private LocalDateTime startedAt;

    @Column(name = "ended_at")
    private LocalDateTime endedAt;

    private Integer duration; // в минутах

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    @JsonManagedReference("user-timetrackings")
    private User createdBy;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    public void stop() {
        if (endedAt == null) {
            endedAt = LocalDateTime.now();
            duration = calculateDuration();
        }
    }

    private int calculateDuration() {
        return (int) java.time.Duration.between(startedAt, endedAt).toMinutes();
    }
} 