package com.yourapp.service;

import com.yourapp.model.NotificationPreferences;
import com.yourapp.model.User;
import com.yourapp.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private NotificationService notificationService;

    @Test
    void testGetUserNotificationPreferences() {
        User user = new User();
        user.setId(1L);
        NotificationPreferences preferences = new NotificationPreferences();
        user.setNotificationPreferences(preferences);

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        NotificationPreferences result = notificationService.getUserNotificationPreferences(1L);
        
        assertNotNull(result);
        assertEquals(preferences, result);
        verify(userRepository, times(1)).findById(1L);
    }

    @Test
    void testUpdateUserNotificationPreferences() {
        User user = new User();
        user.setId(1L);
        NotificationPreferences newPreferences = new NotificationPreferences();
        newPreferences.setTaskAssignedNotifications(false);

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(userRepository.save(user)).thenReturn(user);

        NotificationPreferences result = notificationService.updateUserNotificationPreferences(1L, newPreferences);
        
        assertNotNull(result);
        assertFalse(result.isTaskAssignedNotifications());
        verify(userRepository, times(1)).findById(1L);
        verify(userRepository, times(1)).save(user);
    }

    @Test
    void testUpdateGlobalNotificationSettings() {
        User user = new User();
        user.setId(1L);
        NotificationPreferences preferences = new NotificationPreferences();
        user.setNotificationPreferences(preferences);

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(userRepository.save(user)).thenReturn(user);

        NotificationPreferences result = notificationService.updateGlobalNotificationSettings(1L, false);
        
        assertNotNull(result);
        assertFalse(result.isGlobalNotificationsEnabled());
        verify(userRepository, times(1)).findById(1L);
        verify(userRepository, times(1)).save(user);
    }
}