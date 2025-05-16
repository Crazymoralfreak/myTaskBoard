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
    
    // Геттеры
    public Long getId() {
        return this.id;
    }
    
    public String getName() {
        return this.name;
    }
    
    public String getDescription() {
        return this.description;
    }
    
    public TaskDataDTO getTaskData() {
        return this.taskData;
    }
    
    public String getBoardId() {
        return this.boardId;
    }
    
    public Long getCreatedBy() {
        return this.createdBy;
    }
    
    public LocalDateTime getCreatedAt() {
        return this.createdAt;
    }
    
    public LocalDateTime getUpdatedAt() {
        return this.updatedAt;
    }
    
    // Сеттеры
    public void setId(Long id) {
        this.id = id;
    }
    
    public void setName(String name) {
        this.name = name;
    }
    
    public void setDescription(String description) {
        this.description = description;
    }
    
    public void setTaskData(TaskDataDTO taskData) {
        this.taskData = taskData;
    }
    
    public void setBoardId(String boardId) {
        this.boardId = boardId;
    }
    
    public void setCreatedBy(Long createdBy) {
        this.createdBy = createdBy;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
    
    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    @Data
    public static class TaskDataDTO {
        private String title;
        private String description;
        private Long typeId;
        private Long statusId;
        private TaskPriority priority;
        private LocalDateTime dueDate;
        private Set<String> tags;
        
        // Геттеры
        public String getTitle() {
            return this.title;
        }
        
        public String getDescription() {
            return this.description;
        }
        
        public Long getTypeId() {
            return this.typeId;
        }
        
        public Long getStatusId() {
            return this.statusId;
        }
        
        public TaskPriority getPriority() {
            return this.priority;
        }
        
        public LocalDateTime getDueDate() {
            return this.dueDate;
        }
        
        public Set<String> getTags() {
            return this.tags;
        }
        
        // Сеттеры
        public void setTitle(String title) {
            this.title = title;
        }
        
        public void setDescription(String description) {
            this.description = description;
        }
        
        public void setTypeId(Long typeId) {
            this.typeId = typeId;
        }
        
        public void setStatusId(Long statusId) {
            this.statusId = statusId;
        }
        
        public void setPriority(TaskPriority priority) {
            this.priority = priority;
        }
        
        public void setDueDate(LocalDateTime dueDate) {
            this.dueDate = dueDate;
        }
        
        public void setTags(Set<String> tags) {
            this.tags = tags;
        }
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