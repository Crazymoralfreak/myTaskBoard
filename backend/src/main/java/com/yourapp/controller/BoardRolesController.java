package com.yourapp.controller;

import com.yourapp.dto.RoleDTO;
import com.yourapp.model.Board;
import com.yourapp.repository.BoardRepository;
import com.yourapp.service.RoleService;
import com.yourapp.exception.EntityNotFoundException;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import lombok.RequiredArgsConstructor;

import java.util.List;

/**
 * Контроллер для работы с ролями на уровне доски
 */
@RestController
@RequestMapping("/api/boards/{boardId}/roles")
@RequiredArgsConstructor
public class BoardRolesController {
    private final RoleService roleService;
    private final BoardRepository boardRepository;
    
    /**
     * Получает список ролей для доски
     * @param boardId ID доски
     * @return список ролей
     */
    @GetMapping
    public ResponseEntity<List<RoleDTO>> getBoardRoles(@PathVariable String boardId) {
        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new EntityNotFoundException("Доска с ID " + boardId + " не найдена"));
        
        return ResponseEntity.ok(roleService.getBoardRoles(board));
    }
} 