package com.yourapp.service;

import com.yourapp.model.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import lombok.RequiredArgsConstructor;
import com.yourapp.dto.RegisterRequest;
import com.yourapp.dto.AuthResponse;
import com.yourapp.dto.UserDto;
import com.yourapp.repository.UserRepository;
import com.yourapp.service.JwtService;

@Service
@RequiredArgsConstructor
public class AuthService {
    
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    
    public AuthResponse register(RegisterRequest request) {
        // Проверяем, не существует ли уже пользователь с таким email
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new RuntimeException("User with this email already exists");
        }
        
        // Создаем нового пользователя
        var user = User.builder()
                .email(request.getEmail())
                .username(request.getUsername() != null ? request.getUsername() : request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .build();
        
        // Сохраняем пользователя
        user = userRepository.save(user);
        
        // Генерируем токен
        String token = jwtService.generateToken(user);
        
        // Создаем DTO пользователя
        UserDto userDto = UserDto.builder()
                .id(user.getId())
                .email(user.getEmail())
                .username(user.getUsername())
                .build();
        
        // Возвращаем ответ
        return AuthResponse.builder()
                .token(token)
                .user(userDto)
                .message("User registered successfully")
                .build();
    }

    public AuthResponse login(AuthRequest request) {
        // TODO: Implement login logic
        return AuthResponse.builder()
            .token("temp_token")
            .username(request.getEmail())
            .userId("temp_id")
            .build();
    }

    public AuthResponse telegramAuth(TelegramAuthRequest request) {
        // TODO: Implement Telegram auth logic
        return AuthResponse.builder()
            .token("temp_token")
            .username(request.getUsername())
            .userId(request.getTelegramId())
            .build();
    }
} 