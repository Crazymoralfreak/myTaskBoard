package com.yourapp.controller;

import com.yourapp.model.User;
import com.yourapp.service.UserService;
import com.yourapp.dto.UserProfileUpdateDto;
import com.yourapp.dto.UserDto;
import com.yourapp.dto.AvatarUpdateDto;
import com.yourapp.security.JwtTokenProvider;
import com.yourapp.dto.ChangePasswordRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.io.File;
import java.util.HashMap;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;

import io.jsonwebtoken.JwtException;

@RestController
@RequestMapping("/api/users")
public class UserController {
    private static final Logger log = LoggerFactory.getLogger(UserController.class);

    @Autowired
    private UserService userService;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    @Value("${app.upload.path}")
    private String uploadPath;

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
    public ResponseEntity<?> changePassword(@RequestBody ChangePasswordRequest request, 
                                         @RequestHeader("Authorization") String token) {
        try {
            log.info("Получен запрос на изменение пароля");
            
            if (token == null || !token.startsWith("Bearer ")) {
                log.warn("Неверный формат токена: {}", token);
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "Неверный формат токена"));
            }
            
            // Извлекаем токен
            String tokenValue = token.substring(7); // Удаляем "Bearer " из токена
            log.debug("Токен для проверки: {}", tokenValue.substring(0, Math.min(20, tokenValue.length())) + "...");
            
            // Проверяем валидность токена
            if (!jwtTokenProvider.validateToken(tokenValue)) {
                log.warn("Токен недействителен");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "Токен авторизации недействителен"));
            }
            
            // Получаем идентификатор пользователя из токена (может быть email или username)
            String userIdentifier = jwtTokenProvider.getUsernameFromToken(tokenValue);
            log.debug("Идентификатор пользователя из токена: {}", userIdentifier);
            
            // Пробуем найти пользователя по email
            Optional<User> userOptional = userService.getUserByEmail(userIdentifier);
            
            // Если не найден по email, пробуем по username
            if (!userOptional.isPresent()) {
                userOptional = userService.findByUsername(userIdentifier);
            }
            
            // Если пользователь не найден
            if (!userOptional.isPresent()) {
                log.error("Пользователь не найден ни по email, ни по username: {}", userIdentifier);
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "Пользователь не найден"));
            }
            
            User user = userOptional.get();
            log.info("Найден пользователь: {} ({})", user.getUsername(), user.getEmail());
            
            // Изменяем пароль
            userService.changePassword(user.getEmail(), request.getCurrentPassword(), request.getNewPassword());
            
            Map<String, String> response = new HashMap<>();
            response.put("message", "Пароль успешно изменен");
            
            log.info("Пароль успешно изменен для пользователя: {}", user.getEmail());
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            log.warn("Ошибка валидации при смене пароля: {}", e.getMessage());
            Map<String, String> response = new HashMap<>();
            response.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        } catch (UsernameNotFoundException e) {
            log.warn("Пользователь не найден: {}", e.getMessage());
            Map<String, String> response = new HashMap<>();
            response.put("error", "Пользователь не найден");
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        } catch (JwtException e) {
            log.error("Ошибка JWT при смене пароля: {}", e.getMessage());
            Map<String, String> response = new HashMap<>();
            response.put("error", "Ошибка проверки токена: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        } catch (Exception e) {
            log.error("Непредвиденная ошибка при смене пароля", e);
            Map<String, String> response = new HashMap<>();
            response.put("error", "Произошла неожиданная ошибка: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * Обновление только аватара пользователя
     */
    @PutMapping("/profile/avatar")
    public ResponseEntity<?> updateUserAvatar(@RequestBody AvatarUpdateDto avatarDto) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null || !authentication.isAuthenticated()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(
                    "error", "Unauthorized",
                    "message", "Authentication required"
                ));
            }
            
            String currentUsername = authentication.getName();
            Logger logger = LoggerFactory.getLogger(UserController.class);
            logger.debug("Обновление аватара для пользователя: {}", currentUsername);
            
            // Пробуем найти пользователя по email или username
            Optional<User> userOptional = userService.findByUsername(currentUsername);
            if (!userOptional.isPresent()) {
                userOptional = userService.getUserByEmail(currentUsername);
            }
            
            if (!userOptional.isPresent()) {
                logger.error("Пользователь не найден: {}", currentUsername);
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                    "error", "Not Found",
                    "message", "User not found"
                ));
            }
            
            User user = userOptional.get();
            logger.debug("Найден пользователь ID: {}", user.getId());
            
            // Создаем новый объект для обновления только аватара
            User userToUpdate = new User();
            userToUpdate.setId(user.getId());
            userToUpdate.setAvatarUrl(avatarDto.getAvatarUrl());
            
            // Все остальные поля оставляем без изменений
            User updatedUser = userService.updateUser(user.getId(), userToUpdate);
            
            return ResponseEntity.ok(updatedUser.toDto());
        } catch (Exception e) {
            Logger logger = LoggerFactory.getLogger(UserController.class);
            logger.error("Ошибка при обновлении аватара", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "error", "Internal Server Error",
                "message", e.getMessage()
            ));
        }
    }

    /**
     * Загрузка аватара в виде файла
     */
    @PostMapping("/profile/avatar/upload")
    public ResponseEntity<?> uploadAvatar(@RequestParam("file") MultipartFile file) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null || !authentication.isAuthenticated()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(
                    "error", "Unauthorized",
                    "message", "Authentication required"
                ));
            }
            
            String currentUsername = authentication.getName();
            Logger logger = LoggerFactory.getLogger(UserController.class);
            logger.debug("Загрузка аватара для пользователя: {}", currentUsername);
            
            // Проверяем, что файл не пустой
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "error", "Bad Request",
                    "message", "Empty file"
                ));
            }
            
            // Проверяем тип файла
            String contentType = file.getContentType();
            if (contentType == null || !contentType.startsWith("image/")) {
                return ResponseEntity.badRequest().body(Map.of(
                    "error", "Bad Request",
                    "message", "File must be an image"
                ));
            }
            
            // Пробуем найти пользователя по email или username
            Optional<User> userOptional = userService.findByUsername(currentUsername);
            if (!userOptional.isPresent()) {
                userOptional = userService.getUserByEmail(currentUsername);
            }
            
            if (!userOptional.isPresent()) {
                logger.error("Пользователь не найден: {}", currentUsername);
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                    "error", "Not Found",
                    "message", "User not found"
                ));
            }
            
            User user = userOptional.get();
            
            // Получаем расширение файла
            String originalFilename = file.getOriginalFilename();
            String extension = "";
            if (originalFilename != null && originalFilename.contains(".")) {
                extension = originalFilename.substring(originalFilename.lastIndexOf("."));
            } else {
                // Получаем расширение из типа контента
                if (contentType.equals("image/jpeg") || contentType.equals("image/jpg")) {
                    extension = ".jpg";
                } else if (contentType.equals("image/png")) {
                    extension = ".png";
                } else if (contentType.equals("image/gif")) {
                    extension = ".gif";
                } else if (contentType.equals("image/svg+xml")) {
                    extension = ".svg";
                } else {
                    extension = ".jpg"; // По умолчанию
                }
            }
            
            // Создаем уникальное имя файла
            String fileName = "avatar_" + user.getId() + "_" + System.currentTimeMillis() + extension;
            
            // Создаем директорию если она не существует
            File uploadDir = new File(uploadPath + "/avatars");
            if (!uploadDir.exists()) {
                uploadDir.mkdirs();
            }
            
            // Сохраняем файл
            File destFile = new File(uploadDir.getAbsolutePath() + File.separator + fileName);
            file.transferTo(destFile);
            
            // URL для доступа к аватару
            String avatarUrl = "/uploads/avatars/" + fileName;
            
            // Обновляем пользователя
            User userToUpdate = new User();
            userToUpdate.setId(user.getId());
            userToUpdate.setAvatarUrl(avatarUrl);
            
            User updatedUser = userService.updateUser(user.getId(), userToUpdate);
            
            return ResponseEntity.ok(Map.of(
                "avatarUrl", avatarUrl,
                "message", "Avatar updated successfully"
            ));
        } catch (Exception e) {
            Logger logger = LoggerFactory.getLogger(UserController.class);
            logger.error("Ошибка при загрузке аватара", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "error", "Internal Server Error",
                "message", e.getMessage()
            ));
        }
    }
}