package com.yourapp.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import com.yourapp.model.TaskStatus;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TaskStatusDto {
    private Long id;
    private String name;
    private String color;
    private Integer position;
    private boolean isDefault;
    private boolean isCustom;
    private Long boardId;
    
    // Метод для конвертации Entity в DTO
    public static TaskStatusDto fromEntity(TaskStatus status) {
        if (status == null) {
            return null;
        }
        
        return TaskStatusDto.builder()
                .id(status.getId())
                .name(status.getName())
                .color(status.getColor())
                .position(status.getPosition())
                .isDefault(status.isDefault())
                .isCustom(status.isCustom())
                .boardId(status.getBoard() != null ? status.getBoard().getId() : null)
                .build();
    }
    
    // Метод для обновления сущности из DTO
    public TaskStatus toEntity(TaskStatus status) {
        status.setName(this.name);
        status.setColor(this.color);
        status.setPosition(this.position);
        status.setDefault(this.isDefault);
        status.setCustom(this.isCustom);
        return status;
    }
} 