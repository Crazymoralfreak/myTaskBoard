package com.yourapp.service;

import com.yourapp.model.User;
import com.yourapp.model.NotificationPreferences;
import com.yourapp.model.NotificationType;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.telegram.telegrambots.meta.api.methods.send.SendMessage;
import org.telegram.telegrambots.meta.exceptions.TelegramApiException;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class TelegramNotificationService {
    
    private final TelegramBotService telegramBotService;
    private final NotificationPreferencesService preferencesService;
    
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
    
    /**
     * Универсальный метод для отправки любого уведомления в Telegram
     * @param user пользователь
     * @param message сообщение для отправки
     */
    public void sendNotification(User user, String message) {
        if (user.getTelegramChatId() == null) {
            log.debug("Telegram уведомление не отправлено пользователю {}: нет telegram chat ID", user.getUsername());
            return;
        }
        
        try {
            SendMessage sendMessage = new SendMessage();
            sendMessage.setChatId(user.getTelegramChatId());
            sendMessage.setText(message);
            
            telegramBotService.execute(sendMessage);
            log.info("Telegram уведомление успешно отправлено пользователю {}", user.getUsername());
        } catch (TelegramApiException e) {
            log.error("Ошибка отправки Telegram уведомления пользователю {}: {}", user.getUsername(), e.getMessage());
        }
    }
    
    private boolean shouldSendNotification(User user, NotificationType type) {
        if (user.getTelegramChatId() == null) {
            log.debug("Telegram уведомление не отправлено пользователю {}: нет telegram chat ID", user.getUsername());
            return false;
        }
        
        try {
            var preferences = preferencesService.getUserPreferences(user.getId());
            
            if (!preferences.isGlobalNotificationsEnabled()) {
                log.debug("Telegram уведомление не отправлено пользователю {}: глобальные уведомления отключены", user.getUsername());
                return false;
            }
            
            if (!preferences.isTelegramNotificationsEnabled()) {
                log.debug("Telegram уведомление не отправлено пользователю {}: Telegram уведомления отключены", user.getUsername());
                return false;
            }
            
            boolean typeEnabled = switch (type) {
                case TASK_ASSIGNED -> preferences.isTaskAssignedNotifications();
                case TASK_UPDATED -> preferences.isTaskUpdatedNotifications();
                case TASK_STATUS_CHANGED -> preferences.isTaskStatusChangedNotifications();
                case NEW_COMMENT_MENTION -> preferences.isMentionNotifications();
                case TASK_CREATED -> preferences.isTaskCreatedNotifications();
                case TASK_DELETED -> preferences.isTaskDeletedNotifications();
                case TASK_COMMENT_ADDED -> preferences.isTaskCommentAddedNotifications();
                case SUBTASK_CREATED -> preferences.isSubtaskCreatedNotifications();
                case SUBTASK_COMPLETED -> preferences.isSubtaskCompletedNotifications();
                case BOARD_INVITE -> preferences.isBoardInviteNotifications();
                case BOARD_MEMBER_ADDED -> preferences.isBoardMemberAddedNotifications();
                case BOARD_MEMBER_REMOVED -> preferences.isBoardMemberRemovedNotifications();
                case ATTACHMENT_ADDED -> preferences.isAttachmentAddedNotifications();
                case DEADLINE_REMINDER -> preferences.isDeadlineReminderNotifications();
                case ROLE_CHANGED -> preferences.isRoleChangedNotifications();
                case TASK_DUE_SOON -> preferences.isTaskDueSoonNotifications();
                case TASK_OVERDUE -> preferences.isTaskOverdueNotifications();
                default -> false;
            };
            
            if (!typeEnabled) {
                log.debug("Telegram уведомление не отправлено пользователю {}: тип {} отключен в настройках", 
                        user.getUsername(), type);
                return false;
            }
            
            log.debug("Telegram уведомление разрешено для пользователя {} тип {}", user.getUsername(), type);
            return true;
            
        } catch (Exception e) {
            log.error("Ошибка при проверке настроек уведомлений для пользователя {}: {}", user.getUsername(), e.getMessage());
            return false;
        }
    }
}