package com.yourapp.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;
import java.util.Set;
import com.yourapp.model.TaskPriority;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateTaskRequest {
    private String title;
    private String description;
    private LocalDateTime dueDate;
    private Long columnId;
    private Long statusId;
    private Long assigneeId;
    private TaskPriority priority;
    private Set<String> tags;
} 