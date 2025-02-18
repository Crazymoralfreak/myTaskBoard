package com.yourapp.controller;

import com.yourapp.model.Board;
import com.yourapp.model.BoardColumn;
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
import org.springframework.http.MediaType;
import com.yourapp.dto.CreateBoardRequest;

@RestController
@RequestMapping(
    value = "/api/boards",
    produces = MediaType.APPLICATION_JSON_VALUE
)
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class BoardController {
    private static final Logger logger = LoggerFactory.getLogger(BoardController.class);
    private final BoardService boardService;

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> createBoard(
        @RequestBody CreateBoardRequest request,
        @AuthenticationPrincipal User currentUser
    ) {
        try {
            if (currentUser == null) {
                logger.error("Current user is null");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(
                    Map.of("message", "User not authenticated")
                );
            }
            
            logger.debug("Creating board: {} for user: {}", request.getName(), currentUser.getEmail());
            Board board = new Board();
            board.setName(request.getName());
            board.setDescription(request.getDescription());
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
    public ResponseEntity<Board> addColumn(
        @PathVariable Long boardId,
        @RequestBody Map<String, String> payload,
        @AuthenticationPrincipal User user
    ) {
        BoardColumn column = new BoardColumn();
        column.setName(payload.get("name"));
        column.setPosition(0); // Позиция по умолчанию

        Board board = boardService.getBoardById(boardId);
        if (!board.getOwner().getId().equals(user.getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        return ResponseEntity.ok(boardService.addColumnToBoard(boardId, column));
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

    @GetMapping("/{id}")
    public ResponseEntity<Board> getBoard(@PathVariable Long id, @AuthenticationPrincipal User user) {
        Board board = boardService.getBoardById(id);
        
        // Проверяем, является ли пользователь владельцем доски
        if (!board.getOwner().getId().equals(user.getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        
        return ResponseEntity.ok(board);
    }

    @PutMapping("/{boardId}/columns/{columnId}")
    public ResponseEntity<Board> updateColumn(
        @PathVariable Long boardId,
        @PathVariable Long columnId,
        @RequestBody Map<String, String> updates,
        @AuthenticationPrincipal User user
    ) {
        Board board = boardService.getBoardById(boardId);
        if (!board.getOwner().getId().equals(user.getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        return ResponseEntity.ok(boardService.updateColumn(boardId, columnId, updates.get("name")));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<Board> updateBoardDetails(
        @PathVariable Long id,
        @RequestBody Map<String, String> updates,
        @AuthenticationPrincipal User user
    ) {
        Board board = boardService.getBoardById(id);
        if (!board.getOwner().getId().equals(user.getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        board.setName(updates.get("name"));
        board.setDescription(updates.get("description"));
        return ResponseEntity.ok(boardService.updateBoard(id, board));
    }
}