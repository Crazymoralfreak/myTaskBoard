package com.yourapp.service;

import com.yourapp.model.Notification;
import com.yourapp.model.User;
import com.yourapp.model.NotificationType;
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

import java.util.List;
import java.util.stream.Collectors;

/**
 * Сервис для работы с уведомлениями
 */
@Service
@RequiredArgsConstructor
public class NotificationService {
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
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("Пользователь с ID " + userId + " не найден"));
        
        Notification notification = Notification.builder()
                .user(user)
                .type(type.name())
                .title(title)
                .message(message)
                .relatedEntityId(relatedEntityId)
                .relatedEntityType(relatedEntityType)
                .isRead(false)
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
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("Пользователь с ID " + userId + " не найден"));
        
        return notificationRepository.findByUserOrderByCreatedAtDesc(user, pageable)
                .map(this::mapToDTO);
    }
    
    /**
     * Получает непрочитанные уведомления пользователя
     * @param userId ID пользователя
     * @return список непрочитанных уведомлений
     */
    @Transactional(readOnly = true)
    public List<NotificationDTO> getUnreadNotifications(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("Пользователь с ID " + userId + " не найден"));
        
        return notificationRepository.findByUserAndIsReadFalseOrderByCreatedAtDesc(user)
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
        return mapToDTO(notificationRepository.save(notification));
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
        
        return notificationRepository.markAllAsRead(user);
    }
    
    /**
     * Получает количество непрочитанных уведомлений пользователя
     * @param userId ID пользователя
     * @return количество непрочитанных уведомлений
     */
    @Transactional(readOnly = true)
    public long getUnreadCount(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("Пользователь с ID " + userId + " не найден"));
        
        return notificationRepository.countByUserAndIsReadFalse(user);
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
                .relatedEntityId(notification.getRelatedEntityId())
                .relatedEntityType(notification.getRelatedEntityType())
                .isRead(notification.isRead())
                .createdAt(notification.getCreatedAt())
                .build();
    }
}