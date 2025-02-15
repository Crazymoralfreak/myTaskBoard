package com.yourapp.controller;

import com.yourapp.model.AuthRequest;
import com.yourapp.model.AuthResponse;
import com.yourapp.model.RegisterRequest;
import com.yourapp.model.TelegramAuthRequest;
import com.yourapp.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
    
    private final AuthService authService;
    
    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        return ResponseEntity.ok(response);
    }
    
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody AuthRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }
    
    @PostMapping("/telegram")
    public ResponseEntity<AuthResponse> telegramAuth(@RequestBody TelegramAuthRequest request) {
        return ResponseEntity.ok(authService.telegramAuth(request));
    }
} 