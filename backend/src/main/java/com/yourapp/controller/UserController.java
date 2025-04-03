package com.yourapp.controller;

import com.yourapp.model.User;
import com.yourapp.service.UserService;
import com.yourapp.dto.UserProfileUpdateDto;
import com.yourapp.dto.PasswordChangeDto;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/users")
public class UserController {
    @Autowired
    private UserService userService;

    @GetMapping
    public List<User> getAllUsers() {
        return userService.getAllUsers();
    }

    @GetMapping("/{id}")
    public User getUserById(@PathVariable Long id) {
        return userService.getUserById(id).orElseThrow(() -> new RuntimeException("User not found"));
    }

    @PostMapping
    public User createUser(@RequestBody User user) {
        return userService.createUser(user);
    }

    @PutMapping("/{id}")
    public User updateUser(@PathVariable Long id, @RequestBody User userDetails) {
        return userService.updateUser(id, userDetails);
    }

    @DeleteMapping("/{id}")
    public void deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
    }
    
    @GetMapping("/profile")
    public ResponseEntity<?> getCurrentUserProfile() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String currentUsername = authentication.getName();
        
        // Пробуем найти пользователя по email или username
        Optional<User> userOptional = userService.findByUsername(currentUsername);
        if (!userOptional.isPresent()) {
            userOptional = userService.getUserByEmail(currentUsername);
        }
        
        return userOptional
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }
    
    @PutMapping("/profile")
    public ResponseEntity<?> updateCurrentUserProfile(@RequestBody UserProfileUpdateDto profileDto) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String currentUsername = authentication.getName();
        
        // Пробуем найти пользователя по email или username
        Optional<User> userOptional = userService.findByUsername(currentUsername);
        if (!userOptional.isPresent()) {
            userOptional = userService.getUserByEmail(currentUsername);
        }
        
        return userOptional
            .map(user -> {
                User updatedUser = new User();
                updatedUser.setId(user.getId());
                if (profileDto.getUsername() != null) {
                    updatedUser.setUsername(profileDto.getUsername());
                }
                if (profileDto.getEmail() != null) {
                    updatedUser.setEmail(profileDto.getEmail());
                }
                if (profileDto.getPhoneNumber() != null) {
                    updatedUser.setPhoneNumber(profileDto.getPhoneNumber());
                }
                if (profileDto.getPosition() != null) {
                    updatedUser.setPosition(profileDto.getPosition());
                }
                if (profileDto.getBio() != null) {
                    updatedUser.setBio(profileDto.getBio());
                }
                if (profileDto.getAvatarUrl() != null) {
                    updatedUser.setAvatarUrl(profileDto.getAvatarUrl());
                }
                
                return ResponseEntity.ok(userService.updateUser(user.getId(), updatedUser));
            })
            .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(@RequestBody PasswordChangeDto passwordDto) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String currentUsername = authentication.getName();
        
        // Пробуем найти пользователя по email или username
        Optional<User> userOptional = userService.findByUsername(currentUsername);
        if (!userOptional.isPresent()) {
            userOptional = userService.getUserByEmail(currentUsername);
        }
        
        if (!userOptional.isPresent()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Пользователь не найден");
        }
        
        try {
            boolean result = userService.changePassword(
                userOptional.get().getId(), 
                passwordDto.getCurrentPassword(), 
                passwordDto.getNewPassword()
            );
            
            if (result) {
                return ResponseEntity.ok().body(Map.of("message", "Пароль успешно изменен"));
            } else {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Текущий пароль неверен");
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Ошибка при смене пароля: " + e.getMessage());
        }
    }
}