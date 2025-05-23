package com.yourapp.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;
import lombok.EqualsAndHashCode;
import com.fasterxml.jackson.annotation.JsonBackReference;

import java.time.LocalDateTime;

/**
 * Сущность для представления ролей пользователей в системе
 */
@Entity
@Table(name = "roles", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"name", "board_id"})
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Role {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "name", nullable = false, length = 100)
    private String name;
    
    @Column(name = "description")
    private String description;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "board_id")
    @JsonBackReference
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Board board;
    
    @Column(name = "is_system")
    private boolean isSystem;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @PrePersist
    public void beforeSave() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    public void beforeUpdate() {
        updatedAt = LocalDateTime.now();
    }
    
    // Геттеры
    public Long getId() {
        return this.id;
    }
    
    public String getName() {
        return this.name;
    }
    
    public String getDescription() {
        return this.description;
    }
    
    public Board getBoard() {
        return this.board;
    }
    
    public boolean isSystem() {
        return this.isSystem;
    }
    
    public LocalDateTime getCreatedAt() {
        return this.createdAt;
    }
    
    public LocalDateTime getUpdatedAt() {
        return this.updatedAt;
    }
    
    // Сеттеры
    public void setId(Long id) {
        this.id = id;
    }
    
    public void setName(String name) {
        this.name = name;
    }
    
    public void setDescription(String description) {
        this.description = description;
    }
    
    public void setBoard(Board board) {
        this.board = board;
    }
    
    public void setSystem(boolean isSystem) {
        this.isSystem = isSystem;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
    
    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
    
    // Ручная реализация builder
    public static RoleBuilder builder() {
        return new RoleBuilder();
    }
    
    public static class RoleBuilder {
        private Long id;
        private String name;
        private String description;
        private Board board;
        private boolean isSystem;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
        
        public RoleBuilder id(Long id) {
            this.id = id;
            return this;
        }
        
        public RoleBuilder name(String name) {
            this.name = name;
            return this;
        }
        
        public RoleBuilder description(String description) {
            this.description = description;
            return this;
        }
        
        public RoleBuilder board(Board board) {
            this.board = board;
            return this;
        }
        
        public RoleBuilder isSystem(boolean isSystem) {
            this.isSystem = isSystem;
            return this;
        }
        
        public RoleBuilder createdAt(LocalDateTime createdAt) {
            this.createdAt = createdAt;
            return this;
        }
        
        public RoleBuilder updatedAt(LocalDateTime updatedAt) {
            this.updatedAt = updatedAt;
            return this;
        }
        
        public Role build() {
            Role role = new Role();
            role.id = this.id;
            role.name = this.name;
            role.description = this.description;
            role.board = this.board;
            role.isSystem = this.isSystem;
            role.createdAt = this.createdAt;
            role.updatedAt = this.updatedAt;
            return role;
        }
    }
} 