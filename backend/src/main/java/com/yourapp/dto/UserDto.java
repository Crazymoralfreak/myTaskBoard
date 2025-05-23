package com.yourapp.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO для передачи данных пользователя
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserDTO {
    private Long id;
    private String email;
    private String username;
    private String displayName;
    private String avatarUrl;
    private String phoneNumber;
    private String position;
    private String bio;
    private UserSettingsDTO settings;
    
    // Геттеры
    public Long getId() {
        return this.id;
    }
    
    public String getEmail() {
        return this.email;
    }
    
    public String getUsername() {
        return this.username;
    }
    
    public String getDisplayName() {
        return this.displayName;
    }
    
    public String getAvatarUrl() {
        return this.avatarUrl;
    }
    
    public String getPhoneNumber() {
        return this.phoneNumber;
    }
    
    public String getPosition() {
        return this.position;
    }
    
    public String getBio() {
        return this.bio;
    }
    
    public UserSettingsDTO getSettings() {
        return this.settings;
    }
    
    // Сеттеры
    public void setId(Long id) {
        this.id = id;
    }
    
    public void setEmail(String email) {
        this.email = email;
    }
    
    public void setUsername(String username) {
        this.username = username;
    }
    
    public void setDisplayName(String displayName) {
        this.displayName = displayName;
    }
    
    public void setAvatarUrl(String avatarUrl) {
        this.avatarUrl = avatarUrl;
    }
    
    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
    }
    
    public void setPosition(String position) {
        this.position = position;
    }
    
    public void setBio(String bio) {
        this.bio = bio;
    }
    
    public void setSettings(UserSettingsDTO settings) {
        this.settings = settings;
    }
    
    // Ручная реализация метода builder
    public static UserDTOBuilder builder() {
        return new UserDTOBuilder();
    }
    
    public static class UserDTOBuilder {
        private Long id;
        private String email;
        private String username;
        private String displayName;
        private String avatarUrl;
        private String phoneNumber;
        private String position;
        private String bio;
        private UserSettingsDTO settings;
        
        public UserDTOBuilder id(Long id) {
            this.id = id;
            return this;
        }
        
        public UserDTOBuilder email(String email) {
            this.email = email;
            return this;
        }
        
        public UserDTOBuilder username(String username) {
            this.username = username;
            return this;
        }
        
        public UserDTOBuilder displayName(String displayName) {
            this.displayName = displayName;
            return this;
        }
        
        public UserDTOBuilder avatarUrl(String avatarUrl) {
            this.avatarUrl = avatarUrl;
            return this;
        }
        
        public UserDTOBuilder phoneNumber(String phoneNumber) {
            this.phoneNumber = phoneNumber;
            return this;
        }
        
        public UserDTOBuilder position(String position) {
            this.position = position;
            return this;
        }
        
        public UserDTOBuilder bio(String bio) {
            this.bio = bio;
            return this;
        }
        
        public UserDTOBuilder settings(UserSettingsDTO settings) {
            this.settings = settings;
            return this;
        }
        
        public UserDTO build() {
            UserDTO dto = new UserDTO();
            dto.id = this.id;
            dto.email = this.email;
            dto.username = this.username;
            dto.displayName = this.displayName;
            dto.avatarUrl = this.avatarUrl;
            dto.phoneNumber = this.phoneNumber;
            dto.position = this.position;
            dto.bio = this.bio;
            dto.settings = this.settings;
            return dto;
        }
    }
} 