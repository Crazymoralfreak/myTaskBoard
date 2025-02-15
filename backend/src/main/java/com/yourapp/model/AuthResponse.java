package com.yourapp.model;

import lombok.Data;
import lombok.Builder;

@Data
@Builder
public class AuthResponse {
    private String token;
    private String username;
    private String userId;
} 