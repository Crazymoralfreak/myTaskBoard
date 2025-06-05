package com.yourapp.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;

/**
 * Модель для хранения уведомлений пользователей
 */
@Entity
@Table(name = "notifications")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Notification {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private User user;
    
    @Column(name = "title", nullable = false)
    private String title;
    
    @Column(name = "message", nullable = false)
    private String message;
    
    @Column(name = "type", nullable = false)
    private String type;
    
    @Column(name = "priority")
    @Enumerated(EnumType.STRING)
    private NotificationPriority priority;
    
    @Column(name = "related_entity_id")
    private String relatedEntityId;
    
    @Column(name = "related_entity_type")
    private String relatedEntityType;
    
    @Column(name = "group_key")
    private String groupKey;
    
    @Column(name = "is_read")
    private boolean isRead;
    
    @Column(name = "is_archived")
    private boolean isArchived;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @Column(name = "read_at")
    private LocalDateTime readAt;
    
    @PrePersist
    public void beforeSave() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        updatedAt = LocalDateTime.now();
        
        // Устанавливаем приоритет по умолчанию
        if (priority == null) {
            priority = NotificationPriority.NORMAL;
        }
    }
    
    @PreUpdate
    public void beforeUpdate() {
        updatedAt = LocalDateTime.now();
        
        // Устанавливаем время прочтения при отметке как прочитанное
        if (isRead && readAt == null) {
            readAt = LocalDateTime.now();
        }
    }
} 