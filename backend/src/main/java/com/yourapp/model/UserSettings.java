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
} 