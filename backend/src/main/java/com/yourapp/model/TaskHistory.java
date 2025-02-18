package com.yourapp.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Data
@Table(name = "task_history")
public class TaskHistory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "username")
    private String username;
    
    @Column(name = "avatar_url")
    private String avatarUrl;
    
    @Column(name = "field_changed")
    private String action;
    
    @Column(name = "old_value")
    private String oldValue;
    
    @Column(name = "new_value")
    private String newValue;
    
    @Column(name = "changed_at")
    private LocalDateTime timestamp;
    
    @ManyToOne
    @JoinColumn(name = "task_id")
    private Task task;
    
    @ManyToOne
    @JoinColumn(name = "changed_by_id")
    private User changedBy;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}