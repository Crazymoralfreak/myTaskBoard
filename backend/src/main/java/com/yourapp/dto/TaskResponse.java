package com.yourapp.dto;

import com.yourapp.model.TaskPriority;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.Set;
import java.util.List;

@Data
public class TaskResponse {
    private Long id;
    private String title;
    private String description;
    private Integer position;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private Long daysRemaining;
    private Long columnId;
    private String columnColor;
    private Long assigneeId;
    private TaskPriority priority;
    private Set<String> tags;
    private TaskStatusResponse customStatus;
    private TaskTypeResponse type;
    private List<CommentResponse> comments;
    private Long commentCount;
    private List<AttachmentResponse> attachments;
    private Long attachmentCount;

    @Data
    public static class TaskStatusResponse {
        private Long id;
        private String name;
        private String color;
        private Integer position;
        private boolean isDefault;
        private boolean isCustom;
    }

    @Data
    public static class TaskTypeResponse {
        private Long id;
        private String name;
        private String color;
        private String icon;
        private Integer position;
        private boolean isDefault;
        private boolean isCustom;
    }

    @Data
    public static class CommentResponse {
        private Long id;
        private String content;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
        private UserResponse author;
    }

    @Data
    public static class UserResponse {
        private Long id;
        private String username;
        private String avatarUrl;
        private String email;
        private String displayName;
    }

    @Data
    public static class AttachmentResponse {
        private Long id;
        private String filename;
        private String url;
        private String mimeType;
        private Long size;
        private LocalDateTime createdAt;
        private UserResponse uploadedBy;
    }
} 