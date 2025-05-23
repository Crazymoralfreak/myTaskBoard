package com.yourapp.controller;

import com.yourapp.dto.UserSettingsDTO;
import com.yourapp.service.UserSettingsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import com.yourapp.model.User;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserSettingsController {

    private final UserSettingsService userSettingsService;

    @GetMapping("/settings")
    public ResponseEntity<UserSettingsDTO> getUserSettings(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(userSettingsService.getUserSettings(user));
    }

    @PutMapping("/settings")
    public ResponseEntity<UserSettingsDTO> updateUserSettings(
            @AuthenticationPrincipal User user,
            @RequestBody UserSettingsDTO settings) {
        return ResponseEntity.ok(userSettingsService.updateUserSettings(user, settings));
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