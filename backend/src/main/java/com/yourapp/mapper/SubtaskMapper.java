package com.yourapp.mapper;

import com.yourapp.dto.SubtaskDto;
import com.yourapp.dto.CreateSubtaskRequest;
import com.yourapp.model.Subtask;
import org.springframework.stereotype.Component;
import java.util.List;
import java.util.ArrayList;

@Component
public class SubtaskMapper {
    
    public SubtaskDto toDto(Subtask subtask) {
        if (subtask == null) {
            return null;
        }
        
        SubtaskDto dto = new SubtaskDto();
        dto.setId(subtask.getId());
        dto.setTitle(subtask.getTitle());
        dto.setDescription(subtask.getDescription());
        dto.setCompleted(subtask.isCompleted());
        dto.setPosition(subtask.getPosition());
        dto.setDueDate(subtask.getDueDate());
        dto.setEstimatedHours(subtask.getEstimatedHours());
        dto.setCreatedAt(subtask.getCreatedAt());
        dto.setUpdatedAt(subtask.getUpdatedAt());
        
        if (subtask.getAssignee() != null) {
            SubtaskDto.UserResponse assignee = new SubtaskDto.UserResponse();
            assignee.setId(subtask.getAssignee().getId());
            assignee.setUsername(subtask.getAssignee().getUsername());
            assignee.setEmail(subtask.getAssignee().getEmail());
            assignee.setAvatarUrl(subtask.getAssignee().getAvatarUrl());
            assignee.setDisplayName(subtask.getAssignee().getDisplayName());
            dto.setAssignee(assignee);
        }
        
        return dto;
    }
    
    public List<SubtaskDto> toDtoList(List<Subtask> subtasks) {
        if (subtasks == null) {
            return new ArrayList<>();
        }
        
        List<SubtaskDto> dtoList = new ArrayList<>();
        for (Subtask subtask : subtasks) {
            SubtaskDto dto = toDto(subtask);
            if (dto != null) {
                dtoList.add(dto);
            }
        }
        return dtoList;
    }
    
    public Subtask toEntity(CreateSubtaskRequest request) {
        if (request == null) {
            return null;
        }
        
        Subtask subtask = new Subtask();
        subtask.setTitle(request.getTitle());
        subtask.setDescription(request.getDescription());
        subtask.setDueDate(request.getDueDate());
        subtask.setEstimatedHours(request.getEstimatedHours());
        subtask.setCompleted(false); // По умолчанию не завершена
        
        return subtask;
    }
} 