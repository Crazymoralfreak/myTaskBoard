package com.yourapp.service;

import com.yourapp.dto.NotificationPreferencesDTO;
import com.yourapp.model.NotificationPreferences;
import com.yourapp.model.User;
import com.yourapp.repository.NotificationPreferencesRepository;
import com.yourapp.repository.UserRepository;
import com.yourapp.exception.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Сервис для работы с настройками уведомлений
 */
@Service
@RequiredArgsConstructor
public class NotificationPreferencesService {
    private final NotificationPreferencesRepository preferencesRepository;
    private final UserRepository userRepository;
    
    /**
     * Получает настройки уведомлений пользователя
     * @param userId ID пользователя
     * @return настройки уведомлений
     */
    @Transactional(readOnly = true)
    public NotificationPreferencesDTO getUserPreferences(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("Пользователь с ID " + userId + " не найден"));
        
        NotificationPreferences preferences = preferencesRepository.findByUser(user)
                .orElseGet(() -> createDefaultPreferences(user));
        
        return mapToDTO(preferences);
    }
    
    /**
     * Обновляет настройки уведомлений пользователя
     * @param userId ID пользователя
     * @param preferencesDTO новые настройки
     * @return обновленные настройки
     */
    @Transactional
    public NotificationPreferencesDTO updateUserPreferences(Long userId, NotificationPreferencesDTO preferencesDTO) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("Пользователь с ID " + userId + " не найден"));
        
        NotificationPreferences preferences = preferencesRepository.findByUser(user)
                .orElseGet(() -> createDefaultPreferences(user));
        
        // Обновляем настройки
        updatePreferencesFromDTO(preferences, preferencesDTO);
        
        NotificationPreferences savedPreferences = preferencesRepository.save(preferences);
        return mapToDTO(savedPreferences);
    }
    
    /**
     * Создает настройки по умолчанию для пользователя
     * @param user пользователь
     * @return настройки по умолчанию
     */
    private NotificationPreferences createDefaultPreferences(User user) {
        return NotificationPreferences.builder()
                .user(user)
                .globalNotificationsEnabled(true)
                .emailNotificationsEnabled(true)
                .telegramNotificationsEnabled(false)
                .browserNotificationsEnabled(true)
                .boardInviteNotifications(true)
                .taskAssignedNotifications(true)
                .taskStatusChangedNotifications(true)
                .taskCreatedNotifications(false)
                .taskUpdatedNotifications(false)
                .taskDeletedNotifications(true)
                .taskCommentAddedNotifications(true)
                .mentionNotifications(true)
                .subtaskCreatedNotifications(false)
                .subtaskCompletedNotifications(true)
                .boardMemberAddedNotifications(true)
                .boardMemberRemovedNotifications(true)
                .attachmentAddedNotifications(false)
                .deadlineReminderNotifications(true)
                .roleChangedNotifications(true)
                .taskDueSoonNotifications(true)
                .taskOverdueNotifications(true)
                .onlyHighPriorityNotifications(false)
                .groupSimilarNotifications(true)
                .build();
    }
    
    /**
     * Обновляет объект настроек из DTO
     * @param preferences объект настроек
     * @param dto DTO с новыми настройками
     */
    private void updatePreferencesFromDTO(NotificationPreferences preferences, NotificationPreferencesDTO dto) {
        preferences.setGlobalNotificationsEnabled(dto.isGlobalNotificationsEnabled());
        preferences.setEmailNotificationsEnabled(dto.isEmailNotificationsEnabled());
        preferences.setTelegramNotificationsEnabled(dto.isTelegramNotificationsEnabled());
        preferences.setBrowserNotificationsEnabled(dto.isBrowserNotificationsEnabled());
        
        preferences.setBoardInviteNotifications(dto.isBoardInviteNotifications());
        preferences.setTaskAssignedNotifications(dto.isTaskAssignedNotifications());
        preferences.setTaskStatusChangedNotifications(dto.isTaskStatusChangedNotifications());
        preferences.setTaskCreatedNotifications(dto.isTaskCreatedNotifications());
        preferences.setTaskUpdatedNotifications(dto.isTaskUpdatedNotifications());
        preferences.setTaskDeletedNotifications(dto.isTaskDeletedNotifications());
        preferences.setTaskCommentAddedNotifications(dto.isTaskCommentAddedNotifications());
        preferences.setMentionNotifications(dto.isMentionNotifications());
        preferences.setSubtaskCreatedNotifications(dto.isSubtaskCreatedNotifications());
        preferences.setSubtaskCompletedNotifications(dto.isSubtaskCompletedNotifications());
        preferences.setBoardMemberAddedNotifications(dto.isBoardMemberAddedNotifications());
        preferences.setBoardMemberRemovedNotifications(dto.isBoardMemberRemovedNotifications());
        preferences.setAttachmentAddedNotifications(dto.isAttachmentAddedNotifications());
        preferences.setDeadlineReminderNotifications(dto.isDeadlineReminderNotifications());
        preferences.setRoleChangedNotifications(dto.isRoleChangedNotifications());
        preferences.setTaskDueSoonNotifications(dto.isTaskDueSoonNotifications());
        preferences.setTaskOverdueNotifications(dto.isTaskOverdueNotifications());
        
        preferences.setOnlyHighPriorityNotifications(dto.isOnlyHighPriorityNotifications());
        preferences.setGroupSimilarNotifications(dto.isGroupSimilarNotifications());
    }
    
    /**
     * Преобразует объект настроек в DTO
     * @param preferences объект настроек
     * @return DTO настроек
     */
    private NotificationPreferencesDTO mapToDTO(NotificationPreferences preferences) {
        return NotificationPreferencesDTO.builder()
                .id(preferences.getId())
                .globalNotificationsEnabled(preferences.isGlobalNotificationsEnabled())
                .emailNotificationsEnabled(preferences.isEmailNotificationsEnabled())
                .telegramNotificationsEnabled(preferences.isTelegramNotificationsEnabled())
                .browserNotificationsEnabled(preferences.isBrowserNotificationsEnabled())
                
                .boardInviteNotifications(preferences.isBoardInviteNotifications())
                .taskAssignedNotifications(preferences.isTaskAssignedNotifications())
                .taskStatusChangedNotifications(preferences.isTaskStatusChangedNotifications())
                .taskCreatedNotifications(preferences.isTaskCreatedNotifications())
                .taskUpdatedNotifications(preferences.isTaskUpdatedNotifications())
                .taskDeletedNotifications(preferences.isTaskDeletedNotifications())
                .taskCommentAddedNotifications(preferences.isTaskCommentAddedNotifications())
                .mentionNotifications(preferences.isMentionNotifications())
                .subtaskCreatedNotifications(preferences.isSubtaskCreatedNotifications())
                .subtaskCompletedNotifications(preferences.isSubtaskCompletedNotifications())
                .boardMemberAddedNotifications(preferences.isBoardMemberAddedNotifications())
                .boardMemberRemovedNotifications(preferences.isBoardMemberRemovedNotifications())
                .attachmentAddedNotifications(preferences.isAttachmentAddedNotifications())
                .deadlineReminderNotifications(preferences.isDeadlineReminderNotifications())
                .roleChangedNotifications(preferences.isRoleChangedNotifications())
                .taskDueSoonNotifications(preferences.isTaskDueSoonNotifications())
                .taskOverdueNotifications(preferences.isTaskOverdueNotifications())
                
                .onlyHighPriorityNotifications(preferences.isOnlyHighPriorityNotifications())
                .groupSimilarNotifications(preferences.isGroupSimilarNotifications())
                .build();
    }
} 