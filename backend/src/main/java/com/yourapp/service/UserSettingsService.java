package com.yourapp.service;

import com.yourapp.dto.UserSettingsDto;
import com.yourapp.model.User;
import com.yourapp.model.UserSettings;
import com.yourapp.repository.UserSettingsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.Optional;
import java.util.Set;
import java.util.Arrays;
import java.util.Objects;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
@RequiredArgsConstructor
public class UserSettingsService {

    private final UserSettingsRepository userSettingsRepository;
    private static final Logger logger = LoggerFactory.getLogger(UserSettingsService.class);
    
    // Список поддерживаемых языков
    private static final Set<String> SUPPORTED_LANGUAGES = Set.of(
        "ru", "en", "zh", "es", "hi", "ar", "pt", "fr"
    );
    
    // Список поддерживаемых часовых поясов (основные)
    private static final Set<String> SUPPORTED_TIMEZONES = Set.of(
        "Europe/Kaliningrad", "Europe/Moscow", "Europe/Samara", "Asia/Yekaterinburg",
        "Asia/Novosibirsk", "Asia/Irkutsk", "Asia/Yakutsk", "Asia/Vladivostok",
        "Asia/Magadan", "Asia/Kamchatka", "UTC", "Europe/London", "Europe/Berlin",
        "Europe/Kiev", "Asia/Dubai", "Asia/Karachi", "Asia/Dhaka", "Asia/Bangkok",
        "Asia/Shanghai", "Asia/Tokyo", "Australia/Sydney", "Pacific/Auckland",
        "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles",
        "America/Sao_Paulo"
    );

    @Transactional(readOnly = true)
    public UserSettingsDto getUserSettings(User user) {
        Optional<UserSettings> settingsOpt = userSettingsRepository.findByUser(user);
        
        if (settingsOpt.isPresent()) {
            UserSettings settings = settingsOpt.get();
            // Применяем значения по умолчанию для null полей
            return UserSettingsDto.builder()
                    .darkMode(settings.getDarkMode() != null ? settings.getDarkMode() : false)
                    .compactMode(settings.getCompactMode() != null ? settings.getCompactMode() : false)
                    .enableAnimations(settings.getEnableAnimations() != null ? settings.getEnableAnimations() : true)
                    .browserNotifications(settings.getBrowserNotifications() != null ? settings.getBrowserNotifications() : true)
                    .emailNotifications(settings.getEmailNotifications() != null ? settings.getEmailNotifications() : true)
                    .telegramNotifications(settings.getTelegramNotifications() != null ? settings.getTelegramNotifications() : true)
                    .profileVisibility(settings.getProfileVisibility() != null ? settings.getProfileVisibility() : "public")
                    .emailVisible(settings.getEmailVisible() != null ? settings.getEmailVisible() : true)
                    .phoneVisible(settings.getPhoneVisible() != null ? settings.getPhoneVisible() : true)
                    .positionVisible(settings.getPositionVisible() != null ? settings.getPositionVisible() : true)
                    .bioVisible(settings.getBioVisible() != null ? settings.getBioVisible() : true)
                    .language(settings.getLanguage() != null ? settings.getLanguage() : "en")
                    .timezone(settings.getTimezone() != null ? settings.getTimezone() : "UTC")
                    .build();
        }
        
        // Возвращаем настройки по умолчанию, если пользователь не найден
        return UserSettingsDto.builder()
                .darkMode(false)
                .compactMode(false)
                .enableAnimations(true)
                .browserNotifications(true)
                .emailNotifications(true)
                .telegramNotifications(true)
                .profileVisibility("public")
                .emailVisible(true)
                .phoneVisible(true)
                .positionVisible(true)
                .bioVisible(true)
                .language("en")
                .timezone("UTC")
                .build();
    }

    @Transactional
    public UserSettingsDto updateUserSettings(User user, UserSettingsDto settingsDto) {
        logger.info("Обновление настроек для пользователя ID: {}, username: {}", user.getId(), user.getUsername());
        logger.debug("Входящие данные DTO: darkMode={}, compactMode={}, enableAnimations={}, language={}, timezone={}", 
            settingsDto.getDarkMode(), settingsDto.getCompactMode(), settingsDto.getEnableAnimations(), 
            settingsDto.getLanguage(), settingsDto.getTimezone());
        
        // Валидируем входные данные для безопасности
        String validatedLanguage = validateLanguage(settingsDto.getLanguage());
        String validatedTimezone = validateTimezone(settingsDto.getTimezone());
        
        if (!validatedLanguage.equals(settingsDto.getLanguage())) {
            logger.warn("Некорректный язык '{}' заменен на '{}'", settingsDto.getLanguage(), validatedLanguage);
        }
        
        if (!validatedTimezone.equals(settingsDto.getTimezone())) {
            logger.warn("Некорректная таймзона '{}' заменена на '{}'", settingsDto.getTimezone(), validatedTimezone);
        }
        
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
            settingsDto.getBrowserNotifications(),
            settingsDto.getEmailNotifications(),
            settingsDto.getTelegramNotifications(),
            validatedLanguage,  // Используем валидированное значение
            validatedTimezone   // Используем валидированное значение
        );
        
        logger.info("Настройки обновлены, затронуто записей: {}", updatedCount);
        
        // Получаем обновленные настройки из БД
        UserSettings updatedSettings = userSettingsRepository.findById(settings.getId())
                .orElseThrow(() -> new RuntimeException("Settings not found after update"));
        
        // Маппим обновленный объект обратно в DTO
        UserSettingsDto resultDto = UserSettingsDto.builder()
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
        
        logger.debug("Возвращаемые данные DTO: darkMode={}, compactMode={}, enableAnimations={}, language={}, timezone={}", 
            resultDto.getDarkMode(), resultDto.getCompactMode(), resultDto.getEnableAnimations(), 
            resultDto.getLanguage(), resultDto.getTimezone());
        
        return resultDto;
    }

    @Transactional
    public void clearCache(User user) {
        // Здесь можно добавить логику очистки кэша
    }

    @Transactional
    public void deleteUserData(User user) {
        // Здесь можно добавить логику удаления данных пользователя
        userSettingsRepository.deleteByUser(user);
    }
    
    /**
     * Обновляет отдельную настройку пользователя
     * @param user пользователь
     * @param settingKey ключ настройки
     * @param value значение настройки
     * @return обновленные настройки
     */
    @Transactional
    public UserSettingsDto updateUserSetting(User user, String settingKey, Object value) {
        logger.info("Обновление настройки '{}' для пользователя ID: {}, значение: {}", 
                settingKey, user.getId(), value);
        
        // Находим существующие настройки
        UserSettings settings = userSettingsRepository.findByUser(user)
                .orElseThrow(() -> {
                    logger.error("Настройки для пользователя ID {} не найдены!", user.getId());
                    return new RuntimeException("UserSettings not found for user.");
                });
        
        // Исправляем null значения в существующих настройках
        fixNullSettings(settings);
        
        // Обновляем только указанную настройку
        switch (settingKey) {
            case "darkMode":
                settings.setDarkMode((Boolean) value);
                break;
            case "compactMode":
                settings.setCompactMode((Boolean) value);
                break;
            case "enableAnimations":
                settings.setEnableAnimations((Boolean) value);
                break;
            case "browserNotifications":
                settings.setBrowserNotifications((Boolean) value);
                break;
            case "emailNotifications":
                settings.setEmailNotifications((Boolean) value);
                break;
            case "telegramNotifications":
                settings.setTelegramNotifications((Boolean) value);
                break;
            case "language":
                String validatedLanguage = validateLanguage((String) value);
                settings.setLanguage(validatedLanguage);
                break;
            case "timezone":
                String validatedTimezone = validateTimezone((String) value);
                settings.setTimezone(validatedTimezone);
                break;
            default:
                throw new IllegalArgumentException("Неизвестная настройка: " + settingKey);
        }
        
        // Сохраняем изменения
        UserSettings updatedSettings = userSettingsRepository.save(settings);
        
        logger.info("Настройка '{}' успешно обновлена", settingKey);
        
        // Возвращаем полные настройки, используя getUserSettings для корректной обработки null значений
        return getUserSettings(user);
    }
    
    /**
     * Исправляет null значения в настройках пользователя
     * @param settings настройки пользователя
     */
    private void fixNullSettings(UserSettings settings) {
        boolean needsSave = false;
        
        if (settings.getDarkMode() == null) {
            settings.setDarkMode(false);
            needsSave = true;
        }
        if (settings.getCompactMode() == null) {
            settings.setCompactMode(false);
            needsSave = true;
        }
        if (settings.getEnableAnimations() == null) {
            settings.setEnableAnimations(true);
            needsSave = true;
        }
        if (settings.getBrowserNotifications() == null) {
            settings.setBrowserNotifications(true);
            needsSave = true;
        }
        if (settings.getEmailNotifications() == null) {
            settings.setEmailNotifications(true);
            needsSave = true;
        }
        if (settings.getTelegramNotifications() == null) {
            settings.setTelegramNotifications(true);
            needsSave = true;
        }
        if (settings.getLanguage() == null) {
            settings.setLanguage("en");
            needsSave = true;
        }
        if (settings.getTimezone() == null) {
            settings.setTimezone("UTC");
            needsSave = true;
        }
        if (settings.getProfileVisibility() == null) {
            settings.setProfileVisibility("public");
            needsSave = true;
        }
        if (settings.getEmailVisible() == null) {
            settings.setEmailVisible(true);
            needsSave = true;
        }
        if (settings.getPhoneVisible() == null) {
            settings.setPhoneVisible(true);
            needsSave = true;
        }
        if (settings.getPositionVisible() == null) {
            settings.setPositionVisible(true);
            needsSave = true;
        }
        if (settings.getBioVisible() == null) {
            settings.setBioVisible(true);
            needsSave = true;
        }
        
        if (needsSave) {
            userSettingsRepository.save(settings);
            logger.info("Исправлены null значения в настройках пользователя {}", settings.getUser().getUsername());
        }
    }
    
    /**
     * Валидация языка - проверяет, что язык поддерживается
     * @param language язык для проверки
     * @return валидированный язык
     */
    private String validateLanguage(String language) {
        if (language == null || language.trim().isEmpty() || "null".equals(language)) {
            logger.debug("Язык не указан или null, используется en по умолчанию");
            return "en"; // язык по умолчанию
        }
        
        String trimmedLanguage = language.trim().toLowerCase();
        if (SUPPORTED_LANGUAGES.contains(trimmedLanguage)) {
            return trimmedLanguage;
        }
        
        logger.warn("Неподдерживаемый язык: {}, используется en по умолчанию", language);
        return "en";
    }
    
    /**
     * Валидация часового пояса - проверяет, что часовой пояс поддерживается
     * @param timezone часовой пояс для проверки
     * @return валидированный часовой пояс
     */
    private String validateTimezone(String timezone) {
        if (timezone == null || timezone.trim().isEmpty() || "null".equals(timezone)) {
            logger.debug("Таймзона не указана или null, используется UTC по умолчанию");
            return "UTC"; // часовой пояс по умолчанию
        }
        
        String trimmedTimezone = timezone.trim();
        if (SUPPORTED_TIMEZONES.contains(trimmedTimezone)) {
            return trimmedTimezone;
        }
        
        // Дополнительная проверка для старых форматов типа "UTC+3"
        if (trimmedTimezone.matches("UTC[+-]\\d{1,2}")) {
            // Конвертируем в современный формат
            switch (trimmedTimezone) {
                case "UTC+2": return "Europe/Kaliningrad";
                case "UTC+3": return "Europe/Moscow";
                case "UTC+4": return "Europe/Samara";
                case "UTC+5": return "Asia/Yekaterinburg";
                case "UTC+0": return "UTC";
                default:
                    logger.warn("Неподдерживаемый UTC формат: {}, используется UTC по умолчанию", timezone);
                    return "UTC";
            }
        }
        
        logger.warn("Неподдерживаемая таймзона: {}, используется UTC по умолчанию", timezone);
        return "UTC";
    }
} 