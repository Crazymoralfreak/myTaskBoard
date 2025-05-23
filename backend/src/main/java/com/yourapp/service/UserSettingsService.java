package com.yourapp.service;

import com.yourapp.dto.UserSettingsDTO;
import com.yourapp.model.User;
import com.yourapp.model.UserSettings;
import com.yourapp.repository.UserSettingsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
@RequiredArgsConstructor
public class UserSettingsService {

    private final UserSettingsRepository userSettingsRepository;
    private static final Logger logger = LoggerFactory.getLogger(UserSettingsService.class);

    @Transactional(readOnly = true)
    public UserSettingsDTO getUserSettings(User user) {
        Optional<UserSettings> settingsOpt = userSettingsRepository.findByUser(user);
        
        if (settingsOpt.isPresent()) {
            UserSettings settings = settingsOpt.get();
            return UserSettingsDTO.builder()
                    .darkMode(settings.getDarkMode())
                    .compactMode(settings.getCompactMode())
                    .enableAnimations(settings.getEnableAnimations())
                    .browserNotifications(settings.getBrowserNotifications())
                    .emailNotifications(settings.getEmailNotifications())
                    .telegramNotifications(settings.getTelegramNotifications())
                    .profileVisibility(settings.getProfileVisibility())
                    .emailVisible(settings.getEmailVisible())
                    .phoneVisible(settings.getPhoneVisible())
                    .positionVisible(settings.getPositionVisible())
                    .bioVisible(settings.getBioVisible())
                    .language(settings.getLanguage())
                    .timezone(settings.getTimezone())
                    .build();
        }
        
        // Создаем дефолтные настройки если они еще не созданы
        UserSettings defaultSettings = UserSettings.builder()
                .user(user)
                .darkMode(false)
                .compactMode(false)
                .enableAnimations(true)
                .browserNotifications(true)
                .emailNotifications(true)
                .telegramNotifications(false)
                .profileVisibility("public")
                .emailVisible(true)
                .phoneVisible(true)
                .positionVisible(true)
                .bioVisible(true)
                .language("eng")
                .timezone("UTC+0")
                .build();
        
        userSettingsRepository.save(defaultSettings);
        
        return UserSettingsDTO.builder()
                .darkMode(defaultSettings.getDarkMode())
                .compactMode(defaultSettings.getCompactMode())
                .enableAnimations(defaultSettings.getEnableAnimations())
                .browserNotifications(defaultSettings.getBrowserNotifications())
                .emailNotifications(defaultSettings.getEmailNotifications())
                .telegramNotifications(defaultSettings.getTelegramNotifications())
                .profileVisibility(defaultSettings.getProfileVisibility())
                .emailVisible(defaultSettings.getEmailVisible())
                .phoneVisible(defaultSettings.getPhoneVisible())
                .positionVisible(defaultSettings.getPositionVisible())
                .bioVisible(defaultSettings.getBioVisible())
                .language(defaultSettings.getLanguage())
                .timezone(defaultSettings.getTimezone())
                .build();
    }

    @Transactional
    public UserSettingsDTO updateUserSettings(User user, UserSettingsDTO settingsDto) {
        logger.info("Обновление настроек для пользователя ID: {}, username: {}", user.getId(), user.getUsername());
        
        // Находим существующие настройки или создаем НОВЫЙ объект, если их нет
        // Это важно, т.к. дефолтные настройки уже должны быть созданы при регистрации
        UserSettings settings = userSettingsRepository.findByUser(user)
                .orElseThrow(() -> {
                     // Эта ситуация не должна происходить, если настройки создаются при регистрации
                     logger.error("Критическая ошибка: Настройки для пользователя ID {} не найдены при обновлении!", user.getId());
                     return new RuntimeException("UserSettings not found for user while updating.");
                });
        
        logger.debug("Найдены настройки пользователя: ID={}", settings.getId());
        logger.debug("Текущие настройки: darkMode={}, language={}", settings.getDarkMode(), settings.getLanguage());
        
        // Используем безопасный метод обновления, который не изменяет связь с пользователем
        // и не может затронуть пароль или другие поля пользователя
        int updatedCount = userSettingsRepository.updateSettingsSafely(
            settings.getId(),
            settingsDto.getDarkMode(),
            settingsDto.getCompactMode(),
            settingsDto.getEnableAnimations(),
            settingsDto.getLanguage(),
            settingsDto.getTimezone()
        );
        
        logger.info("Настройки обновлены, затронуто записей: {}", updatedCount);
        
        // Получаем обновленные настройки из БД
        UserSettings updatedSettings = userSettingsRepository.findById(settings.getId())
                .orElseThrow(() -> new RuntimeException("Settings not found after update"));
        
        // Маппим обновленный объект обратно в DTO
        return UserSettingsDTO.builder()
                .darkMode(updatedSettings.getDarkMode())
                .compactMode(updatedSettings.getCompactMode())
                .enableAnimations(updatedSettings.getEnableAnimations())
                .browserNotifications(updatedSettings.getBrowserNotifications())
                .emailNotifications(updatedSettings.getEmailNotifications())
                .telegramNotifications(updatedSettings.getTelegramNotifications())
                .profileVisibility(updatedSettings.getProfileVisibility())
                .emailVisible(updatedSettings.getEmailVisible())
                .phoneVisible(updatedSettings.getPhoneVisible())
                .positionVisible(updatedSettings.getPositionVisible())
                .bioVisible(updatedSettings.getBioVisible())
                .language(updatedSettings.getLanguage())
                .timezone(updatedSettings.getTimezone())
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
} 