package com.yourapp.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

/**
 * DTO для передачи данных о пользователе-участнике доски
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BoardMemberDTO {
    private Long userId;
    private String username;
    private String email;
    private String avatarUrl;
    private String displayName;
    private RoleDTO role;
    private LocalDateTime joinedAt;
    
    // Геттеры
    public Long getUserId() {
        return this.userId;
    }
    
    public String getUsername() {
        return this.username;
    }
    
    public String getEmail() {
        return this.email;
    }
    
    public String getAvatarUrl() {
        return this.avatarUrl;
    }
    
    public String getDisplayName() {
        return this.displayName;
    }
    
    public RoleDTO getRole() {
        return this.role;
    }
    
    public LocalDateTime getJoinedAt() {
        return this.joinedAt;
    }
    
    // Сеттеры
    public void setUserId(Long userId) {
        this.userId = userId;
    }
    
    public void setUsername(String username) {
        this.username = username;
    }
    
    public void setEmail(String email) {
        this.email = email;
    }
    
    public void setAvatarUrl(String avatarUrl) {
        this.avatarUrl = avatarUrl;
    }
    
    public void setDisplayName(String displayName) {
        this.displayName = displayName;
    }
    
    public void setRole(RoleDTO role) {
        this.role = role;
    }
    
    public void setJoinedAt(LocalDateTime joinedAt) {
        this.joinedAt = joinedAt;
    }
    
    // Ручная реализация builder
    public static BoardMemberDTOBuilder builder() {
        return new BoardMemberDTOBuilder();
    }
    
    public static class BoardMemberDTOBuilder {
        private Long userId;
        private String username;
        private String email;
        private String avatarUrl;
        private String displayName;
        private RoleDTO role;
        private LocalDateTime joinedAt;
        
        public BoardMemberDTOBuilder userId(Long userId) {
            this.userId = userId;
            return this;
        }
        
        public BoardMemberDTOBuilder username(String username) {
            this.username = username;
            return this;
        }
        
        public BoardMemberDTOBuilder email(String email) {
            this.email = email;
            return this;
        }
        
        public BoardMemberDTOBuilder avatarUrl(String avatarUrl) {
            this.avatarUrl = avatarUrl;
            return this;
        }
        
        public BoardMemberDTOBuilder displayName(String displayName) {
            this.displayName = displayName;
            return this;
        }
        
        public BoardMemberDTOBuilder role(RoleDTO role) {
            this.role = role;
            return this;
        }
        
        public BoardMemberDTOBuilder joinedAt(LocalDateTime joinedAt) {
            this.joinedAt = joinedAt;
            return this;
        }
        
        public BoardMemberDTO build() {
            BoardMemberDTO dto = new BoardMemberDTO();
            dto.userId = this.userId;
            dto.username = this.username;
            dto.email = this.email;
            dto.avatarUrl = this.avatarUrl;
            dto.displayName = this.displayName;
            dto.role = this.role;
            dto.joinedAt = this.joinedAt;
            return dto;
        }
    }
} 