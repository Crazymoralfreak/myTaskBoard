package com.yourapp.service;

import com.yourapp.model.User;
import com.yourapp.model.NotificationPreferences;
import com.yourapp.model.NotificationType;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.telegram.telegrambots.meta.api.methods.send.SendMessage;
import org.telegram.telegrambots.meta.exceptions.TelegramApiException;

@Service
@RequiredArgsConstructor
public class TelegramNotificationService {
    
    private final TelegramBotService telegramBotService;
    
    public void sendTaskAssignedNotification(User user, String taskTitle) {
        if (!shouldSendNotification(user, NotificationType.TASK_ASSIGNED)) {
            return;
        }
        
        String message = String.format("You have been assigned to task: %s", taskTitle);
        sendNotification(user, message);
    }
    
    public void sendTaskUpdatedNotification(User user, String taskTitle) {
        if (!shouldSendNotification(user, NotificationType.TASK_UPDATED)) {
            return;
        }
        
        String message = String.format("Task has been updated: %s", taskTitle);
        sendNotification(user, message);
    }
    
    public void sendTaskStatusChangedNotification(User user, String taskTitle, String newStatus) {
        if (!shouldSendNotification(user, NotificationType.TASK_STATUS_CHANGED)) {
            return;
        }
        
        String message = String.format("Task status changed to %s: %s", newStatus, taskTitle);
        sendNotification(user, message);
    }
    
    public void sendMentionNotification(User user, String taskTitle, String comment) {
        if (!shouldSendNotification(user, NotificationType.NEW_COMMENT_MENTION)) {
            return;
        }
        
        String message = String.format("You were mentioned in task %s: %s", taskTitle, comment);
        sendNotification(user, message);
    }
    
    private boolean shouldSendNotification(User user, NotificationType type) {
        if (user.getTelegramChatId() == null) {
            return false;
        }
        
        NotificationPreferences prefs = user.getNotificationPreferences();
        if (prefs == null || !prefs.isGlobalNotificationsEnabled() || !prefs.isTelegramNotificationsEnabled()) {
            return false;
        }
        
        return switch (type) {
            case TASK_ASSIGNED -> prefs.isTaskAssignedNotifications();
            case TASK_UPDATED -> prefs.isTaskUpdatedNotifications();
            case TASK_STATUS_CHANGED -> prefs.isTaskStatusChangedNotifications();
            case NEW_COMMENT_MENTION -> prefs.isMentionNotifications();
            case TASK_CREATED -> prefs.isTaskCreatedNotifications();
            case TASK_DELETED -> prefs.isTaskDeletedNotifications();
            case TASK_COMMENT_ADDED -> prefs.isTaskCommentAddedNotifications();
            case SUBTASK_CREATED -> prefs.isSubtaskCreatedNotifications();
            case SUBTASK_COMPLETED -> prefs.isSubtaskCompletedNotifications();
            case BOARD_INVITE -> prefs.isBoardInviteNotifications();
            case BOARD_MEMBER_ADDED -> prefs.isBoardMemberAddedNotifications();
            case BOARD_MEMBER_REMOVED -> prefs.isBoardMemberRemovedNotifications();
            case ATTACHMENT_ADDED -> prefs.isAttachmentAddedNotifications();
            case DEADLINE_REMINDER -> prefs.isDeadlineReminderNotifications();
            case ROLE_CHANGED -> prefs.isRoleChangedNotifications();
            case TASK_DUE_SOON -> prefs.isTaskDueSoonNotifications();
            case TASK_OVERDUE -> prefs.isTaskOverdueNotifications();
            default -> false;
        };
    }
    
    private void sendNotification(User user, String message) {
        if (user.getTelegramChatId() == null) {
            return;
        }
        
        SendMessage sendMessage = new SendMessage();
        sendMessage.setChatId(user.getTelegramChatId());
        sendMessage.setText(message);
        
        try {
            telegramBotService.execute(sendMessage);
        } catch (TelegramApiException e) {
            // Логирование ошибки
            System.err.println("Error sending Telegram notification: " + e.getMessage());
        }
    }
}