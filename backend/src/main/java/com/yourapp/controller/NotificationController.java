package com.yourapp.controller;

import com.yourapp.model.NotificationPreferences;
import com.yourapp.service.NotificationService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {
    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping("/preferences")
    public NotificationPreferences getUserPreferences(
        @RequestParam Long userId
    ) {
        return notificationService.getUserNotificationPreferences(userId);
    }

    @PutMapping("/preferences")
    public NotificationPreferences updatePreferences(
        @RequestParam Long userId,
        @RequestBody NotificationPreferences preferences
    ) {
        return notificationService.updateUserNotificationPreferences(
            userId, 
            preferences
        );
    }

    @PatchMapping("/global")
    public NotificationPreferences toggleGlobalNotifications(
        @RequestParam Long userId,
        @RequestParam boolean enabled
    ) {
        return notificationService.updateGlobalNotificationSettings(
            userId, 
            enabled
        );
    }
}