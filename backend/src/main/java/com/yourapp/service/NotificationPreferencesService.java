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
        
        log.debug("Настройки уведомлений получены: globalEnabled={}", preferences.getGlobalNotificationsEnabled());
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
                log.warn("Неизвестная настройка уведомлений: {}", settingKey);
                throw new IllegalArgumentException("Неизвестная настройка: " + settingKey);
        }
    }
    
    /**
     * Создает настройки уведомлений по умолчанию для пользователя
     * @param user пользователь
     * @return настройки по умолчанию
     */
    private NotificationPreferences createDefaultPreferences(User user) {
        log.debug("Создание настроек уведомлений по умолчанию для пользователя: {}", user.getUsername());
        
        NotificationPreferences preferences = NotificationPreferences.builder()
                .user(user)
                .build();
        
        log.debug("Настройки по умолчанию созданы для пользователя: {}", user.getUsername());
        return preferences;
    }
    
    /**
     * Обновляет настройки из DTO
     * @param preferences объект настроек
     * @param dto DTO с новыми значениями
     */
    private void updatePreferencesFromDTO(NotificationPreferences preferences, NotificationPreferencesDTO dto) {
        if (dto.getGlobalNotificationsEnabled() != null) {
            preferences.setGlobalNotificationsEnabled(dto.getGlobalNotificationsEnabled());
        }
        if (dto.getEmailNotificationsEnabled() != null) {
            preferences.setEmailNotificationsEnabled(dto.getEmailNotificationsEnabled());
        }
        if (dto.getTelegramNotificationsEnabled() != null) {
            preferences.setTelegramNotificationsEnabled(dto.getTelegramNotificationsEnabled());
        }
        if (dto.getBrowserNotificationsEnabled() != null) {
            preferences.setBrowserNotificationsEnabled(dto.getBrowserNotificationsEnabled());
        }
        if (dto.getBoardInviteNotifications() != null) {
            preferences.setBoardInviteNotifications(dto.getBoardInviteNotifications());
        }
        if (dto.getTaskAssignedNotifications() != null) {
            preferences.setTaskAssignedNotifications(dto.getTaskAssignedNotifications());
        }
        if (dto.getTaskStatusChangedNotifications() != null) {
            preferences.setTaskStatusChangedNotifications(dto.getTaskStatusChangedNotifications());
        }
        if (dto.getTaskCreatedNotifications() != null) {
            preferences.setTaskCreatedNotifications(dto.getTaskCreatedNotifications());
        }
        if (dto.getTaskUpdatedNotifications() != null) {
            preferences.setTaskUpdatedNotifications(dto.getTaskUpdatedNotifications());
        }
        if (dto.getTaskDeletedNotifications() != null) {
            preferences.setTaskDeletedNotifications(dto.getTaskDeletedNotifications());
        }
        if (dto.getTaskCommentAddedNotifications() != null) {
            preferences.setTaskCommentAddedNotifications(dto.getTaskCommentAddedNotifications());
        }
        if (dto.getMentionNotifications() != null) {
            preferences.setMentionNotifications(dto.getMentionNotifications());
        }
        if (dto.getSubtaskCreatedNotifications() != null) {
            preferences.setSubtaskCreatedNotifications(dto.getSubtaskCreatedNotifications());
        }
        if (dto.getSubtaskCompletedNotifications() != null) {
            preferences.setSubtaskCompletedNotifications(dto.getSubtaskCompletedNotifications());
        }
        if (dto.getBoardMemberAddedNotifications() != null) {
            preferences.setBoardMemberAddedNotifications(dto.getBoardMemberAddedNotifications());
        }
        if (dto.getBoardMemberRemovedNotifications() != null) {
            preferences.setBoardMemberRemovedNotifications(dto.getBoardMemberRemovedNotifications());
        }
        if (dto.getAttachmentAddedNotifications() != null) {
            preferences.setAttachmentAddedNotifications(dto.getAttachmentAddedNotifications());
        }
        if (dto.getDeadlineReminderNotifications() != null) {
            preferences.setDeadlineReminderNotifications(dto.getDeadlineReminderNotifications());
        }
        if (dto.getRoleChangedNotifications() != null) {
            preferences.setRoleChangedNotifications(dto.getRoleChangedNotifications());
        }
        if (dto.getTaskDueSoonNotifications() != null) {
            preferences.setTaskDueSoonNotifications(dto.getTaskDueSoonNotifications());
        }
        if (dto.getTaskOverdueNotifications() != null) {
            preferences.setTaskOverdueNotifications(dto.getTaskOverdueNotifications());
        }
        if (dto.getOnlyHighPriorityNotifications() != null) {
            preferences.setOnlyHighPriorityNotifications(dto.getOnlyHighPriorityNotifications());
        }
        if (dto.getGroupSimilarNotifications() != null) {
            preferences.setGroupSimilarNotifications(dto.getGroupSimilarNotifications());
        }
    }
    
    /**
     * Преобразует сущность в DTO
     * @param preferences сущность настроек
     * @return DTO
     */
    private NotificationPreferencesDTO mapToDTO(NotificationPreferences preferences) {
        return NotificationPreferencesDTO.builder()
                .id(preferences.getId())
                .globalNotificationsEnabled(preferences.getGlobalNotificationsEnabled())
                .emailNotificationsEnabled(preferences.getEmailNotificationsEnabled())
                .telegramNotificationsEnabled(preferences.getTelegramNotificationsEnabled())
                .browserNotificationsEnabled(preferences.getBrowserNotificationsEnabled())
                .boardInviteNotifications(preferences.getBoardInviteNotifications())
                .taskAssignedNotifications(preferences.getTaskAssignedNotifications())
                .taskStatusChangedNotifications(preferences.getTaskStatusChangedNotifications())
                .taskCreatedNotifications(preferences.getTaskCreatedNotifications())
                .taskUpdatedNotifications(preferences.getTaskUpdatedNotifications())
                .taskDeletedNotifications(preferences.getTaskDeletedNotifications())
                .taskCommentAddedNotifications(preferences.getTaskCommentAddedNotifications())
                .mentionNotifications(preferences.getMentionNotifications())
                .subtaskCreatedNotifications(preferences.getSubtaskCreatedNotifications())
                .subtaskCompletedNotifications(preferences.getSubtaskCompletedNotifications())
                .boardMemberAddedNotifications(preferences.getBoardMemberAddedNotifications())
                .boardMemberRemovedNotifications(preferences.getBoardMemberRemovedNotifications())
                .attachmentAddedNotifications(preferences.getAttachmentAddedNotifications())
                .deadlineReminderNotifications(preferences.getDeadlineReminderNotifications())
                .roleChangedNotifications(preferences.getRoleChangedNotifications())
                .taskDueSoonNotifications(preferences.getTaskDueSoonNotifications())
                .taskOverdueNotifications(preferences.getTaskOverdueNotifications())
                .onlyHighPriorityNotifications(preferences.getOnlyHighPriorityNotifications())
                .groupSimilarNotifications(preferences.getGroupSimilarNotifications())
                .build();
    }
} 