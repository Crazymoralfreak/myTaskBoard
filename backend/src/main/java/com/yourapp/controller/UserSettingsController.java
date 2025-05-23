package com.yourapp.controller;

import com.yourapp.dto.UserSettingsDTO;
import com.yourapp.service.UserSettingsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import com.yourapp.model.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserSettingsController {

    private final UserSettingsService userSettingsService;
    private static final Logger log = LoggerFactory.getLogger(UserSettingsController.class);

    @GetMapping("/settings")
    public ResponseEntity<UserSettingsDTO> getUserSettings(@AuthenticationPrincipal User user) {
        log.info("Получен запрос на получение настроек пользователя: id={}, username={}", user.getId(), user.getUsername());
        return ResponseEntity.ok(userSettingsService.getUserSettings(user));
    }

    @PutMapping("/settings")
    public ResponseEntity<UserSettingsDTO> updateUserSettings(
            @AuthenticationPrincipal User user,
            @RequestBody UserSettingsDTO settings) {
        log.info("Получен запрос на обновление настроек пользователя: id={}, username={}", user.getId(), user.getUsername());
        log.debug("Данные для обновления настроек: {}", settings);
        
        UserSettingsDTO updatedSettings = userSettingsService.updateUserSettings(user, settings);
        
        log.info("Настройки пользователя успешно обновлены");
        return ResponseEntity.ok(updatedSettings);
    }

    @PostMapping("/clear-cache")
    public ResponseEntity<Void> clearCache(@AuthenticationPrincipal User user) {
        userSettingsService.clearCache(user);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/data")
    public ResponseEntity<Void> deleteUserData(@AuthenticationPrincipal User user) {
        userSettingsService.deleteUserData(user);
        return ResponseEntity.ok().build();
    }
} 