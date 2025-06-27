package com.yourapp.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO для передачи настроек пользователя
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserSettingsDto {
    private Boolean darkMode;
    private Boolean compactMode;
    private Boolean enableAnimations;
    private Boolean browserNotifications;
    private Boolean emailNotifications;
    private Boolean telegramNotifications;
    private String language;
    private String timezone;
    
    // Настройки приватности
    private String profileVisibility;
    private Boolean emailVisible;
    private Boolean phoneVisible;
    private Boolean positionVisible;
    private Boolean bioVisible;
} 