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
} 