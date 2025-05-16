package com.yourapp.controller;

import com.yourapp.dto.BoardInviteLinkDTO;
import com.yourapp.dto.CreateInviteLinkRequest;
import com.yourapp.service.InviteLinkService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Контроллер для работы с ссылками-приглашениями
 */
@RestController
@RequestMapping("/api/boards/{boardId}/invite-links")
@RequiredArgsConstructor
public class BoardInviteLinkController {
    private final InviteLinkService inviteLinkService;
    
    /**
     * Создает новую ссылку-приглашение для доски
     * @param boardId ID доски
     * @param request запрос на создание ссылки
     * @return созданная ссылка-приглашение
     */
    @PostMapping
    public ResponseEntity<BoardInviteLinkDTO> createInviteLink(
            @PathVariable String boardId,
            @Valid @RequestBody CreateInviteLinkRequest request) {
        
        Long currentUserId = getCurrentUserId();
        BoardInviteLinkDTO inviteLink = inviteLinkService.createInviteLink(boardId, currentUserId, request);
        
        return ResponseEntity.status(HttpStatus.CREATED).body(inviteLink);
    }
    
    /**
     * Получает все активные ссылки-приглашения для доски
     * @param boardId ID доски
     * @return список ссылок-приглашений
     */
    @GetMapping
    public ResponseEntity<List<BoardInviteLinkDTO>> getBoardInviteLinks(@PathVariable String boardId) {
        List<BoardInviteLinkDTO> inviteLinks = inviteLinkService.getBoardInviteLinks(boardId);
        return ResponseEntity.ok(inviteLinks);
    }
    
    /**
     * Деактивирует ссылку-приглашение
     * @param boardId ID доски
     * @param linkId ID ссылки
     * @return ответ без содержимого
     */
    @DeleteMapping("/{linkId}")
    public ResponseEntity<Void> deactivateInviteLink(
            @PathVariable String boardId,
            @PathVariable Long linkId) {
        
        Long currentUserId = getCurrentUserId();
        inviteLinkService.deactivateInviteLink(linkId, currentUserId);
        
        return ResponseEntity.noContent().build();
    }
    
    /**
     * Получает ID текущего пользователя из контекста безопасности
     * @return ID пользователя
     */
    private Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return Long.parseLong(authentication.getName());
    }
} 