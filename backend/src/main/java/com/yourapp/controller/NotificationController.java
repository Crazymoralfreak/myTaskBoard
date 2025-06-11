package com.yourapp.controller;

import com.yourapp.dto.NotificationDTO;
import com.yourapp.dto.NotificationPreferencesDTO;
import com.yourapp.model.User;
import com.yourapp.service.NotificationService;
import com.yourapp.service.NotificationPreferencesService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Контроллер для работы с уведомлениями
 */
@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@Slf4j
public class NotificationController {
    private final NotificationService notificationService;
    private final NotificationPreferencesService preferencesService;
    
    /**
     * Получает уведомления текущего пользователя
     * @param user текущий пользователь
     * @param pageable пагинация
     * @return страница уведомлений
     */
    @GetMapping
    public ResponseEntity<Page<NotificationDTO>> getUserNotifications(
            @AuthenticationPrincipal User user,
            @PageableDefault(size = 20, sort = "createdAt") Pageable pageable) {
        
        log.debug("Получение уведомлений для пользователя: id={}, username={}", user.getId(), user.getUsername());
        return ResponseEntity.ok(notificationService.getUserNotifications(user.getId(), pageable));
    }
    
    /**
     * Получает архивированные уведомления текущего пользователя
     * @param user текущий пользователь
     * @param pageable пагинация
     * @return страница архивированных уведомлений
     */
    @GetMapping("/archived")
    public ResponseEntity<Page<NotificationDTO>> getArchivedNotifications(
            @AuthenticationPrincipal User user,
            @PageableDefault(size = 20, sort = "createdAt") Pageable pageable) {
        
        log.debug("Получение архивированных уведомлений для пользователя: id={}, username={}", user.getId(), user.getUsername());
        return ResponseEntity.ok(notificationService.getArchivedNotifications(user.getId(), pageable));
    }
    
    /**
     * Получает непрочитанные уведомления текущего пользователя
     * @param user текущий пользователь
     * @return список непрочитанных уведомлений
     */
    @GetMapping("/unread")
    public ResponseEntity<List<NotificationDTO>> getUnreadNotifications(@AuthenticationPrincipal User user) {
        log.debug("Получение непрочитанных уведомлений для пользователя: id={}, username={}", user.getId(), user.getUsername());
        return ResponseEntity.ok(notificationService.getUnreadNotifications(user.getId()));
    }
    
    /**
     * Получает количество непрочитанных уведомлений
     * @param user текущий пользователь
     * @return количество непрочитанных уведомлений
     */
    @GetMapping("/unread/count")
    public ResponseEntity<Map<String, Long>> getUnreadCount(@AuthenticationPrincipal User user) {
        log.debug("Получение количества непрочитанных уведомлений для пользователя: id={}, username={}", user.getId(), user.getUsername());
        long count = notificationService.getUnreadCount(user.getId());
        return ResponseEntity.ok(Map.of("count", count));
    }
    
    /**
     * Отмечает уведомление как прочитанное
     * @param user текущий пользователь
     * @param notificationId ID уведомления
     * @return подтверждение операции
     */
    @PutMapping("/{notificationId}/read")
    public ResponseEntity<Void> markAsRead(
            @AuthenticationPrincipal User user,
            @PathVariable Long notificationId) {
        log.debug("Отметка уведомления {} как прочитанного для пользователя: id={}, username={}", notificationId, user.getId(), user.getUsername());
        notificationService.markAsRead(notificationId, user.getId());
        return ResponseEntity.ok().build();
    }
    
    /**
     * Архивирует уведомление
     * @param user текущий пользователь
     * @param notificationId ID уведомления
     * @return подтверждение операции
     */
    @PutMapping("/{notificationId}/archive")
    public ResponseEntity<Void> archiveNotification(
            @AuthenticationPrincipal User user,
            @PathVariable Long notificationId) {
        log.debug("Архивирование уведомления {} для пользователя: id={}, username={}", notificationId, user.getId(), user.getUsername());
        notificationService.archiveNotification(notificationId, user.getId());
        return ResponseEntity.ok().build();
    }
    
    /**
     * Отмечает все уведомления как прочитанные
     * @param user текущий пользователь
     * @return количество обновленных уведомлений
     */
    @PutMapping("/read-all")
    public ResponseEntity<Map<String, Integer>> markAllAsRead(@AuthenticationPrincipal User user) {
        log.debug("Отметка всех уведомлений как прочитанных для пользователя: id={}, username={}", user.getId(), user.getUsername());
        int count = notificationService.markAllAsRead(user.getId());
        return ResponseEntity.ok(Map.of("updatedCount", count));
    }
    
    /**
     * Получает настройки уведомлений текущего пользователя
     * @param user текущий пользователь
     * @return настройки уведомлений
     */
    @GetMapping("/preferences")
    public ResponseEntity<NotificationPreferencesDTO> getNotificationPreferences(@AuthenticationPrincipal User user) {
        log.info("Получен запрос на получение настроек уведомлений от пользователя: id={}, username={}", user.getId(), user.getUsername());
        return ResponseEntity.ok(preferencesService.getUserPreferences(user.getId()));
    }
    
    /**
     * Обновляет настройки уведомлений текущего пользователя
     * @param user текущий пользователь
     * @param preferences новые настройки
     * @return обновленные настройки
     */
    @PutMapping("/preferences")
    public ResponseEntity<NotificationPreferencesDTO> updateNotificationPreferences(
            @AuthenticationPrincipal User user,
            @RequestBody NotificationPreferencesDTO preferences) {
        log.info("Получен запрос на обновление настроек уведомлений от пользователя: id={}, username={}", user.getId(), user.getUsername());
        log.debug("Данные для обновления настроек: {}", preferences);
        
        NotificationPreferencesDTO updatedPreferences = preferencesService.updateUserPreferences(user.getId(), preferences);
        
        log.info("Настройки уведомлений пользователя успешно обновлены");
        return ResponseEntity.ok(updatedPreferences);
    }
    
    /**
     * Обновляет отдельную настройку уведомлений
     * @param user текущий пользователь
     * @param settingKey ключ настройки
     * @param request объект с новым значением
     * @return обновленные настройки
     */
    @PatchMapping("/preferences/{settingKey}")
    public ResponseEntity<NotificationPreferencesDTO> updateNotificationSetting(
            @AuthenticationPrincipal User user,
            @PathVariable String settingKey,
            @RequestBody Map<String, Boolean> request) {
        log.info("Получен запрос на обновление настройки '{}' от пользователя: id={}, username={}", 
                settingKey, user.getId(), user.getUsername());
        
        Boolean value = request.get("value");
        log.debug("Значение для настройки '{}': {}", settingKey, value);
        
        if (value == null) {
            throw new IllegalArgumentException("Значение не может быть null");
        }
        
        NotificationPreferencesDTO updatedPreferences = preferencesService.updateUserPreferenceSetting(user.getId(), settingKey, value);
        
        log.info("Настройка '{}' пользователя успешно обновлена", settingKey);
        return ResponseEntity.ok(updatedPreferences);
    }
    
    /**
     * Удаляет уведомление
     * @param user текущий пользователь
     * @param notificationId ID уведомления
     * @return подтверждение удаления
     */
    @DeleteMapping("/{notificationId}")
    public ResponseEntity<Void> deleteNotification(
            @AuthenticationPrincipal User user,
            @PathVariable Long notificationId) {
        log.debug("Удаление уведомления {} для пользователя: id={}, username={}", notificationId, user.getId(), user.getUsername());
        notificationService.deleteNotification(notificationId, user.getId());
        return ResponseEntity.ok().build();
    }
    
    /**
     * Удаляет несколько уведомлений
     * @param user текущий пользователь
     * @param request запрос с ID уведомлений
     * @return подтверждение удаления
     */
    @DeleteMapping("/bulk")
    public ResponseEntity<Void> deleteNotifications(
            @AuthenticationPrincipal User user,
            @RequestBody Map<String, List<Long>> request) {
        List<Long> notificationIds = request.get("ids");
        log.debug("Удаление уведомлений {} для пользователя: id={}, username={}", notificationIds, user.getId(), user.getUsername());
        notificationService.deleteNotifications(notificationIds, user.getId());
        return ResponseEntity.ok().build();
    }
    
    /**
     * Отмечает несколько уведомлений как прочитанные
     * @param user текущий пользователь
     * @param request запрос с ID уведомлений
     * @return подтверждение операции
     */
    @PutMapping("/bulk/read")
    public ResponseEntity<Void> markMultipleAsRead(
            @AuthenticationPrincipal User user,
            @RequestBody Map<String, List<Long>> request) {
        List<Long> notificationIds = request.get("ids");
        log.debug("Отметка уведомлений {} как прочитанных для пользователя: id={}, username={}", notificationIds, user.getId(), user.getUsername());
        notificationService.markMultipleAsRead(notificationIds, user.getId());
        return ResponseEntity.ok().build();
    }
}