package com.yourapp.dto;

import com.yourapp.model.TaskPriority;
import com.yourapp.model.TaskTemplate;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.Set;

@Data
public class TaskTemplateDTO {
    private Long id;
    private String name;
    private String description;
    private TaskDataDTO taskData;
    private String boardId;
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
    
    public static TaskTemplateDTO fromEntity(TaskTemplate template) {
        if (template == null) {
            return null;
        }
        
        TaskTemplateDTO dto = new TaskTemplateDTO();
        dto.setId(template.getId());
        dto.setName(template.getName());
        dto.setDescription(template.getDescription());
        
        // Создаем TaskDataDTO
        TaskDataDTO taskData = new TaskDataDTO();
        if (template.getType() != null) {
            taskData.setTypeId(template.getType().getId());
        }
        if (template.getStatus() != null) {
            taskData.setStatusId(template.getStatus().getId());
        }
        
        taskData.setTitle(template.getName());
        taskData.setDescription(template.getDescription());
        taskData.setTags(template.getTags());
        
        dto.setTaskData(taskData);
        
        // Устанавливаем связанные сущности
        if (template.getBoard() != null) {
            dto.setBoardId(template.getBoard().getId());
        }
        if (template.getCreatedBy() != null) {
            dto.setCreatedBy(template.getCreatedBy().getId());
        }
        
        return dto;
    }
} 