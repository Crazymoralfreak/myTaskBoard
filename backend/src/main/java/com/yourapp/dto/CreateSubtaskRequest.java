package com.yourapp.dto;

import lombok.Data;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.LocalDateTime;

@Data
public class CreateSubtaskRequest {
    
    @NotBlank(message = "Название подзадачи обязательно")
    @Size(max = 255, message = "Название подзадачи не должно превышать 255 символов")
    private String title;
    
    @Size(max = 1000, message = "Описание подзадачи не должно превышать 1000 символов")
    private String description;
    
    private LocalDateTime dueDate;
    
    private Integer estimatedHours;
    
    private Long assigneeId;
} 