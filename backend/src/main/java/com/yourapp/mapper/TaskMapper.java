package com.yourapp.mapper;

import com.yourapp.dto.TaskResponse;
import com.yourapp.model.Task;
import com.yourapp.model.TaskStatus;
import org.springframework.stereotype.Component;
import java.util.List;
import java.util.ArrayList;
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
            if (task.getColumn().getBoard() != null) {
                response.setBoardId(task.getColumn().getBoard().getId());
            }
        }
        
        if (task.getAssignee() != null) {
            response.setAssigneeId(task.getAssignee().getId());
            
            TaskResponse.UserResponse assignee = new TaskResponse.UserResponse();
            assignee.setId(task.getAssignee().getId());
            assignee.setUsername(task.getAssignee().getUsername());
            assignee.setAvatarUrl(task.getAssignee().getAvatarUrl());
            assignee.setEmail(task.getAssignee().getEmail());
            assignee.setDisplayName(task.getAssignee().getDisplayName());
            response.setAssignee(assignee);
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

        // Устанавливаем счетчик комментариев из поля модели
        response.setCommentCount(task.getCommentCount() != null ? task.getCommentCount().longValue() : 0L);
        
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
                        author.setAvatarUrl(comment.getAuthor().getAvatarUrl());
                        author.setEmail(comment.getAuthor().getEmail());
                        author.setDisplayName(comment.getAuthor().getDisplayName());
                        commentResponse.setAuthor(author);
                    }
                    
                    return commentResponse;
                })
                .collect(Collectors.toList());
            response.setComments(comments);
        }
        
        // Устанавливаем счетчик вложений из поля модели
        response.setAttachmentCount(task.getAttachmentCount() != null ? task.getAttachmentCount().longValue() : 0L);
        
        if (task.getAttachments() != null && !task.getAttachments().isEmpty()) {
            List<TaskResponse.AttachmentResponse> attachments = task.getAttachments().stream()
                .map(attachment -> {
                    TaskResponse.AttachmentResponse attachmentResponse = new TaskResponse.AttachmentResponse();
                    attachmentResponse.setId(attachment.getId());
                    attachmentResponse.setFilename(attachment.getFileName());
                    attachmentResponse.setUrl(attachment.getFilePath());
                    attachmentResponse.setMimeType(attachment.getContentType());
                    attachmentResponse.setSize(attachment.getSize());
                    attachmentResponse.setCreatedAt(attachment.getCreatedAt());
                    
                    if (attachment.getUploadedBy() != null) {
                        TaskResponse.UserResponse uploadedBy = new TaskResponse.UserResponse();
                        uploadedBy.setId(attachment.getUploadedBy().getId());
                        uploadedBy.setUsername(attachment.getUploadedBy().getUsername());
                        uploadedBy.setAvatarUrl(attachment.getUploadedBy().getAvatarUrl());
                        uploadedBy.setEmail(attachment.getUploadedBy().getEmail());
                        uploadedBy.setDisplayName(attachment.getUploadedBy().getDisplayName());
                        attachmentResponse.setUploadedBy(uploadedBy);
                    }
                    
                    return attachmentResponse;
                })
                .collect(Collectors.toList());
            response.setAttachments(attachments);
        } else {
            response.setAttachments(new ArrayList<>());
        }
        
        // Обрабатываем подзадачи
        if (task.getSubtasks() != null && !task.getSubtasks().isEmpty()) {
            List<TaskResponse.SubtaskResponse> subtasks = task.getSubtasks().stream()
                .map(subtask -> {
                    TaskResponse.SubtaskResponse subtaskResponse = new TaskResponse.SubtaskResponse();
                    subtaskResponse.setId(subtask.getId());
                    subtaskResponse.setTitle(subtask.getTitle());
                    subtaskResponse.setDescription(subtask.getDescription());
                    subtaskResponse.setCompleted(subtask.isCompleted());
                    subtaskResponse.setPosition(subtask.getPosition());
                    subtaskResponse.setDueDate(subtask.getDueDate());
                    subtaskResponse.setEstimatedHours(subtask.getEstimatedHours());
                    subtaskResponse.setCreatedAt(subtask.getCreatedAt());
                    subtaskResponse.setUpdatedAt(subtask.getUpdatedAt());
                    
                    if (subtask.getAssignee() != null) {
                        TaskResponse.UserResponse assignee = new TaskResponse.UserResponse();
                        assignee.setId(subtask.getAssignee().getId());
                        assignee.setUsername(subtask.getAssignee().getUsername());
                        assignee.setAvatarUrl(subtask.getAssignee().getAvatarUrl());
                        assignee.setEmail(subtask.getAssignee().getEmail());
                        assignee.setDisplayName(subtask.getAssignee().getDisplayName());
                        subtaskResponse.setAssignee(assignee);
                    }
                    
                    return subtaskResponse;
                })
                .collect(Collectors.toList());
            response.setSubtasks(subtasks);
            response.setSubtaskCount((long) subtasks.size());
        } else {
            response.setSubtasks(new ArrayList<>());
            response.setSubtaskCount(0L);
        }
        
        return response;
    }
} 