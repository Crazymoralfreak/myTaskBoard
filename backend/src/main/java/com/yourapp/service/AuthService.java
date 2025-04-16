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
            
            User user = User.builder()
                    .username(request.getUsername())
                    .email(request.getEmail())
                    .password(passwordEncoder.encode(request.getPassword()))
                    .lastPasswordResetDate(LocalDateTime.now())
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
            
            user = userRepository.save(user);
            
            String token = jwtService.generateToken(user);
            
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
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));
                
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid password");
        }
                
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
                    .lastPasswordResetDate(LocalDateTime.now())
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
        
        user = userRepository.save(user);
                
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
} 