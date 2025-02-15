package com.yourapp.service;

import com.yourapp.model.User;
import com.yourapp.model.NotificationPreferences;
import com.yourapp.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class NotificationService {
    
    private final UserRepository userRepository;
    
    @Transactional
    public NotificationPreferences getNotificationPreferences(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        NotificationPreferences preferences = user.getNotificationPreferences();
        if (preferences == null) {
            preferences = new NotificationPreferences();
            preferences.setUser(user);
            user.setNotificationPreferences(preferences);
            userRepository.save(user);
        }
        
        return preferences;
    }
    
    @Transactional
    public NotificationPreferences updateNotificationPreferences(Long userId, boolean enabled) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        NotificationPreferences preferences = user.getNotificationPreferences();
        if (preferences == null) {
            preferences = new NotificationPreferences();
            preferences.setUser(user);
            user.setNotificationPreferences(preferences);
        }
        
        preferences.setGlobalNotificationsEnabled(enabled);
        return userRepository.save(user).getNotificationPreferences();
    }
}