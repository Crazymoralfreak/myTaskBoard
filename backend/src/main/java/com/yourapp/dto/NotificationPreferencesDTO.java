package com.yourapp.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO для передачи настроек уведомлений пользователя
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationPreferencesDTO {
    private Long id;
    
    // Глобальные настройки
    private boolean globalNotificationsEnabled;
    private boolean emailNotificationsEnabled;
    private boolean telegramNotificationsEnabled;
    private boolean browserNotificationsEnabled;
    
    // Настройки по типам уведомлений
    private boolean boardInviteNotifications;
    private boolean taskAssignedNotifications;
    private boolean taskStatusChangedNotifications;
    private boolean taskCreatedNotifications;
    private boolean taskUpdatedNotifications;
    private boolean taskDeletedNotifications;
    private boolean taskCommentAddedNotifications;
    private boolean mentionNotifications;
    private boolean subtaskCreatedNotifications;
    private boolean subtaskCompletedNotifications;
    private boolean boardMemberAddedNotifications;
    private boolean boardMemberRemovedNotifications;
    private boolean attachmentAddedNotifications;
    private boolean deadlineReminderNotifications;
    private boolean roleChangedNotifications;
    private boolean taskDueSoonNotifications;
    private boolean taskOverdueNotifications;
    
    // Настройки приоритетов
    private boolean onlyHighPriorityNotifications;
    private boolean groupSimilarNotifications;
} 