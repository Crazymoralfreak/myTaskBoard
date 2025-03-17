package com.yourapp.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import com.yourapp.model.TaskType;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TaskTypeDto {
    private Long id;
    private String name;
    private String color;
    private String icon;
    private Integer position;
    private boolean isDefault;
    private boolean isCustom;
    private Long boardId;
    
    // Метод для конвертации Entity в DTO
    public static TaskTypeDto fromEntity(TaskType type) {
        if (type == null) {
            return null;
        }
        
        return TaskTypeDto.builder()
                .id(type.getId())
                .name(type.getName())
                .color(type.getColor())
                .icon(type.getIcon())
                .position(type.getPosition())
                .isDefault(type.isDefault())
                .isCustom(type.isCustom())
                .boardId(type.getBoard() != null ? type.getBoard().getId() : null)
                .build();
    }
    
    // Метод для обновления сущности из DTO
    public TaskType toEntity(TaskType type) {
        type.setName(this.name);
        type.setColor(this.color);
        type.setIcon(this.icon);
        type.setPosition(this.position);
        type.setDefault(this.isDefault);
        type.setCustom(this.isCustom);
        return type;
    }
} 