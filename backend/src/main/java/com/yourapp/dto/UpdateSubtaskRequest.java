package com.yourapp.dto;

import lombok.Data;
import jakarta.validation.constraints.Size;
import java.time.LocalDateTime;

@Data
public class UpdateSubtaskRequest {
    
    @Size(max = 255, message = "Название подзадачи не должно превышать 255 символов")
    private String title;
    
    @Size(max = 1000, message = "Описание подзадачи не должно превышать 1000 символов")
    private String description;
    
    private Boolean completed;
    
    private Integer position;
    
    private LocalDateTime dueDate;
    
    private Integer estimatedHours;
    
    private Long assigneeId;
} 