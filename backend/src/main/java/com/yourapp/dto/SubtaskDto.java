package com.yourapp.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class SubtaskDto {
    private Long id;
    private String title;
    private String description;
    private boolean completed;
    private Integer position;
    private LocalDateTime dueDate;
    private Integer estimatedHours;
    private UserResponse assignee;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    @Data
    public static class UserResponse {
        private Long id;
        private String username;
        private String email;
        private String avatarUrl;
        private String displayName;
    }
} 