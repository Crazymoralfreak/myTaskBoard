package com.yourapp.service;

import com.yourapp.dto.NotificationPreferencesDTO;
import com.yourapp.model.NotificationPreferences;
import com.yourapp.model.User;
import com.yourapp.repository.NotificationPreferencesRepository;
import com.yourapp.repository.UserRepository;
import com.yourapp.exception.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Сервис для работы с настройками уведомлений
 */
@Service
@RequiredArgsConstructor
@Slf4j
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
        log.debug("Получение настроек уведомлений для пользователя: {}", userId);
        
        if (userId == null) {
            log.error("ID пользователя равен null");
            throw new IllegalArgumentException("ID пользователя не может быть null");
        }
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> {
                    log.error("Пользователь с ID {} не найден", userId);
                    return new EntityNotFoundException("Пользователь с ID " + userId + " не найден");
                });
        
        log.debug("Пользователь найден: {} ({})", user.getUsername(), user.getEmail());
        
        NotificationPreferences preferences = preferencesRepository.findByUser(user)
                .orElseGet(() -> {
                    log.info("Создание настроек уведомлений по умолчанию для пользователя: {}", userId);
                    return createDefaultPreferences(user);
                });
        
        log.debug("Настройки уведомлений получены: globalEnabled={}", preferences.isGlobalNotificationsEnabled());
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
        
        // Сохраняем исходного пользователя для защиты связи
        User originalUser = preferences.getUser();
        
        // Обновляем настройки только если новые значения не null
        updatePreferencesFromDTO(preferences, preferencesDTO);
        
        // Гарантируем, что связь с пользователем не потеряна
        preferences.setUser(originalUser);
        
        NotificationPreferences savedPreferences = preferencesRepository.save(preferences);
        return mapToDTO(savedPreferences);
    }
    
    /**
     * Обновляет отдельную настройку уведомлений пользователя
     * @param userId ID пользователя
     * @param settingKey ключ настройки
     * @param value новое значение
     * @return обновленные настройки
     */
    @Transactional
    public NotificationPreferencesDTO updateUserPreferenceSetting(Long userId, String settingKey, Boolean value) {
        log.debug("Обновление настройки {} = {} для пользователя: {}", settingKey, value, userId);
        
        if (userId == null) {
            log.error("ID пользователя равен null при обновлении настройки");
            throw new IllegalArgumentException("ID пользователя не может быть null");
        }
        
        if (settingKey == null || settingKey.trim().isEmpty()) {
            log.error("Ключ настройки пуст или равен null");
            throw new IllegalArgumentException("Ключ настройки не может быть пустым");
        }
        
        if (value == null) {
            log.error("Значение настройки равно null");
            throw new IllegalArgumentException("Значение настройки не может быть null");
        }
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> {
                    log.error("Пользователь с ID {} не найден при обновлении настройки", userId);
                    return new EntityNotFoundException("Пользователь с ID " + userId + " не найден");
                });
        
        log.debug("Пользователь найден: {} ({})", user.getUsername(), user.getEmail());
        
        NotificationPreferences preferences = preferencesRepository.findByUser(user)
                .orElseGet(() -> {
                    log.info("Создание настроек уведомлений по умолчанию для пользователя: {}", userId);
                    return createDefaultPreferences(user);
                });
        
        // Обновляем только указанную настройку
        updateSinglePreference(preferences, settingKey, value);
        
        NotificationPreferences savedPreferences = preferencesRepository.save(preferences);
        log.info("Настройка {} успешно обновлена для пользователя {}", settingKey, userId);
        
        return mapToDTO(savedPreferences);
    }
    
    /**
     * Обновляет одну конкретную настройку
     * @param preferences объект настроек
     * @param settingKey ключ настройки
     * @param value новое значение
     */
    private void updateSinglePreference(NotificationPreferences preferences, String settingKey, Boolean value) {
        switch (settingKey) {
            case "globalNotificationsEnabled":
                preferences.setGlobalNotificationsEnabled(value);
                break;
            case "emailNotificationsEnabled":
                preferences.setEmailNotificationsEnabled(value);
                break;
            case "telegramNotificationsEnabled":
                preferences.setTelegramNotificationsEnabled(value);
                break;
            case "browserNotificationsEnabled":
                preferences.setBrowserNotificationsEnabled(value);
                break;
            case "boardInviteNotifications":
                preferences.setBoardInviteNotifications(value);
                break;
            case "taskAssignedNotifications":
                preferences.setTaskAssignedNotifications(value);
                break;
            case "taskStatusChangedNotifications":
                preferences.setTaskStatusChangedNotifications(value);
                break;
            case "taskCreatedNotifications":
                preferences.setTaskCreatedNotifications(value);
                break;
            case "taskUpdatedNotifications":
                preferences.setTaskUpdatedNotifications(value);
                break;
            case "taskDeletedNotifications":
                preferences.setTaskDeletedNotifications(value);
                break;
            case "taskCommentAddedNotifications":
                preferences.setTaskCommentAddedNotifications(value);
                break;
            case "mentionNotifications":
                preferences.setMentionNotifications(value);
                break;
            case "subtaskCreatedNotifications":
                preferences.setSubtaskCreatedNotifications(value);
                break;
            case "subtaskCompletedNotifications":
                preferences.setSubtaskCompletedNotifications(value);
                break;
            case "boardMemberAddedNotifications":
                preferences.setBoardMemberAddedNotifications(value);
                break;
            case "boardMemberRemovedNotifications":
                preferences.setBoardMemberRemovedNotifications(value);
                break;
            case "attachmentAddedNotifications":
                preferences.setAttachmentAddedNotifications(value);
                break;
            case "deadlineReminderNotifications":
                preferences.setDeadlineReminderNotifications(value);
                break;
            case "roleChangedNotifications":
                preferences.setRoleChangedNotifications(value);
                break;
            case "taskDueSoonNotifications":
                preferences.setTaskDueSoonNotifications(value);
                break;
            case "taskOverdueNotifications":
                preferences.setTaskOverdueNotifications(value);
                break;
            case "onlyHighPriorityNotifications":
                preferences.setOnlyHighPriorityNotifications(value);
                break;
            case "groupSimilarNotifications":
                preferences.setGroupSimilarNotifications(value);
                break;
            default:
                throw new IllegalArgumentException("Неизвестная настройка: " + settingKey);
        }
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
                .emailNotificationsEnabled(false)
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