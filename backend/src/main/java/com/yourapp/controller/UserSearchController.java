package com.yourapp.controller;

import com.yourapp.dto.UserDTO;
import com.yourapp.service.UserSearchService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import lombok.RequiredArgsConstructor;

import java.util.List;

/**
 * Контроллер для поиска пользователей
 */
@RestController
@RequestMapping("/api/users/search")
@RequiredArgsConstructor
public class UserSearchController {
    private final UserSearchService userSearchService;
    private static final int DEFAULT_LIMIT = 10;
    
    /**
     * Универсальный поиск пользователей
     * @param query строка поиска
     * @param searchType тип поиска ("username", "email", или null для поиска по обоим полям)
     * @param limit максимальное количество результатов
     * @return список пользователей
     */
    @GetMapping
    public ResponseEntity<List<UserDTO>> searchUsers(
            @RequestParam String query,
            @RequestParam(required = false) String searchType,
            @RequestParam(required = false, defaultValue = "10") int limit) {
        
        // Ограничиваем максимальное количество результатов
        int actualLimit = Math.min(limit, 50);
        
        List<UserDTO> users = userSearchService.findByQuery(query, searchType, actualLimit);
        return ResponseEntity.ok(users);
    }
    
    /**
     * Поиск пользователей по имени пользователя
     * @param username имя пользователя
     * @return список пользователей
     */
    @GetMapping("/by-username")
    public ResponseEntity<List<UserDTO>> searchUsersByUsername(@RequestParam String username) {
        List<UserDTO> users = userSearchService.findByUsername(username, DEFAULT_LIMIT);
        return ResponseEntity.ok(users);
    }
    
    /**
     * Поиск пользователей по email
     * @param email email
     * @return список пользователей
     */
    @GetMapping("/by-email")
    public ResponseEntity<List<UserDTO>> searchUsersByEmail(@RequestParam String email) {
        List<UserDTO> users = userSearchService.findByEmail(email, DEFAULT_LIMIT);
        return ResponseEntity.ok(users);
    }
} 