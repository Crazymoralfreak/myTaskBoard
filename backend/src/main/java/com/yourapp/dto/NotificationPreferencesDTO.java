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
    private Boolean globalNotificationsEnabled;
    private Boolean emailNotificationsEnabled;
    private Boolean telegramNotificationsEnabled;
    private Boolean browserNotificationsEnabled;
    
    // Настройки по типам уведомлений
    private Boolean boardInviteNotifications;
    private Boolean taskAssignedNotifications;
    private Boolean taskStatusChangedNotifications;
    private Boolean taskCreatedNotifications;
    private Boolean taskUpdatedNotifications;
    private Boolean taskDeletedNotifications;
    private Boolean taskCommentAddedNotifications;
    private Boolean mentionNotifications;
    private Boolean subtaskCreatedNotifications;
    private Boolean subtaskCompletedNotifications;
    private Boolean boardMemberAddedNotifications;
    private Boolean boardMemberRemovedNotifications;
    private Boolean attachmentAddedNotifications;
    private Boolean deadlineReminderNotifications;
    private Boolean roleChangedNotifications;
    private Boolean taskDueSoonNotifications;
    private Boolean taskOverdueNotifications;
    
    // Настройки приоритетов
    private Boolean onlyHighPriorityNotifications;
    private Boolean groupSimilarNotifications;
} 