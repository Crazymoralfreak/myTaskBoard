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
public class UserSettingsDTO {
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
    
    // Ручная реализация builder
    public static UserSettingsDTOBuilder builder() {
        return new UserSettingsDTOBuilder();
    }
    
    // Ручная реализация геттеров
    public Boolean getDarkMode() {
        return this.darkMode;
    }
    
    public Boolean getCompactMode() {
        return this.compactMode;
    }
    
    public Boolean getEnableAnimations() {
        return this.enableAnimations;
    }
    
    public Boolean getBrowserNotifications() {
        return this.browserNotifications;
    }
    
    public Boolean getEmailNotifications() {
        return this.emailNotifications;
    }
    
    public Boolean getTelegramNotifications() {
        return this.telegramNotifications;
    }
    
    public String getLanguage() {
        return this.language;
    }
    
    public String getTimezone() {
        return this.timezone;
    }
    
    public String getProfileVisibility() {
        return this.profileVisibility;
    }
    
    public Boolean getEmailVisible() {
        return this.emailVisible;
    }
    
    public Boolean getPhoneVisible() {
        return this.phoneVisible;
    }
    
    public Boolean getPositionVisible() {
        return this.positionVisible;
    }
    
    public Boolean getBioVisible() {
        return this.bioVisible;
    }
    
    // Ручная реализация сеттеров
    public void setDarkMode(Boolean darkMode) {
        this.darkMode = darkMode;
    }
    
    public void setCompactMode(Boolean compactMode) {
        this.compactMode = compactMode;
    }
    
    public void setEnableAnimations(Boolean enableAnimations) {
        this.enableAnimations = enableAnimations;
    }
    
    public void setBrowserNotifications(Boolean browserNotifications) {
        this.browserNotifications = browserNotifications;
    }
    
    public void setEmailNotifications(Boolean emailNotifications) {
        this.emailNotifications = emailNotifications;
    }
    
    public void setTelegramNotifications(Boolean telegramNotifications) {
        this.telegramNotifications = telegramNotifications;
    }
    
    public void setLanguage(String language) {
        this.language = language;
    }
    
    public void setTimezone(String timezone) {
        this.timezone = timezone;
    }
    
    public void setProfileVisibility(String profileVisibility) {
        this.profileVisibility = profileVisibility;
    }
    
    public void setEmailVisible(Boolean emailVisible) {
        this.emailVisible = emailVisible;
    }
    
    public void setPhoneVisible(Boolean phoneVisible) {
        this.phoneVisible = phoneVisible;
    }
    
    public void setPositionVisible(Boolean positionVisible) {
        this.positionVisible = positionVisible;
    }
    
    public void setBioVisible(Boolean bioVisible) {
        this.bioVisible = bioVisible;
    }
    
    public static class UserSettingsDTOBuilder {
        private Boolean darkMode;
        private Boolean compactMode;
        private Boolean enableAnimations;
        private Boolean browserNotifications;
        private Boolean emailNotifications;
        private Boolean telegramNotifications;
        private String language;
        private String timezone;
        private String profileVisibility;
        private Boolean emailVisible;
        private Boolean phoneVisible;
        private Boolean positionVisible;
        private Boolean bioVisible;
        
        public UserSettingsDTOBuilder darkMode(Boolean darkMode) {
            this.darkMode = darkMode;
            return this;
        }
        
        public UserSettingsDTOBuilder compactMode(Boolean compactMode) {
            this.compactMode = compactMode;
            return this;
        }
        
        public UserSettingsDTOBuilder enableAnimations(Boolean enableAnimations) {
            this.enableAnimations = enableAnimations;
            return this;
        }
        
        public UserSettingsDTOBuilder browserNotifications(Boolean browserNotifications) {
            this.browserNotifications = browserNotifications;
            return this;
        }
        
        public UserSettingsDTOBuilder emailNotifications(Boolean emailNotifications) {
            this.emailNotifications = emailNotifications;
            return this;
        }
        
        public UserSettingsDTOBuilder telegramNotifications(Boolean telegramNotifications) {
            this.telegramNotifications = telegramNotifications;
            return this;
        }
        
        public UserSettingsDTOBuilder language(String language) {
            this.language = language;
            return this;
        }
        
        public UserSettingsDTOBuilder timezone(String timezone) {
            this.timezone = timezone;
            return this;
        }
        
        public UserSettingsDTOBuilder profileVisibility(String profileVisibility) {
            this.profileVisibility = profileVisibility;
            return this;
        }
        
        public UserSettingsDTOBuilder emailVisible(Boolean emailVisible) {
            this.emailVisible = emailVisible;
            return this;
        }
        
        public UserSettingsDTOBuilder phoneVisible(Boolean phoneVisible) {
            this.phoneVisible = phoneVisible;
            return this;
        }
        
        public UserSettingsDTOBuilder positionVisible(Boolean positionVisible) {
            this.positionVisible = positionVisible;
            return this;
        }
        
        public UserSettingsDTOBuilder bioVisible(Boolean bioVisible) {
            this.bioVisible = bioVisible;
            return this;
        }
        
        public UserSettingsDTO build() {
            UserSettingsDTO dto = new UserSettingsDTO();
            dto.darkMode = this.darkMode;
            dto.compactMode = this.compactMode;
            dto.enableAnimations = this.enableAnimations;
            dto.browserNotifications = this.browserNotifications;
            dto.emailNotifications = this.emailNotifications;
            dto.telegramNotifications = this.telegramNotifications;
            dto.language = this.language;
            dto.timezone = this.timezone;
            dto.profileVisibility = this.profileVisibility;
            dto.emailVisible = this.emailVisible;
            dto.phoneVisible = this.phoneVisible;
            dto.positionVisible = this.positionVisible;
            dto.bioVisible = this.bioVisible;
            return dto;
        }
    }
} 