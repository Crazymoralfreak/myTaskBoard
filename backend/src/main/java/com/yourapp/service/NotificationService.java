package com.yourapp.service;

import com.yourapp.model.NotificationPreferences;
import com.yourapp.model.User;
import com.yourapp.repository.UserRepository;
import org.springframework.stereotype.Service;

@Service
public class NotificationService {
    private final UserRepository userRepository;

    public NotificationService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public NotificationPreferences getUserNotificationPreferences(Long userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
        return user.getNotificationPreferences();
    }

    public NotificationPreferences updateUserNotificationPreferences(
        Long userId, 
        NotificationPreferences preferences
    ) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        user.setNotificationPreferences(preferences);
        userRepository.save(user);
        return user.getNotificationPreferences();
    }

    public NotificationPreferences updateGlobalNotificationSettings(
        Long userId,
        boolean enabled
    ) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        NotificationPreferences preferences = user.getNotificationPreferences();
        preferences.setGlobalNotificationsEnabled(enabled);
        userRepository.save(user);
        return preferences;
    }
}