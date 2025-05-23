package com.yourapp.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.fasterxml.jackson.annotation.JsonBackReference;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "user_settings")
public class UserSettings {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "user_id", nullable = false)
    @JsonBackReference
    private User user;

    @Column(name = "dark_mode")
    private Boolean darkMode = false;

    @Column(name = "compact_view")
    private Boolean compactMode = false;

    @Column(name = "enable_animations")
    private Boolean enableAnimations = true;

    @Column(name = "browser_notifications")
    private Boolean browserNotifications = true;

    @Column(name = "email_notifications")
    private Boolean emailNotifications = true;

    @Column(name = "telegram_notifications")
    private Boolean telegramNotifications = true;

    @Column(name = "profile_visibility")
    private String profileVisibility = "public";

    @Column(name = "email_visible")
    private Boolean emailVisible = true;

    @Column(name = "phone_visible")
    private Boolean phoneVisible = true;

    @Column(name = "position_visible")
    private Boolean positionVisible = true;

    @Column(name = "bio_visible")
    private Boolean bioVisible = true;

    @Column(name = "language")
    private String language = "ru";

    @Column(name = "timezone")
    private String timezone = "UTC+3";
    
    // Ручная реализация builder
    public static UserSettingsBuilder builder() {
        return new UserSettingsBuilder();
    }
    
    // Геттеры
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
    
    public String getLanguage() {
        return this.language;
    }
    
    public String getTimezone() {
        return this.timezone;
    }
    
    // Сеттеры
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
    
    public void setLanguage(String language) {
        this.language = language;
    }
    
    public void setTimezone(String timezone) {
        this.timezone = timezone;
    }
    
    // Класс Builder
    public static class UserSettingsBuilder {
        private Long id;
        private User user;
        private Boolean darkMode = false;
        private Boolean compactMode = false;
        private Boolean enableAnimations = true;
        private Boolean browserNotifications = true;
        private Boolean emailNotifications = true;
        private Boolean telegramNotifications = true;
        private String profileVisibility = "public";
        private Boolean emailVisible = true;
        private Boolean phoneVisible = true;
        private Boolean positionVisible = true;
        private Boolean bioVisible = true;
        private String language = "ru";
        private String timezone = "UTC+3";
        
        public UserSettingsBuilder id(Long id) {
            this.id = id;
            return this;
        }
        
        public UserSettingsBuilder user(User user) {
            this.user = user;
            return this;
        }
        
        public UserSettingsBuilder darkMode(Boolean darkMode) {
            this.darkMode = darkMode;
            return this;
        }
        
        public UserSettingsBuilder compactMode(Boolean compactMode) {
            this.compactMode = compactMode;
            return this;
        }
        
        public UserSettingsBuilder enableAnimations(Boolean enableAnimations) {
            this.enableAnimations = enableAnimations;
            return this;
        }
        
        public UserSettingsBuilder browserNotifications(Boolean browserNotifications) {
            this.browserNotifications = browserNotifications;
            return this;
        }
        
        public UserSettingsBuilder emailNotifications(Boolean emailNotifications) {
            this.emailNotifications = emailNotifications;
            return this;
        }
        
        public UserSettingsBuilder telegramNotifications(Boolean telegramNotifications) {
            this.telegramNotifications = telegramNotifications;
            return this;
        }
        
        public UserSettingsBuilder profileVisibility(String profileVisibility) {
            this.profileVisibility = profileVisibility;
            return this;
        }
        
        public UserSettingsBuilder emailVisible(Boolean emailVisible) {
            this.emailVisible = emailVisible;
            return this;
        }
        
        public UserSettingsBuilder phoneVisible(Boolean phoneVisible) {
            this.phoneVisible = phoneVisible;
            return this;
        }
        
        public UserSettingsBuilder positionVisible(Boolean positionVisible) {
            this.positionVisible = positionVisible;
            return this;
        }
        
        public UserSettingsBuilder bioVisible(Boolean bioVisible) {
            this.bioVisible = bioVisible;
            return this;
        }
        
        public UserSettingsBuilder language(String language) {
            this.language = language;
            return this;
        }
        
        public UserSettingsBuilder timezone(String timezone) {
            this.timezone = timezone;
            return this;
        }
        
        public UserSettings build() {
            UserSettings settings = new UserSettings();
            settings.id = this.id;
            settings.user = this.user;
            settings.darkMode = this.darkMode;
            settings.compactMode = this.compactMode;
            settings.enableAnimations = this.enableAnimations;
            settings.browserNotifications = this.browserNotifications;
            settings.emailNotifications = this.emailNotifications;
            settings.telegramNotifications = this.telegramNotifications;
            settings.profileVisibility = this.profileVisibility;
            settings.emailVisible = this.emailVisible;
            settings.phoneVisible = this.phoneVisible;
            settings.positionVisible = this.positionVisible;
            settings.bioVisible = this.bioVisible;
            settings.language = this.language;
            settings.timezone = this.timezone;
            return settings;
        }
    }
} 