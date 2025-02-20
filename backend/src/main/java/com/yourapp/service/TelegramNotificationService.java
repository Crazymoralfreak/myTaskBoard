package com.yourapp.service;

import com.yourapp.model.User;
import com.yourapp.model.NotificationPreferences;
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
    
    private boolean shouldSendNotification(User user, NotificationType type) {
        if (user.getTelegramChatId() == null) {
            return false;
        }
        
        NotificationPreferences prefs = user.getNotificationPreferences();
        if (prefs == null || !prefs.isGlobalNotificationsEnabled()) {
            return false;
        }
        
        return switch (type) {
            case TASK_ASSIGNED -> prefs.isTaskAssignedNotifications();
            case TASK_UPDATED -> prefs.isTaskUpdatedNotifications();
            case TASK_MOVED -> prefs.isTaskMovedNotifications();
            case MENTION -> prefs.isMentionNotifications();
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
        }
    }
    
    private enum NotificationType {
        TASK_ASSIGNED,
        TASK_UPDATED,
        TASK_MOVED,
        MENTION
    }
}