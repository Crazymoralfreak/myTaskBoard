package com.yourapp.dto;

import com.yourapp.model.TaskPriority;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.Set;

@Data
public class TaskResponse {
    private Long id;
    private String title;
    private String description;
    private Integer position;
    private LocalDateTime dueDate;
    private TaskPriority priority;
    private Set<String> tags;
    private Long columnId;
    private Long assigneeId;
    private TaskStatusResponse customStatus;

    @Data
    public static class TaskStatusResponse {
        private Long id;
        private String name;
        private String color;
        private Integer position;
        private boolean isDefault;
        private boolean isCustom;
    }
} 