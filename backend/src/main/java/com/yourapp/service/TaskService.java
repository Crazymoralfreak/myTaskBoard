package com.yourapp.service;

import com.yourapp.model.*;
import com.yourapp.repository.TaskRepository;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class TaskService {
    private final TaskRepository taskRepository;
    private final TaskHistoryService taskHistoryService;
    private final TelegramNotificationService telegramNotificationService;

    public TaskService(
        TaskRepository taskRepository,
        TaskHistoryService taskHistoryService,
        TelegramNotificationService telegramNotificationService
    ) {
        this.taskRepository = taskRepository;
        this.taskHistoryService = taskHistoryService;
        this.telegramNotificationService = telegramNotificationService;
    }

    public Task createTask(Task task, User createdBy) {
        Task createdTask = taskRepository.save(task);
        taskHistoryService.logTaskChange(
            createdTask.getId(),
            createdBy,
            "created",
            null,
            createdTask.toString()
        );
        
        String message = String.format(
            "New task created: %s\nDescription: %s\nCreated by: %s",
            createdTask.getTitle(),
            createdTask.getDescription(),
            createdBy.getUsername()
        );
        
        if (createdTask.getAssignee() != null) {
            telegramNotificationService.sendTaskNotification(
                createdTask.getAssignee(),
                createdTask,
                message,
                TelegramNotificationService.NotificationType.TASK_ASSIGNED
            );
        }
        
        return createdTask;
    }

    public Task updateTask(Long id, Task taskDetails, User changedBy) {
        Task task = taskRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Task not found"));
        
        trackChanges(task, taskDetails, changedBy);
        
        task.setTitle(taskDetails.getTitle());
        task.setDescription(taskDetails.getDescription());
        task.setDueDate(taskDetails.getDueDate());
        task.setPriority(taskDetails.getPriority());
        task.setTags(taskDetails.getTags());
        task.setAssignee(taskDetails.getAssignee());
        
        Task updatedTask = taskRepository.save(task);
        
        if (updatedTask.getAssignee() != null) {
            String message = String.format(
                "Task updated: %s\nUpdated by: %s\nChanges: %s",
                updatedTask.getTitle(),
                changedBy.getUsername(),
                getChangeSummary(task, taskDetails)
            );
            
            telegramNotificationService.sendTaskNotification(
                updatedTask.getAssignee(),
                updatedTask,
                message,
                TelegramNotificationService.NotificationType.TASK_UPDATED
            );
        }
        
        return updatedTask;
    }

    public Task moveTask(Long taskId, Long newColumnId, User movedBy) {
        Task task = taskRepository.findById(taskId)
            .orElseThrow(() -> new RuntimeException("Task not found"));
        
        Column newColumn = new Column();
        newColumn.setId(newColumnId);
        
        taskHistoryService.logTaskChange(
            taskId,
            movedBy,
            "column",
            task.getColumn() != null ? task.getColumn().getId().toString() : "null",
            newColumnId.toString()
        );
        
        task.setColumn(newColumn);
        
        Task movedTask = taskRepository.save(task);
        
        if (movedTask.getAssignee() != null) {
            String message = String.format(
                "Task moved: %s\nMoved to: Column %d\nMoved by: %s",
                movedTask.getTitle(),
                newColumnId,
                movedBy.getUsername()
            );
            
            telegramNotificationService.sendTaskNotification(
                movedTask.getAssignee(),
                movedTask,
                message,
                TelegramNotificationService.NotificationType.TASK_MOVED
            );
        }
        
        return movedTask;
    }

    public void deleteTask(Long id) {
        taskRepository.deleteById(id);
    }

    private void trackChanges(Task original, Task updated, User changedBy) {
        if (!original.getTitle().equals(updated.getTitle())) {
            taskHistoryService.logTaskChange(
                original.getId(),
                changedBy,
                "title",
                original.getTitle(),
                updated.getTitle()
            );
        }
        if (!original.getDescription().equals(updated.getDescription())) {
            taskHistoryService.logTaskChange(
                original.getId(),
                changedBy,
                "description",
                original.getDescription(),
                updated.getDescription()
            );
        }
        if (original.getPriority() != updated.getPriority()) {
            taskHistoryService.logTaskChange(
                original.getId(),
                changedBy,
                "priority",
                String.valueOf(original.getPriority()),
                String.valueOf(updated.getPriority())
            );
        }
        if (!original.getTags().equals(updated.getTags())) {
            taskHistoryService.logTaskChange(
                original.getId(),
                changedBy,
                "tags",
                original.getTags().toString(),
                updated.getTags().toString()
            );
        }
        if (!original.getAssignee().equals(updated.getAssignee())) {
            taskHistoryService.logTaskChange(
                original.getId(),
                changedBy,
                "assignee",
                original.getAssignee() != null ? original.getAssignee().getId().toString() : "null",
                updated.getAssignee() != null ? updated.getAssignee().getId().toString() : "null"
            );
        }
    }

    private String getChangeSummary(Task original, Task updated) {
        StringBuilder changes = new StringBuilder();
        
        if (!original.getTitle().equals(updated.getTitle())) {
            changes.append(String.format("\n- Title: %s → %s", original.getTitle(), updated.getTitle()));
        }
        if (!original.getDescription().equals(updated.getDescription())) {
            changes.append("\n- Description updated");
        }
        if (original.getPriority() != updated.getPriority()) {
            changes.append(String.format("\n- Priority: %d → %d", original.getPriority(), updated.getPriority()));
        }
        if (!original.getTags().equals(updated.getTags())) {
            changes.append("\n- Tags updated");
        }
        if (!original.getAssignee().equals(updated.getAssignee())) {
            changes.append(String.format(
                "\n- Assignee: %s → %s",
                original.getAssignee() != null ? original.getAssignee().getUsername() : "Unassigned",
                updated.getAssignee() != null ? updated.getAssignee().getUsername() : "Unassigned"
            ));
        }
        
        return changes.toString();
    }
}