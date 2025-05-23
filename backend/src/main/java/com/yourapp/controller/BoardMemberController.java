package com.yourapp.controller;

import com.yourapp.dto.BoardMemberDTO;
import com.yourapp.dto.AddBoardMemberRequest;
import com.yourapp.dto.UpdateMemberRoleRequest;
import com.yourapp.service.BoardMemberService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import lombok.RequiredArgsConstructor;
import jakarta.validation.Valid;

import java.util.List;

/**
 * Контроллер для работы с участниками доски
 */
@RestController
@RequestMapping("/api/boards/{boardId}/members")
@RequiredArgsConstructor
public class BoardMemberController {
    private final BoardMemberService boardMemberService;
    
    /**
     * Добавляет пользователя к доске
     * @param boardId ID доски
     * @param request запрос на добавление пользователя
     * @return DTO добавленного участника
     */
    @PostMapping
    public ResponseEntity<BoardMemberDTO> addMemberToBoard(
            @PathVariable String boardId,
            @Valid @RequestBody AddBoardMemberRequest request) {
        
        BoardMemberDTO member = boardMemberService.addMemberToBoard(
                boardId, request.getUserId(), request.getRoleId());
        
        return ResponseEntity.ok(member);
    }
    
    /**
     * Получает список всех участников доски
     * @param boardId ID доски
     * @return список участников
     */
    @GetMapping
    public ResponseEntity<List<BoardMemberDTO>> getBoardMembers(@PathVariable String boardId) {
        return ResponseEntity.ok(boardMemberService.getBoardMembers(boardId));
    }
    
    /**
     * Обновляет роль участника доски
     * @param boardId ID доски
     * @param userId ID пользователя
     * @param request запрос на обновление роли
     * @return обновленный DTO участника
     */
    @PutMapping("/{userId}/role")
    public ResponseEntity<BoardMemberDTO> updateMemberRole(
            @PathVariable String boardId,
            @PathVariable Long userId,
            @Valid @RequestBody UpdateMemberRoleRequest request) {
        
        BoardMemberDTO member = boardMemberService.updateMemberRole(
                boardId, userId, request.getRoleId());
        
        return ResponseEntity.ok(member);
    }
    
    /**
     * Удаляет пользователя из доски
     * @param boardId ID доски
     * @param userId ID пользователя
     * @return ответ без содержимого
     */
    @DeleteMapping("/{userId}")
    public ResponseEntity<Void> removeMemberFromBoard(
            @PathVariable String boardId,
            @PathVariable Long userId) {
        
        boardMemberService.removeMemberFromBoard(boardId, userId);
        return ResponseEntity.noContent().build();
    }
} 