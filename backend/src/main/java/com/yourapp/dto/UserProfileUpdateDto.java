package com.yourapp.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileUpdateDto {
    private String username;
    private String email;
    private String displayName;
    private String phoneNumber;
    private String position;
    private String bio;
    private String avatarUrl;
    
    // Геттеры
    public String getUsername() {
        return this.username;
    }
    
    public String getEmail() {
        return this.email;
    }
    
    public String getDisplayName() {
        return this.displayName;
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
    
    public String getAvatarUrl() {
        return this.avatarUrl;
    }
    
    // Сеттеры
    public void setUsername(String username) {
        this.username = username;
    }
    
    public void setEmail(String email) {
        this.email = email;
    }
    
    public void setDisplayName(String displayName) {
        this.displayName = displayName;
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
    
    public void setAvatarUrl(String avatarUrl) {
        this.avatarUrl = avatarUrl;
    }
} 