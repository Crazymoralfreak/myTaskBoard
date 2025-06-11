package com.yourapp.service;

import com.yourapp.model.Notification;
import com.yourapp.model.User;
import com.yourapp.model.NotificationType;
import com.yourapp.model.NotificationPriority;
import com.yourapp.dto.NotificationDTO;
import com.yourapp.repository.NotificationRepository;
import com.yourapp.repository.UserRepository;
import com.yourapp.exception.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Сервис для работы с уведомлениями
 */
@Service
@RequiredArgsConstructor
public class NotificationService {
    private static final Logger logger = LoggerFactory.getLogger(NotificationService.class);
    
    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final NotificationPreferencesService preferencesService;
    private final TelegramNotificationService telegramNotificationService;
    
    /**
     * Создает уведомление и отправляет его пользователю
     * @param userId ID пользователя
     * @param type тип уведомления
     * @param title заголовок
     * @param message сообщение
     * @param relatedEntityId ID связанной сущности
     * @param relatedEntityType тип связанной сущности
     * @return созданное уведомление или null, если уведомление не должно быть отправлено
     */
    @Transactional
    public NotificationDTO createNotification(
            Long userId, 
            NotificationType type, 
            String title, 
            String message, 
            String relatedEntityId, 
            String relatedEntityType) {
        
        return createNotification(userId, type, title, message, relatedEntityId, relatedEntityType, 
                                null, getPriorityForType(type));
    }
    
    /**
     * Создает уведомление с приоритетом и группировкой
     * @param userId ID пользователя
     * @param type тип уведомления
     * @param title заголовок
     * @param message сообщение
     * @param relatedEntityId ID связанной сущности
     * @param relatedEntityType тип связанной сущности
     * @param groupKey ключ группировки
     * @param priority приоритет
     * @return созданное уведомление или null, если уведомление не должно быть отправлено
     */
    @Transactional
    public NotificationDTO createNotification(
            Long userId, 
            NotificationType type, 
            String title, 
            String message, 
            String relatedEntityId, 
            String relatedEntityType,
            String groupKey,
            NotificationPriority priority) {
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("Пользователь с ID " + userId + " не найден"));
        
        // Проверяем настройки пользователя перед созданием уведомления
        if (!shouldCreateNotification(user, type, priority)) {
            logger.debug("Уведомление типа {} не будет создано для пользователя {} из-за настроек", 
                    type, user.getUsername());
            return null;
        }
        
        Notification notification = Notification.builder()
                .user(user)
                .type(type.name())
                .title(title)
                .message(message)
                .relatedEntityId(relatedEntityId)
                .relatedEntityType(relatedEntityType)
                .groupKey(groupKey)
                .priority(priority)
                .isRead(false)
                .isArchived(false)
                .build();
        
        Notification savedNotification = notificationRepository.save(notification);
        logger.info("Создано уведомление {} для пользователя {}", savedNotification.getId(), user.getUsername());
        
        // Преобразуем в DTO
        NotificationDTO notificationDTO = mapToDTO(savedNotification);
        
        // Отправляем уведомление через WebSocket (только браузерные уведомления)
        if (shouldSendBrowserNotification(user, type, priority)) {
            messagingTemplate.convertAndSendToUser(
                    user.getUsername(),
                    "/queue/notifications",
                    notificationDTO
            );
            logger.debug("Отправлено браузерное уведомление для пользователя {}", user.getUsername());
        }
        
        // Отправляем Telegram уведомления если нужно
        sendTelegramNotificationIfEnabled(user, type, title, message);
        
        // Отправляем обновление счетчика через WebSocket
        long newUnreadCount = getUnreadCount(userId);
        messagingTemplate.convertAndSendToUser(
                user.getUsername(),
                "/queue/unread-count",
                Map.of("count", newUnreadCount)
        );
        logger.info("Отправлен счетчик {} через WebSocket пользователю {}", newUnreadCount, user.getUsername());
        
        return notificationDTO;
    }
    
    /**
     * Отправляет Telegram уведомление если это разрешено настройками пользователя
     * @param user пользователь
     * @param type тип уведомления
     * @param title заголовок уведомления
     * @param message сообщение уведомления
     */
    private void sendTelegramNotificationIfEnabled(User user, NotificationType type, String title, String message) {
        try {
            var preferences = preferencesService.getUserPreferences(user.getId());
            
            // Проверяем общие настройки Telegram
            if (!preferences.isGlobalNotificationsEnabled() || !preferences.isTelegramNotificationsEnabled()) {
                return;
            }
            
            // Проверяем настройки конкретного типа
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
                return;
            }
            
            // Отправляем через TelegramNotificationService
            String telegramMessage = String.format("📢 %s\n\n%s", title, message);
            telegramNotificationService.sendNotification(user, telegramMessage);
            
        } catch (Exception e) {
            logger.error("Ошибка отправки Telegram уведомления пользователю {}: {}", user.getUsername(), e.getMessage());
        }
    }
    
    /**
     * Проверяет, должно ли быть создано уведомление для пользователя
     * @param user пользователь
     * @param type тип уведомления
     * @param priority приоритет уведомления
     * @return true, если уведомление должно быть создано
     */
    private boolean shouldCreateNotification(User user, NotificationType type, NotificationPriority priority) {
        var preferences = preferencesService.getUserPreferences(user.getId());
        
        // Проверяем глобальные настройки
        if (!preferences.isGlobalNotificationsEnabled()) {
            return false;
        }
        
        // Проверяем настройки приоритета
        if (preferences.isOnlyHighPriorityNotifications() && 
            (priority == null || priority != NotificationPriority.HIGH)) {
            return false;
        }
        
        // Проверяем настройки по типам уведомлений
        return switch (type) {
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
            default -> true; // По умолчанию разрешаем неизвестные типы
        };
    }
    
    /**
     * Проверяет, должно ли быть отправлено браузерное уведомление пользователю
     * @param user пользователь
     * @param type тип уведомления
     * @param priority приоритет уведомления
     * @return true, если браузерное уведомление должно быть отправлено
     */
    private boolean shouldSendBrowserNotification(User user, NotificationType type, NotificationPriority priority) {
        var preferences = preferencesService.getUserPreferences(user.getId());
        
        // Проверяем глобальные настройки и настройки браузерных уведомлений
        if (!preferences.isGlobalNotificationsEnabled() || !preferences.isBrowserNotificationsEnabled()) {
            return false;
        }
        
        // Проверяем настройки приоритета
        if (preferences.isOnlyHighPriorityNotifications() && 
            (priority == null || priority != NotificationPriority.HIGH)) {
            return false;
        }
        
        // Браузерные уведомления отправляются для тех же типов, что и создаются
        return shouldCreateNotification(user, type, priority);
    }
    
    /**
     * Получает все уведомления пользователя
     * @param userId ID пользователя
     * @param pageable пагинация
     * @return страница уведомлений
     */
    @Transactional(readOnly = true)
    public Page<NotificationDTO> getUserNotifications(Long userId, Pageable pageable) {
        if (userId == null) {
            return Page.empty(pageable);
        }
        
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            return Page.empty(pageable);
        }
        
        return notificationRepository.findByUserAndIsArchivedFalseOrderByCreatedAtDesc(user, pageable)
                .map(this::mapToDTO);
    }
    
    /**
     * Получает непрочитанные уведомления пользователя
     * @param userId ID пользователя
     * @return список непрочитанных уведомлений
     */
    @Transactional(readOnly = true)
    public List<NotificationDTO> getUnreadNotifications(Long userId) {
        if (userId == null) {
            return Collections.emptyList();
        }
        
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            return Collections.emptyList();
        }
        
        return notificationRepository.findByUserAndIsReadFalseAndIsArchivedFalseOrderByPriorityDescCreatedAtDesc(user)
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }
    
    /**
     * Отмечает уведомление как прочитанное
     * @param notificationId ID уведомления
     * @param userId ID пользователя
     * @return обновленное уведомление
     */
    @Transactional
    public NotificationDTO markAsRead(Long notificationId, Long userId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new EntityNotFoundException("Уведомление с ID " + notificationId + " не найдено"));
        
        // Проверяем, что уведомление принадлежит этому пользователю
        if (!notification.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("Уведомление не принадлежит пользователю");
        }
        
        notification.setRead(true);
        notification.setReadAt(java.time.LocalDateTime.now());
        
        Notification savedNotification = notificationRepository.save(notification);
        logger.debug("Уведомление {} помечено как прочитанное. isRead: {}, readAt: {}", 
            savedNotification.getId(), savedNotification.isRead(), savedNotification.getReadAt());
        
        NotificationDTO notificationDTO = mapToDTO(savedNotification);
        
        // Отправляем обновление счетчика через WebSocket
        long newUnreadCount = getUnreadCount(userId);
        messagingTemplate.convertAndSendToUser(
                notification.getUser().getUsername(),
                "/queue/unread-count",
                Map.of("count", newUnreadCount)
        );
        
        return notificationDTO;
    }
    
    /**
     * Отмечает все уведомления пользователя как прочитанные
     * @param userId ID пользователя
     * @return количество обновленных уведомлений
     */
    @Transactional
    public int markAllAsRead(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("Пользователь с ID " + userId + " не найден"));
        
        int count = notificationRepository.markAllAsRead(user);
        logger.debug("Помечено как прочитанные {} уведомлений для пользователя {}", count, user.getUsername());
        
        // Отправляем обновление счетчика через WebSocket
        if (count > 0) {
            long newUnreadCount = getUnreadCount(userId);
            messagingTemplate.convertAndSendToUser(
                    user.getUsername(),
                    "/queue/unread-count",
                    Map.of("count", newUnreadCount)
            );
        }
        
        return count;
    }
    
    /**
     * Архивирует уведомление
     * @param notificationId ID уведомления
     * @param userId ID пользователя
     * @return обновленное уведомление
     */
    @Transactional
    public NotificationDTO archiveNotification(Long notificationId, Long userId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new EntityNotFoundException("Уведомление с ID " + notificationId + " не найдено"));
        
        // Проверяем, что уведомление принадлежит этому пользователю
        if (!notification.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("Уведомление не принадлежит пользователю");
        }
        
        notification.setArchived(true);
        notification.setRead(true); // Архивированные уведомления автоматически считаются прочитанными
        return mapToDTO(notificationRepository.save(notification));
    }
    
    /**
     * Получает количество непрочитанных уведомлений пользователя
     * @param userId ID пользователя
     * @return количество непрочитанных уведомлений
     */
    @Transactional(readOnly = true)
    public long getUnreadCount(Long userId) {
        if (userId == null) {
            return 0;
        }
        
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            return 0;
        }
        
        return notificationRepository.countByUserAndIsReadFalseAndIsArchivedFalse(user);
    }
    
    /**
     * Получает архивированные уведомления пользователя
     * @param userId ID пользователя
     * @param pageable пагинация
     * @return страница архивированных уведомлений
     */
    @Transactional(readOnly = true)
    public Page<NotificationDTO> getArchivedNotifications(Long userId, Pageable pageable) {
        if (userId == null) {
            return Page.empty(pageable);
        }
        
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            return Page.empty(pageable);
        }
        
        return notificationRepository.findByUserAndIsArchivedTrueOrderByCreatedAtDesc(user, pageable)
                .map(this::mapToDTO);
    }
    
    /**
     * Определяет приоритет для типа уведомления
     * @param type тип уведомления
     * @return приоритет
     */
    private NotificationPriority getPriorityForType(NotificationType type) {
        switch (type) {
            case TASK_OVERDUE:
            case NEW_COMMENT_MENTION:
                return NotificationPriority.CRITICAL;
            case BOARD_INVITE:
            case TASK_ASSIGNED:
            case TASK_DUE_SOON:
            case ROLE_CHANGED:
                return NotificationPriority.HIGH;
            case TASK_CREATED:
            case TASK_COMMENT_ADDED:
            case SUBTASK_COMPLETED:
            case BOARD_MEMBER_ADDED:
            case BOARD_MEMBER_REMOVED:
            case DEADLINE_REMINDER:
                return NotificationPriority.NORMAL;
            case TASK_UPDATED:
            case TASK_STATUS_CHANGED:
            case SUBTASK_CREATED:
            case ATTACHMENT_ADDED:
                return NotificationPriority.LOW;
            default:
                return NotificationPriority.NORMAL;
        }
    }
    
    /**
     * Преобразует модель Notification в DTO
     * @param notification модель уведомления
     * @return DTO уведомления
     */
    private NotificationDTO mapToDTO(Notification notification) {
        return NotificationDTO.builder()
                .id(notification.getId())
                .title(notification.getTitle())
                .message(notification.getMessage())
                .type(notification.getType())
                .priority(notification.getPriority())
                .relatedEntityId(notification.getRelatedEntityId())
                .relatedEntityType(notification.getRelatedEntityType())
                .groupKey(notification.getGroupKey())
                .isRead(notification.isRead())
                .isArchived(notification.isArchived())
                .createdAt(notification.getCreatedAt())
                .updatedAt(notification.getUpdatedAt())
                .readAt(notification.getReadAt())
                .build();
    }
    
    /**
     * Удаляет уведомление
     * @param notificationId ID уведомления
     * @param userId ID пользователя
     */
    @Transactional
    public void deleteNotification(Long notificationId, Long userId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new EntityNotFoundException("Уведомление с ID " + notificationId + " не найдено"));
        
        // Проверяем, что уведомление принадлежит этому пользователю
        if (!notification.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("Уведомление не принадлежит пользователю");
        }
        
        notificationRepository.delete(notification);
        
        // Отправляем обновление счетчика через WebSocket
        long newUnreadCount = getUnreadCount(userId);
        messagingTemplate.convertAndSendToUser(
                notification.getUser().getUsername(),
                "/queue/unread-count",
                Map.of("count", newUnreadCount)
        );
    }
    
    /**
     * Удаляет несколько уведомлений
     * @param notificationIds список ID уведомлений
     * @param userId ID пользователя
     */
    @Transactional
    public void deleteNotifications(List<Long> notificationIds, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("Пользователь с ID " + userId + " не найден"));
        
        List<Notification> notifications = notificationRepository.findByIdInAndUser(notificationIds, user);
        
        if (notifications.size() != notificationIds.size()) {
            throw new IllegalArgumentException("Некоторые уведомления не найдены или не принадлежат пользователю");
        }
        
        notificationRepository.deleteAll(notifications);
        
        // Отправляем обновление счетчика через WebSocket
        long newUnreadCount = getUnreadCount(userId);
        messagingTemplate.convertAndSendToUser(
                user.getUsername(),
                "/queue/unread-count",
                Map.of("count", newUnreadCount)
        );
    }
    
    /**
     * Отмечает несколько уведомлений как прочитанные
     * @param notificationIds список ID уведомлений
     * @param userId ID пользователя
     */
    @Transactional
    public void markMultipleAsRead(List<Long> notificationIds, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("Пользователь с ID " + userId + " не найден"));
        
        List<Notification> notifications = notificationRepository.findByIdInAndUserAndIsReadFalse(notificationIds, user);
        
        if (!notifications.isEmpty()) {
            for (Notification notification : notifications) {
                notification.setRead(true);
                notification.setReadAt(java.time.LocalDateTime.now());
            }
            notificationRepository.saveAll(notifications);
            
            // Отправляем обновление счетчика через WebSocket
            long newUnreadCount = getUnreadCount(userId);
            messagingTemplate.convertAndSendToUser(
                    user.getUsername(),
                    "/queue/unread-count",
                    Map.of("count", newUnreadCount)
            );
        }
    }
}