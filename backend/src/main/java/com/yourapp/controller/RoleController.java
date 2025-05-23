package com.yourapp.controller;

import com.yourapp.dto.RoleDTO;
import com.yourapp.exception.EntityNotFoundException;
import com.yourapp.model.Board;
import com.yourapp.repository.BoardRepository;
import com.yourapp.service.RoleService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import lombok.RequiredArgsConstructor;

import java.util.List;

/**
 * Контроллер для работы с ролями
 */
@RestController
@RequestMapping("/api/roles")
@RequiredArgsConstructor
public class RoleController {
    private final RoleService roleService;
    private final BoardRepository boardRepository;
    
    /**
     * Получает список всех системных ролей
     * @return список ролей
     */
    @GetMapping
    public ResponseEntity<List<RoleDTO>> getAllSystemRoles() {
        return ResponseEntity.ok(roleService.getAllSystemRoles());
    }
    
    /**
     * Получает список всех ролей для доски (системные + доски)
     * @param boardId ID доски
     * @return список ролей
     */
    @GetMapping("/boards/{boardId}")
    public ResponseEntity<List<RoleDTO>> getBoardRoles(@PathVariable String boardId) {
        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new EntityNotFoundException("Доска с ID " + boardId + " не найдена"));
                
        return ResponseEntity.ok(roleService.getBoardRoles(board));
    }
} 