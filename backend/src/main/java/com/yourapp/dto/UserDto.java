package com.yourapp.dto;

import lombok.Data;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserDto {
    private Long id;
    private String email;
    private String username;
    private String displayName;
    private String avatarUrl;
    private String phoneNumber;
    private String position;
    private String bio;
    private UserSettingsDto settings;
} 