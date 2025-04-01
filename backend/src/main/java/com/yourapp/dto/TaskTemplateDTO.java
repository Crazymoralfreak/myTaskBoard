package com.yourapp.dto;

import com.yourapp.model.TaskPriority;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.Set;

@Data
public class TaskTemplateDTO {
    private Long id;
    private String name;
    private String description;
    private TaskDataDTO taskData;
    private Long boardId;
    private Long createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @Data
    public static class TaskDataDTO {
        private String title;
        private String description;
        private Long typeId;
        private Long statusId;
        private TaskPriority priority;
        private LocalDateTime dueDate;
        private Set<String> tags;
    }
} 