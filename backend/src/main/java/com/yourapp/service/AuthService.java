package com.yourapp.service;

import com.yourapp.dto.AuthRequest;
import com.yourapp.dto.AuthResponse;
import com.yourapp.dto.RegisterRequest;
import com.yourapp.model.AuthType;
import com.yourapp.model.TelegramAuthRequest;
import com.yourapp.model.User;
import com.yourapp.model.NotificationPreferences;
import com.yourapp.model.UserSettings;
import com.yourapp.repository.UserRepository;
import com.yourapp.repository.NotificationPreferencesRepository;
import com.yourapp.repository.UserSettingsRepository;
import com.yourapp.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional
public class AuthService {
    private static final Logger logger = LoggerFactory.getLogger(AuthService.class);
    
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final NotificationPreferencesRepository notificationPreferencesRepository;
    private final UserSettingsRepository userSettingsRepository;
    
    public AuthResponse register(RegisterRequest request) {
        try {
            if (userRepository.findByEmail(request.getEmail()).isPresent()) {
                throw new RuntimeException("User with this email already exists");
            }
            
            // Хешируем пароль с использованием стабильного PasswordEncoder
            String hashedPassword = passwordEncoder.encode(request.getPassword());
            
            // Проверяем, что BCrypt правильно хеширует и проверяет пароль
            boolean testMatches = passwordEncoder.matches(request.getPassword(), hashedPassword);
            logger.info("Тест хеширования при регистрации: {}", testMatches);
            
            if (!testMatches) {
                logger.error("Критическая ошибка: BCrypt не подтвердил собственный хеш");
                throw new RuntimeException("Password hashing error");
            }
            
            User user = User.builder()
                    .username(request.getUsername())
                    .email(request.getEmail())
                    .password(hashedPassword)
                    .authType(AuthType.WEB)
                    .build();
            
            user = userRepository.save(user);
            
            NotificationPreferences preferences = NotificationPreferences.builder()
                    .user(user)
                    .globalNotificationsEnabled(true)
                    .taskAssignedNotifications(true)
                    .taskMovedNotifications(true)
                    .taskUpdatedNotifications(true)
                    .mentionNotifications(true)
                    .build();
            
            user.setNotificationPreferences(preferences);
            
            UserSettings userSettings = createDefaultUserSettings(user);
            user.setUserSettings(userSettings);
            
            String token = jwtService.generateToken(user);
            
            user = userRepository.save(user);
            
            return AuthResponse.builder()
                    .token(token)
                    .user(user.toDto())
                    .message("User registered successfully")
                    .build();
        } catch (Exception e) {
            logger.error("Registration failed", e);
            throw new RuntimeException("Registration failed: " + e.getMessage());
        }
    }

    public AuthResponse login(AuthRequest request) {
        logger.info("Запрос на авторизацию: email={}", request.getEmail());
        
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> {
                    logger.error("Попытка входа с несуществующим email: {}", request.getEmail());
                    return new RuntimeException("User not found");
                });
                
        logger.info("Пользователь найден: id={}, username={}, authType={}", 
                user.getId(), user.getUsername(), user.getAuthType());
        
        // Получаем хешированный пароль из БД для отладки
        String storedPasswordHash = user.getPassword();
        String rawPassword = request.getPassword();
        
        // Если пароль не был передан, логируем это
        if (rawPassword == null || rawPassword.isEmpty()) {
            logger.error("Пустой пароль при попытке входа пользователя: {}", user.getEmail());
            throw new RuntimeException("Password cannot be empty");
        }
        
        logger.info("Проверка пароля: хеш из БД (длина {}): {}", 
                storedPasswordHash.length(), storedPasswordHash.substring(0, Math.min(10, storedPasswordHash.length())) + "...");
        logger.debug("Проверка пароля: введённый пароль (длина {}): {}", 
                rawPassword.length(), rawPassword);
        
        // Проверяем пароль
        boolean matches = false;
        try {
            matches = passwordEncoder.matches(rawPassword, storedPasswordHash);
            logger.info("Результат проверки пароля: {}", matches);
            
            // Если не совпадает, логируем подробности
            if (!matches) {
                logger.warn("Хеш пароля из БД: {}", storedPasswordHash);
                logger.warn("Новый хеш того же пароля: {}", passwordEncoder.encode(rawPassword));
            }
        } catch (Exception e) {
            logger.error("Ошибка при проверке пароля: {}", e.getMessage(), e);
            throw new RuntimeException("Error validating password");
        }

        if (!matches) {
            logger.warn("Неверный пароль для пользователя: {}", user.getEmail());
            throw new RuntimeException("Invalid password");
        }
        
        // Проверяем формат хеша и при необходимости обновляем его
        if (!storedPasswordHash.startsWith("$2a$10$")) {
            logger.info("Обнаружен устаревший формат хеша, обновляем хеш пароля");
            String newHash = passwordEncoder.encode(rawPassword);
            user.setPassword(newHash);
            user = userRepository.save(user);
            logger.info("Хеш пароля обновлен до современного формата");
        }
        
        logger.info("Авторизация успешна, генерируем token");
        String token = jwtService.generateToken(user);
        
        return AuthResponse.builder()
                .token(token)
                .user(user.toDto())
                .message("Login successful")
                .build();
    }

    public AuthResponse telegramAuth(TelegramAuthRequest request) {
        logger.info("Обработка запроса аутентификации через Telegram: {}", request.getTelegramId());
        
        Optional<User> existingUserOpt = userRepository.findByTelegramId(request.getTelegramId());
        User user;
        boolean isNewUser = false;
        
        if (existingUserOpt.isPresent()) {
            user = existingUserOpt.get();
            logger.info("Найден существующий пользователь Telegram: {}", user.getUsername());
            if (request.getPhoto_url() != null && !request.getPhoto_url().isEmpty()) {
                user.setAvatarUrl(request.getPhoto_url());
            }
        } else {
            isNewUser = true;
            logger.info("Создание нового пользователя Telegram: {}", request.getUsername());
            user = User.builder()
                    .username(request.getUsername())
                    .telegramId(request.getTelegramId())
                    .authType(AuthType.TELEGRAM)
                    .password(passwordEncoder.encode("telegram_" + request.getTelegramId()))
                    .avatarUrl(request.getPhoto_url())
                    .build();
            user = userRepository.save(user);
        }
        
        if (isNewUser) {
            NotificationPreferences preferences = NotificationPreferences.builder()
                    .user(user)
                    .globalNotificationsEnabled(true)
                    .taskAssignedNotifications(true)
                    .taskMovedNotifications(true)
                    .taskUpdatedNotifications(true)
                    .mentionNotifications(true)
                    .build();
            notificationPreferencesRepository.save(preferences);
            user.setNotificationPreferences(preferences);

            UserSettings userSettings = createDefaultUserSettings(user);
            user.setUserSettings(userSettings);
        }
        
        if (!isNewUser) {
            user = userRepository.save(user);
        }
        
        String token = jwtService.generateToken(user);
        
        return AuthResponse.builder()
                .token(token)
                .user(user.toDto())
                .message("Telegram auth successful")
                .build();
    }
    
    private UserSettings createDefaultUserSettings(User user) {
        logger.debug("Создание дефолтных настроек для пользователя ID: {}", user.getId());
        UserSettings settings = UserSettings.builder()
                .user(user)
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
                .language("ru")
                .timezone("UTC+3")
                .build();
        return userSettingsRepository.save(settings);
    }
    
    /**
     * Генерирует новый токен для пользователя после обновления профиля
     */
    public AuthResponse refreshTokenAfterProfileUpdate(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
                
        String token = jwtService.generateToken(user);
        
        return AuthResponse.builder()
                .token(token)
                .user(user.toDto())
                .message("Token refreshed after profile update")
                .build();
    }

    /**
     * Сбрасывает пароль пользователя администратором
     * @param userId ID пользователя
     * @param newPassword новый пароль
     * @return true если пароль успешно сброшен
     */
    @Transactional
    public boolean adminResetPassword(Long userId, String newPassword) {
        logger.info("Сброс пароля администратором для пользователя ID: {}", userId);
        
        try {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found"));
            
            user.setPassword(passwordEncoder.encode(newPassword));
            user.setLastPasswordResetDate(LocalDateTime.now()); // Для аудита
            userRepository.save(user);
            
            logger.info("Пароль успешно сброшен администратором для пользователя: {}", user.getUsername());
            return true;
        } catch (Exception e) {
            logger.error("Ошибка при сбросе пароля администратором: {}", e.getMessage(), e);
            return false;
        }
    }

    /**
     * Самостоятельный сброс пароля пользователем
     * @param email email пользователя
     * @param oldPassword старый пароль
     * @param newPassword новый пароль
     * @return AuthResponse с новым токеном
     */
    @Transactional
    public AuthResponse selfResetPassword(String email, String oldPassword, String newPassword) {
        logger.info("Запрос на самостоятельный сброс пароля для: {}", email);
        
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        // Проверяем старый пароль
        if (!passwordEncoder.matches(oldPassword, user.getPassword())) {
            logger.warn("Неверный текущий пароль при попытке сброса для: {}", email);
            throw new RuntimeException("Current password is incorrect");
        }
        
        // Устанавливаем новый пароль
        user.setPassword(passwordEncoder.encode(newPassword));
        user.setLastPasswordResetDate(LocalDateTime.now()); // Для аудита
        user = userRepository.save(user);
        
        logger.info("Пароль успешно изменен пользователем: {}", email);
        
        // Генерируем новый токен с новыми учетными данными
        String token = jwtService.generateToken(user);
        
        return AuthResponse.builder()
                .token(token)
                .user(user.toDto())
                .message("Password changed successfully")
                .build();
    }

    /**
     * Специальный метод для отладки и диагностики проблем с авторизацией
     * Этот метод позволяет войти в систему с указанным паролем независимо от хеша в базе
     */
    @Transactional
    public AuthResponse debugLogin(AuthRequest request) {
        logger.warn("ВНИМАНИЕ: Используется отладочный метод авторизации!");
        
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> {
                    logger.error("Попытка входа с несуществующим email: {}", request.getEmail());
                    return new RuntimeException("User not found");
                });

        // Получаем сохраненный хеш
        String storedHash = user.getPassword();
        
        // Создаем новый пароль (на всякий случай)
        String newHash = passwordEncoder.encode(request.getPassword());
        
        // Сохраняем для диагностики
        logger.info("Диагностика пароля для {}", user.getEmail());
        logger.info("Введённый пароль: '{}'", request.getPassword());
        logger.info("Сохранённый хеш: '{}'", storedHash);
        logger.info("Новый хеш: '{}'", newHash);
        
        // Прямая проверка соответствия
        boolean matches = passwordEncoder.matches(request.getPassword(), storedHash);
        logger.info("Результат проверки: {}", matches);
        
        // Обновляем пароль принудительно
        user.setPassword(newHash);
        userRepository.save(user);
        logger.info("Пароль принудительно обновлен");
        
        // Создаем токен
        String token = jwtService.generateToken(user);
        
        return AuthResponse.builder()
                .token(token)
                .user(user.toDto())
                .message("Debug login successful")
                .build();
    }

    /**
     * Поиск пользователя по email
     * @param email Email пользователя
     * @return Пользователь или null, если не найден
     */
    public User findUserByEmail(String email) {
        logger.info("Поиск пользователя по email: {}", email);
        return userRepository.findByEmail(email).orElse(null);
    }
} 