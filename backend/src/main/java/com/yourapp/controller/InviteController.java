package com.yourapp.controller;

import com.yourapp.dto.JoinBoardByInviteResponse;
import com.yourapp.service.InviteLinkService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

/**
 * Контроллер для обработки присоединения по ссылке-приглашению
 */
@RestController
@RequestMapping("/api/invite")
@RequiredArgsConstructor
public class InviteController {
    private final InviteLinkService inviteLinkService;
    
    /**
     * Обрабатывает присоединение к доске по ссылке-приглашению
     * @param token токен приглашения
     * @param request HTTP-запрос
     * @return ответ с информацией о доске
     */
    @PostMapping("/{token}")
    public ResponseEntity<JoinBoardByInviteResponse> joinByInviteLink(
            @PathVariable String token,
            HttpServletRequest request) {
        
        Long currentUserId = getCurrentUserId();
        JoinBoardByInviteResponse response = inviteLinkService.joinByInviteLink(token, currentUserId, request);
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * Получает информацию о ссылке-приглашении
     * @param token токен приглашения
     * @param request HTTP-запрос
     * @return ответ с информацией о доске
     */
    @GetMapping("/{token}")
    public ResponseEntity<JoinBoardByInviteResponse> getInviteLinkInfo(
            @PathVariable String token,
            HttpServletRequest request) {
        
        // Для неаутентифицированных пользователей можно реализовать специальную логику
        if (SecurityContextHolder.getContext().getAuthentication() == null) {
            return ResponseEntity.ok(
                    JoinBoardByInviteResponse.builder()
                            .requiresAuthentication(true)
                            .build()
            );
        }
        
        Long currentUserId = getCurrentUserId();
        JoinBoardByInviteResponse response = inviteLinkService.joinByInviteLink(token, currentUserId, request);
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * Получает ID текущего пользователя из контекста безопасности
     * @return ID пользователя
     */
    private Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null) {
            throw new IllegalStateException("Пользователь не аутентифицирован");
        }
        return Long.parseLong(authentication.getName());
    }
} 