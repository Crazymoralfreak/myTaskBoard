package com.yourapp.service;

import com.yourapp.dto.AuthRequest;
import com.yourapp.dto.AuthResponse;
import com.yourapp.dto.RegisterRequest;
import com.yourapp.model.TelegramAuthRequest;
import com.yourapp.model.User;
import com.yourapp.repository.UserRepository;
import com.yourapp.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class AuthService {
    
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new RuntimeException("User with this email already exists");
        }
        
        User user = User.builder()
                .email(request.getEmail())
                .username(request.getUsername() != null ? request.getUsername() : request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .build();
        
        user = userRepository.save(user);
        String token = jwtService.generateToken(user);
        
        return AuthResponse.builder()
                .token(token)
                .user(user.toDto())
                .message("User registered successfully")
                .build();
    }

    public AuthResponse login(AuthRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));
                
        String token = jwtService.generateToken(user);
        
        return AuthResponse.builder()
                .token(token)
                .user(user.toDto())
                .message("Login successful")
                .build();
    }

    public AuthResponse telegramAuth(TelegramAuthRequest request) {
        User user = userRepository.findByTelegramId(request.getTelegramId())
                .orElseThrow(() -> new RuntimeException("User not found"));
                
        String token = jwtService.generateToken(user);
        
        return AuthResponse.builder()
                .token(token)
                .user(user.toDto())
                .message("Telegram auth successful")
                .build();
    }
} 