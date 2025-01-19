package com.yourapp.service;

import com.yourapp.model.Task;
import com.yourapp.model.User;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.telegram.telegrambots.bots.TelegramLongPollingBot;
import org.telegram.telegrambots.meta.api.methods.send.SendMessage;
import org.telegram.telegrambots.meta.api.objects.Update;
import org.telegram.telegrambots.meta.exceptions.TelegramApiException;

@Service
public class TelegramNotificationService extends TelegramLongPollingBot {
    @Value("${telegram.bot.token}")
    private String botToken;

    @Value("${telegram.bot.username}")
    private String botUsername;

    @Override
    public String getBotUsername() {
        return botUsername;
    }

    @Override
    public String getBotToken() {
        return botToken;
    }

    @Override
    public void onUpdateReceived(Update update) {
        // Handle incoming messages if needed
    }

    public void sendTaskNotification(User user, Task task, String message, NotificationType type) {
        if (shouldSendNotification(user, type)) {
            SendMessage sendMessage = new SendMessage();
            sendMessage.setChatId(user.getTelegramChatId().toString());
            sendMessage.setText(message);
            
            try {
                execute(sendMessage);
            } catch (TelegramApiException e) {
                // Handle exception or log error
            }
        }
    }

    private boolean shouldSendNotification(User user, NotificationType type) {
        if (user.getTelegramChatId() == null) return false;
        
        NotificationPreferences preferences = user.getNotificationPreferences();
        if (!preferences.isGlobalNotificationsEnabled()) return false;

        return switch (type) {
            case TASK_ASSIGNED -> preferences.isTaskAssignedNotifications();
            case TASK_UPDATED -> preferences.isTaskUpdatedNotifications();
            case TASK_MOVED -> preferences.isTaskMovedNotifications();
            case MENTION -> preferences.isMentionNotifications();
        };
    }

    public enum NotificationType {
        TASK_ASSIGNED,
        TASK_UPDATED,
        TASK_MOVED,
        MENTION
    }
}