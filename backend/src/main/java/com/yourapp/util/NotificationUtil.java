package com.yourapp.util;

import com.yourapp.model.*;
import com.yourapp.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/**
 * Утилитарный класс для создания уведомлений
 * Централизует логику создания различных типов уведомлений
 */
@Component
@RequiredArgsConstructor
public class NotificationUtil {
    
    private final NotificationService notificationService;
    
    // ==================== TASK NOTIFICATIONS ====================
    
    public void notifyTaskCreated(Task task) {
        if (task.getAssignee() != null) {
            notificationService.createNotification(
                task.getAssignee().getId(),
                NotificationType.TASK_CREATED,
                "Новая задача создана",
                "Вам назначена новая задача: " + task.getTitle(),
                getBoardTaskId(task),
                "TASK"
            );
        }
    }
    
    public void notifyTaskAssigned(Task task, User assignee) {
        notificationService.createNotification(
            assignee.getId(),
            NotificationType.TASK_ASSIGNED,
            "Вам назначена задача",
            "Вам назначена задача: " + task.getTitle(),
            getBoardTaskId(task),
            "TASK"
        );
    }
    
    public void notifyTaskUpdated(Task task) {
        if (task.getAssignee() != null) {
            notificationService.createNotification(
                task.getAssignee().getId(),
                NotificationType.TASK_UPDATED,
                "Задача обновлена",
                "Задача была обновлена: " + task.getTitle(),
                getBoardTaskId(task),
                "TASK"
            );
        }
    }
    
    public void notifyTaskDeleted(Task task) {
        if (task.getAssignee() != null) {
            notificationService.createNotification(
                task.getAssignee().getId(),
                NotificationType.TASK_DELETED,
                "Задача удалена",
                "Задача была удалена: " + task.getTitle(),
                getBoardTaskId(task),
                "TASK"
            );
        }
    }
    
    public void notifyTaskStatusChanged(Task task, String oldStatus, String newStatus) {
        if (task.getAssignee() != null) {
            notificationService.createNotification(
                task.getAssignee().getId(),
                NotificationType.TASK_STATUS_CHANGED,
                "Изменен статус задачи",
                String.format("Статус задачи \"%s\" изменен с \"%s\" на \"%s\"", 
                    task.getTitle(), oldStatus, newStatus),
                getBoardTaskId(task),
                "TASK"
            );
        }
    }
    
    public void notifyTaskOverdue(Task task) {
        if (task.getAssignee() != null) {
            notificationService.createNotification(
                task.getAssignee().getId(),
                NotificationType.TASK_OVERDUE,
                "Задача просрочена",
                "Задача просрочена: " + task.getTitle(),
                getBoardTaskId(task),
                "TASK"
            );
        }
    }
    
    public void notifyTaskDueSoon(Task task, long daysRemaining) {
        if (task.getAssignee() != null) {
            notificationService.createNotification(
                task.getAssignee().getId(),
                NotificationType.TASK_DUE_SOON,
                "Приближается дедлайн",
                String.format("До завершения задачи \"%s\" осталось %d дн.", 
                    task.getTitle(), daysRemaining),
                getBoardTaskId(task),
                "TASK"
            );
        }
    }
    
    public void notifyDeadlineReminder(Task task) {
        if (task.getAssignee() != null) {
            notificationService.createNotification(
                task.getAssignee().getId(),
                NotificationType.DEADLINE_REMINDER,
                "Напоминание о дедлайне",
                "Завтра истекает срок выполнения задачи: " + task.getTitle(),
                getBoardTaskId(task),
                "TASK"
            );
        }
    }
    
    // ==================== COMMENT NOTIFICATIONS ====================
    
    public void notifyCommentAdded(Task task, User author) {
        if (task.getAssignee() != null && !task.getAssignee().getId().equals(author.getId())) {
            notificationService.createNotification(
                task.getAssignee().getId(),
                NotificationType.TASK_COMMENT_ADDED,
                "Новый комментарий к задаче",
                author.getUsername() + " добавил комментарий к задаче: " + task.getTitle(),
                getBoardTaskId(task),
                "TASK"
            );
        }
    }
    
    public void notifyUserMentioned(User mentionedUser, Task task, User author) {
        if (!mentionedUser.getId().equals(author.getId())) {
            notificationService.createNotification(
                mentionedUser.getId(),
                NotificationType.NEW_COMMENT_MENTION,
                "Вас упомянули в комментарии",
                author.getUsername() + " упомянул вас в комментарии к задаче: " + task.getTitle(),
                getBoardTaskId(task),
                "TASK"
            );
        }
    }
    
    // ==================== ATTACHMENT NOTIFICATIONS ====================
    
    public void notifyAttachmentAdded(Task task, User uploader, String fileName) {
        if (task.getAssignee() != null && !task.getAssignee().getId().equals(uploader.getId())) {
            notificationService.createNotification(
                task.getAssignee().getId(),
                NotificationType.ATTACHMENT_ADDED,
                "Добавлено вложение к задаче",
                uploader.getUsername() + " добавил файл \"" + fileName + "\" к задаче: " + task.getTitle(),
                getBoardTaskId(task),
                "TASK"
            );
        }
    }
    
    // ==================== SUBTASK NOTIFICATIONS ====================
    
    public void notifySubtaskCreated(Subtask subtask) {
        Task parentTask = subtask.getParentTask();
        if (parentTask != null && parentTask.getAssignee() != null) {
            notificationService.createNotification(
                parentTask.getAssignee().getId(),
                NotificationType.SUBTASK_CREATED,
                "Создана подзадача",
                "Создана подзадача: " + subtask.getTitle() + " для задачи: " + parentTask.getTitle(),
                getBoardTaskId(parentTask),
                "TASK"
            );
        }
    }
    
    public void notifySubtaskCompleted(Subtask subtask) {
        Task parentTask = subtask.getParentTask();
        if (parentTask != null && parentTask.getAssignee() != null) {
            notificationService.createNotification(
                parentTask.getAssignee().getId(),
                NotificationType.SUBTASK_COMPLETED,
                "Подзадача завершена",
                "Подзадача завершена: " + subtask.getTitle() + " для задачи: " + parentTask.getTitle(),
                getBoardTaskId(parentTask),
                "TASK"
            );
        }
    }
    
    // ==================== BOARD NOTIFICATIONS ====================
    
    public void notifyBoardInvite(User user, Board board) {
        notificationService.createNotification(
            user.getId(),
            NotificationType.BOARD_INVITE,
            "Приглашение на доску",
            "Вы приглашены на доску: " + board.getName(),
            board.getId(),
            "BOARD"
        );
    }
    
    public void notifyBoardMemberAdded(User user, Board board) {
        notificationService.createNotification(
            user.getId(),
            NotificationType.BOARD_MEMBER_ADDED,
            "Вы добавлены в доску",
            "Вы были добавлены в доску: " + board.getName(),
            board.getId(),
            "BOARD"
        );
    }
    
    public void notifyBoardMemberRemoved(User user, Board board) {
        notificationService.createNotification(
            user.getId(),
            NotificationType.BOARD_MEMBER_REMOVED,
            "Вы удалены из доски",
            "Вы были удалены из доски: " + board.getName(),
            board.getId(),
            "BOARD"
        );
    }
    
    public void notifyRoleChanged(User user, Board board, Role newRole) {
        notificationService.createNotification(
            user.getId(),
            NotificationType.ROLE_CHANGED,
            "Изменена роль на доске",
            "Ваша роль на доске \"" + board.getName() + "\" изменена на: " + newRole.getName(),
            board.getId(),
            "BOARD"
        );
    }
    
    // ==================== HELPER METHODS ====================
    
    private String getBoardTaskId(Task task) {
        return task.getColumn().getBoard().getId() + ":" + task.getId();
    }
} 