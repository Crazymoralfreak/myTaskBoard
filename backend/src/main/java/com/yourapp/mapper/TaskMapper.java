package com.yourapp.mapper;

import com.yourapp.dto.TaskResponse;
import com.yourapp.model.Task;
import com.yourapp.model.TaskStatus;
import org.springframework.stereotype.Component;

@Component
public class TaskMapper {
    
    public TaskResponse toResponse(Task task) {
        if (task == null) {
            return null;
        }

        TaskResponse response = new TaskResponse();
        response.setId(task.getId());
        response.setTitle(task.getTitle());
        response.setDescription(task.getDescription());
        response.setPosition(task.getPosition());
        response.setStartDate(task.getStartDate());
        response.setEndDate(task.getEndDate());
        response.setDaysRemaining(task.getDaysRemaining());
        response.setPriority(task.getPriority());
        response.setTags(task.getTags());
        
        if (task.getColumn() != null) {
            response.setColumnId(task.getColumn().getId());
        }
        
        if (task.getAssignee() != null) {
            response.setAssigneeId(task.getAssignee().getId());
        }
        
        if (task.getCustomStatus() != null) {
            TaskResponse.TaskStatusResponse statusResponse = new TaskResponse.TaskStatusResponse();
            statusResponse.setId(task.getCustomStatus().getId());
            statusResponse.setName(task.getCustomStatus().getName());
            statusResponse.setColor(task.getCustomStatus().getColor());
            statusResponse.setPosition(task.getCustomStatus().getPosition());
            statusResponse.setDefault(task.getCustomStatus().isDefault());
            statusResponse.setCustom(task.getCustomStatus().isCustom());
            response.setCustomStatus(statusResponse);
        }
        
        return response;
    }
} 