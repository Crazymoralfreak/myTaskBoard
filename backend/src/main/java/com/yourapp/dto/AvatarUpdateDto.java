package com.yourapp.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AvatarUpdateDto {
    private String avatarUrl;
    
    // Геттеры
    public String getAvatarUrl() {
        return this.avatarUrl;
    }
    
    // Сеттеры
    public void setAvatarUrl(String avatarUrl) {
        this.avatarUrl = avatarUrl;
    }
} 