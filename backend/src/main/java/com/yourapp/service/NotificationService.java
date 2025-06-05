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
    
    /**
     * Создает уведомление и отправляет его пользователю
     * @param userId ID пользователя
     * @param type тип уведомления
     * @param title заголовок
     * @param message сообщение
     * @param relatedEntityId ID связанной сущности
     * @param relatedEntityType тип связанной сущности
     * @return созданное уведомление
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
     * @return созданное уведомление
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
        
        // Преобразуем в DTO
        NotificationDTO notificationDTO = mapToDTO(savedNotification);
        
        // Отправляем уведомление через WebSocket
        messagingTemplate.convertAndSendToUser(
                user.getUsername(),
                "/queue/notifications",
                notificationDTO
        );
        
        return notificationDTO;
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