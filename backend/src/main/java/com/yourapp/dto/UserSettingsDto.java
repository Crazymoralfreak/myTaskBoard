package com.yourapp.dto;

import lombok.Data;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserSettingsDto {
    private Boolean darkMode;
    private Boolean compactView;
    private Boolean enableAnimations;
    private Boolean browserNotifications;
    private Boolean emailNotifications;
    private Boolean telegramNotifications;
    private String language;
    private String timezone;
} 