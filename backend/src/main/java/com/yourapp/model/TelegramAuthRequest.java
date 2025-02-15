package com.yourapp.model;

import lombok.Data;

@Data
public class TelegramAuthRequest {
    private String telegramId;
    private String username;
    private String firstName;
    private String lastName;
} 