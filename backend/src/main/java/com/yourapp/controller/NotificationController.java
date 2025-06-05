package com.yourapp.controller;

import com.yourapp.dto.NotificationDTO;
import com.yourapp.dto.NotificationPreferencesDTO;
import com.yourapp.model.User;
import com.yourapp.service.NotificationService;
import com.yourapp.service.NotificationPreferencesService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Контроллер для работы с уведомлениями
 */
@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {
    private final NotificationService notificationService;
    private final NotificationPreferencesService preferencesService;
    
    /**
     * Получает уведомления текущего пользователя
     * @param pageable пагинация
     * @return страница уведомлений
     */
    @GetMapping
    public ResponseEntity<Page<NotificationDTO>> getUserNotifications(
            @PageableDefault(size = 20, sort = "createdAt") Pageable pageable) {
        
        Long userId = getCurrentUserId();
        return ResponseEntity.ok(notificationService.getUserNotifications(userId, pageable));
    }
    
    /**
     * Получает архивированные уведомления текущего пользователя
     * @param pageable пагинация
     * @return страница архивированных уведомлений
     */
    @GetMapping("/archived")
    public ResponseEntity<Page<NotificationDTO>> getArchivedNotifications(
            @PageableDefault(size = 20, sort = "createdAt") Pageable pageable) {
        
        Long userId = getCurrentUserId();
        return ResponseEntity.ok(notificationService.getArchivedNotifications(userId, pageable));
    }
    
    /**
     * Получает непрочитанные уведомления текущего пользователя
     * @return список непрочитанных уведомлений
     */
    @GetMapping("/unread")
    public ResponseEntity<List<NotificationDTO>> getUnreadNotifications() {
        Long userId = getCurrentUserId();
        return ResponseEntity.ok(notificationService.getUnreadNotifications(userId));
    }
    
    /**
     * Получает количество непрочитанных уведомлений текущего пользователя
     * @return количество непрочитанных уведомлений
     */
    @GetMapping("/unread/count")
    public ResponseEntity<Map<String, Long>> getUnreadCount() {
        Long userId = getCurrentUserId();
        long count = notificationService.getUnreadCount(userId);
        return ResponseEntity.ok(Map.of("count", count));
    }
    
    /**
     * Отмечает уведомление как прочитанное
     * @param notificationId ID уведомления
     * @return обновленное уведомление
     */
    @PutMapping("/{notificationId}/read")
    public ResponseEntity<NotificationDTO> markAsRead(@PathVariable Long notificationId) {
        Long userId = getCurrentUserId();
        return ResponseEntity.ok(notificationService.markAsRead(notificationId, userId));
    }
    
    /**
     * Архивирует уведомление
     * @param notificationId ID уведомления
     * @return обновленное уведомление
     */
    @PutMapping("/{notificationId}/archive")
    public ResponseEntity<NotificationDTO> archiveNotification(@PathVariable Long notificationId) {
        Long userId = getCurrentUserId();
        return ResponseEntity.ok(notificationService.archiveNotification(notificationId, userId));
    }
    
    /**
     * Отмечает все уведомления как прочитанные
     * @return количество обновленных уведомлений
     */
    @PutMapping("/read-all")
    public ResponseEntity<Map<String, Integer>> markAllAsRead() {
        Long userId = getCurrentUserId();
        int count = notificationService.markAllAsRead(userId);
        return ResponseEntity.ok(Map.of("updatedCount", count));
    }
    
    /**
     * Получает настройки уведомлений текущего пользователя
     * @return настройки уведомлений
     */
    @GetMapping("/preferences")
    public ResponseEntity<NotificationPreferencesDTO> getNotificationPreferences() {
        Long userId = getCurrentUserId();
        return ResponseEntity.ok(preferencesService.getUserPreferences(userId));
    }
    
    /**
     * Обновляет настройки уведомлений текущего пользователя
     * @param preferences новые настройки
     * @return обновленные настройки
     */
    @PutMapping("/preferences")
    public ResponseEntity<NotificationPreferencesDTO> updateNotificationPreferences(
            @RequestBody NotificationPreferencesDTO preferences) {
        Long userId = getCurrentUserId();
        return ResponseEntity.ok(preferencesService.updateUserPreferences(userId, preferences));
    }
    
    /**
     * Удаляет уведомление
     * @param notificationId ID уведомления
     * @return подтверждение удаления
     */
    @DeleteMapping("/{notificationId}")
    public ResponseEntity<Void> deleteNotification(@PathVariable Long notificationId) {
        Long userId = getCurrentUserId();
        notificationService.deleteNotification(notificationId, userId);
        return ResponseEntity.ok().build();
    }
    
    /**
     * Удаляет несколько уведомлений
     * @param request запрос с ID уведомлений
     * @return подтверждение удаления
     */
    @DeleteMapping("/bulk")
    public ResponseEntity<Void> deleteNotifications(@RequestBody Map<String, List<Long>> request) {
        Long userId = getCurrentUserId();
        List<Long> notificationIds = request.get("ids");
        notificationService.deleteNotifications(notificationIds, userId);
        return ResponseEntity.ok().build();
    }
    
    /**
     * Отмечает несколько уведомлений как прочитанные
     * @param request запрос с ID уведомлений
     * @return подтверждение операции
     */
    @PutMapping("/bulk/read")
    public ResponseEntity<Void> markMultipleAsRead(@RequestBody Map<String, List<Long>> request) {
        Long userId = getCurrentUserId();
        List<Long> notificationIds = request.get("ids");
        notificationService.markMultipleAsRead(notificationIds, userId);
        return ResponseEntity.ok().build();
    }
    
    /**
     * Получает ID текущего пользователя из контекста безопасности
     * @return ID пользователя
     */
    private Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof User) {
            User user = (User) authentication.getPrincipal();
            return user.getId();
        }
        throw new IllegalStateException("Не удалось получить ID текущего пользователя");
    }
}