package com.yourapp.mapper;

import com.yourapp.dto.TaskResponse;
import com.yourapp.model.Task;
import com.yourapp.model.TaskStatus;
import org.springframework.stereotype.Component;
import java.util.List;
import java.util.stream.Collectors;

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
            response.setColumnColor(task.getColumn().getColor());
        }
        
        if (task.getAssignee() != null) {
            response.setAssigneeId(task.getAssignee().getId());
        }
        
        if (task.getType() != null) {
            TaskResponse.TaskTypeResponse typeResponse = new TaskResponse.TaskTypeResponse();
            typeResponse.setId(task.getType().getId());
            typeResponse.setName(task.getType().getName());
            typeResponse.setColor(task.getType().getColor());
            typeResponse.setIcon(task.getType().getIcon());
            typeResponse.setPosition(task.getType().getPosition());
            typeResponse.setDefault(task.getType().isDefault());
            typeResponse.setCustom(task.getType().isCustom());
            response.setType(typeResponse);
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

        if (task.getComments() != null && !task.getComments().isEmpty()) {
            List<TaskResponse.CommentResponse> comments = task.getComments().stream()
                .map(comment -> {
                    TaskResponse.CommentResponse commentResponse = new TaskResponse.CommentResponse();
                    commentResponse.setId(comment.getId());
                    commentResponse.setContent(comment.getContent());
                    commentResponse.setCreatedAt(comment.getCreatedAt());
                    commentResponse.setUpdatedAt(comment.getUpdatedAt());
                    
                    if (comment.getAuthor() != null) {
                        TaskResponse.UserResponse author = new TaskResponse.UserResponse();
                        author.setId(comment.getAuthor().getId());
                        author.setUsername(comment.getAuthor().getUsername());
                        commentResponse.setAuthor(author);
                    }
                    
                    return commentResponse;
                })
                .collect(Collectors.toList());
            response.setComments(comments);
            response.setCommentCount((long) task.getComments().size());
        } else {
            response.setCommentCount(0L);
        }
        
        if (task.getAttachments() != null) {
            response.setAttachmentCount((long) task.getAttachments().size());
        } else {
            response.setAttachmentCount(0L);
        }
        
        return response;
    }
} 