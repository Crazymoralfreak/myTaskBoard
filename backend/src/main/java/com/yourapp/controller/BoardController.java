package com.yourapp.controller;

import com.yourapp.model.Board;
import com.yourapp.model.Column;
import com.yourapp.service.BoardService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import com.yourapp.model.User;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/boards")
@RequiredArgsConstructor
public class BoardController {
    private static final Logger logger = LoggerFactory.getLogger(BoardController.class);
    private final BoardService boardService;

    @PostMapping
    public ResponseEntity<?> createBoard(
        @RequestBody Board board,
        @AuthenticationPrincipal User currentUser
    ) {
        try {
            if (currentUser == null) {
                logger.error("Current user is null");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(
                    Map.of("message", "User not authenticated")
                );
            }
            
            logger.debug("Creating board: {} for user: {}", board.getName(), currentUser.getEmail());
            board.setOwner(currentUser);
            Board createdBoard = boardService.createBoard(board);
            return ResponseEntity.ok(createdBoard);
        } catch (Exception e) {
            logger.error("Failed to create board", e);
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @GetMapping("/user/{userId}")
    public List<Board> getUserBoards(@PathVariable Long userId) {
        return boardService.getUserBoards(userId);
    }

    @PutMapping("/{id}")
    public Board updateBoard(@PathVariable Long id, @RequestBody Board board) {
        return boardService.updateBoard(id, board);
    }

    @PostMapping("/{boardId}/columns")
    public Board addColumn(@PathVariable Long boardId, @RequestBody Column column) {
        return boardService.addColumnToBoard(boardId, column);
    }

    @DeleteMapping("/{boardId}/columns/{columnId}")
    public Board removeColumn(@PathVariable Long boardId, @PathVariable Long columnId) {
        return boardService.removeColumnFromBoard(boardId, columnId);
    }

    @PatchMapping("/{boardId}/columns/{columnId}/move/{newPosition}")
    public Board moveColumn(
        @PathVariable Long boardId,
        @PathVariable Long columnId,
        @PathVariable int newPosition
    ) {
        return boardService.moveColumnInBoard(boardId, columnId, newPosition);
    }

    @PatchMapping("/{id}/archive")
    public Board archiveBoard(@PathVariable Long id) {
        return boardService.archiveBoard(id);
    }

    @PatchMapping("/{id}/restore")
    public ResponseEntity<Board> restoreBoard(@PathVariable Long id) {
        return ResponseEntity.ok(boardService.unarchiveBoard(id));
    }

    @DeleteMapping("/{id}")
    public void deleteBoard(@PathVariable Long id) {
        boardService.deleteBoard(id);
    }
}