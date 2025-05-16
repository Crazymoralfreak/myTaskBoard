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
 * Модель для хранения ссылок-приглашений на доски
 */
@Entity
@Table(name = "board_invite_links")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BoardInviteLink {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "board_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Board board;
    
    @Column(name = "token", nullable = false, unique = true)
    private String token;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private User createdBy;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "default_role_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Role defaultRole;
    
    @Column(name = "max_uses")
    private Integer maxUses;
    
    @Column(name = "use_count")
    private Integer useCount;
    
    @Column(name = "expires_at")
    private LocalDateTime expiresAt;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @Column(name = "is_active")
    private boolean isActive;
    
    @PrePersist
    public void beforeSave() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (useCount == null) {
            useCount = 0;
        }
        if (isActive) {
            isActive = true;
        }
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    public void beforeUpdate() {
        updatedAt = LocalDateTime.now();
    }
    
    /**
     * Проверяет, является ли ссылка валидной
     * @return true, если ссылка валидна и может быть использована
     */
    public boolean isValid() {
        // Проверка активности
        if (!isActive) {
            return false;
        }
        
        // Проверка срока действия
        if (expiresAt != null && expiresAt.isBefore(LocalDateTime.now())) {
            return false;
        }
        
        // Проверка лимита использований
        if (maxUses != null && useCount >= maxUses) {
            return false;
        }
        
        return true;
    }
    
    /**
     * Увеличивает счетчик использований ссылки
     */
    public void incrementUseCount() {
        useCount = useCount + 1;
    }
} 