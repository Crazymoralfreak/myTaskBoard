package com.yourapp.controller;

import com.yourapp.dto.NotificationDTO;
import com.yourapp.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
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
     * Получает ID текущего пользователя из контекста безопасности
     * @return ID пользователя
     */
    private Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof UserDetails) {
            UserDetails userDetails = (UserDetails) authentication.getPrincipal();
            return Long.parseLong(userDetails.getUsername());
        }
        throw new IllegalStateException("Не удалось получить ID текущего пользователя");
    }
}