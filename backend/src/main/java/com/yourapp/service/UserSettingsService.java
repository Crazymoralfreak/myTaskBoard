package com.yourapp.service;

import com.yourapp.dto.UserSettingsDto;
import com.yourapp.model.User;
import com.yourapp.model.UserSettings;
import com.yourapp.repository.UserSettingsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserSettingsService {

    private final UserSettingsRepository userSettingsRepository;

    @Transactional(readOnly = true)
    public UserSettingsDto getUserSettings(User user) {
        UserSettings settings = userSettingsRepository.findByUser(user)
                .orElseGet(() -> createDefaultSettings(user));
        
        return UserSettingsDto.builder()
                .darkMode(settings.getDarkMode())
                .compactView(settings.getCompactView())
                .enableAnimations(settings.getEnableAnimations())
                .browserNotifications(settings.getBrowserNotifications())
                .emailNotifications(settings.getEmailNotifications())
                .telegramNotifications(settings.getTelegramNotifications())
                .language(settings.getLanguage())
                .timezone(settings.getTimezone())
                .build();
    }

    @Transactional
    public UserSettingsDto updateUserSettings(User user, UserSettingsDto settingsDto) {
        UserSettings settings = userSettingsRepository.findByUser(user)
                .orElseGet(() -> createDefaultSettings(user));
        
        settings.setDarkMode(settingsDto.getDarkMode());
        settings.setCompactView(settingsDto.getCompactView());
        settings.setEnableAnimations(settingsDto.getEnableAnimations());
        settings.setBrowserNotifications(settingsDto.getBrowserNotifications());
        settings.setEmailNotifications(settingsDto.getEmailNotifications());
        settings.setTelegramNotifications(settingsDto.getTelegramNotifications());
        settings.setLanguage(settingsDto.getLanguage());
        settings.setTimezone(settingsDto.getTimezone());
        
        settings = userSettingsRepository.save(settings);
        
        return UserSettingsDto.builder()
                .darkMode(settings.getDarkMode())
                .compactView(settings.getCompactView())
                .enableAnimations(settings.getEnableAnimations())
                .browserNotifications(settings.getBrowserNotifications())
                .emailNotifications(settings.getEmailNotifications())
                .telegramNotifications(settings.getTelegramNotifications())
                .language(settings.getLanguage())
                .timezone(settings.getTimezone())
                .build();
    }

    @Transactional
    public void clearCache(User user) {
        // Здесь можно добавить логику очистки кэша
    }

    @Transactional
    public void deleteUserData(User user) {
        // Здесь можно добавить логику удаления пользовательских данных
        userSettingsRepository.deleteByUser(user);
    }

    private UserSettings createDefaultSettings(User user) {
        UserSettings settings = UserSettings.builder()
                .user(user)
                .darkMode(false)
                .compactView(false)
                .enableAnimations(true)
                .browserNotifications(true)
                .emailNotifications(true)
                .telegramNotifications(true)
                .language("ru")
                .timezone("UTC+3")
                .build();
        
        return userSettingsRepository.save(settings);
    }
} 