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
import com.yourapp.exception.ResourceNotFoundException;
import java.util.stream.Collectors;
import com.yourapp.model.Role;
import com.yourapp.model.BoardMember;

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

    @PutMapping(value = "/{id}", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Board> updateBoard(@PathVariable String id, @RequestBody Board boardDetails) {
        return ResponseEntity.ok(boardService.updateBoard(id, boardDetails));
    }

    @PostMapping("/{boardId}/columns")
    public ResponseEntity<Board> addColumn(
        @PathVariable String boardId,
        @RequestBody Map<String, String> payload,
        @AuthenticationPrincipal User user
    ) {
        BoardColumn column = new BoardColumn();
        column.setName(payload.get("name"));
        column.setPosition(0); // Позиция по умолчанию
        column.setColor(payload.get("color") != null ? payload.get("color") : "#E0E0E0"); // Устанавливаем цвет

        return ResponseEntity.ok(boardService.addColumnToBoard(boardId, column));
    }

    @DeleteMapping(value = "/{boardId}/columns/{columnId}", consumes = MediaType.APPLICATION_JSON_VALUE)
    public Board removeColumn(@PathVariable String boardId, @PathVariable Long columnId) {
        return boardService.removeColumnFromBoard(boardId, columnId);
    }

    @PatchMapping("/{boardId}/columns/{columnId}/move/{newPosition}")
    public ResponseEntity<?> moveColumn(
        @PathVariable String boardId,
        @PathVariable Long columnId,
        @PathVariable int newPosition
    ) {
        try {
            logger.debug("Перемещение колонки {} в позицию {} на доске {}", columnId, newPosition, boardId);
            
            // Получаем доску для проверки корректности позиции
            Board board = boardService.getBoardById(boardId);
            int columnsCount = board.getColumns().size();
            
            logger.debug("Текущие колонки на доске: {}", 
                board.getColumns().stream()
                    .map(c -> String.format("id:%d, name:%s, position:%d", c.getId(), c.getName(), c.getPosition()))
                    .collect(Collectors.joining(", ")));
            
            // Проверяем, есть ли колонка на доске
            boolean columnExists = board.getColumns().stream()
                .anyMatch(c -> c.getId().equals(columnId));
                
            if (!columnExists) {
                logger.error("Колонка с ID {} не найдена на доске {}", columnId, boardId);
                Map<String, String> error = new HashMap<>();
                error.put("message", String.format("Column with ID %d not found on board %s", columnId, boardId));
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
            }
            
            // Проверяем, что новая позиция в допустимом диапазоне
            if (newPosition < 0 || newPosition >= columnsCount) {
                logger.error("Недопустимая позиция {}, допустимый диапазон: 0-{}", newPosition, columnsCount - 1);
                Map<String, String> error = new HashMap<>();
                error.put("message", String.format("Invalid position: %d, valid range: 0-%d", newPosition, columnsCount - 1));
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
            }
            
            Board result = boardService.moveColumnInBoard(boardId, columnId, newPosition);
            logger.debug("Колонка успешно перемещена");
            logger.debug("Колонки после перемещения: {}", 
                result.getColumns().stream()
                    .map(c -> String.format("id:%d, name:%s, position:%d", c.getId(), c.getName(), c.getPosition()))
                    .collect(Collectors.joining(", ")));
                    
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            logger.error("Ошибка при перемещении колонки: {}", e.getMessage());
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        } catch (ResourceNotFoundException e) {
            logger.error("Ресурс не найден: {}", e.getMessage());
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
        } catch (Exception e) {
            logger.error("Ошибка при перемещении колонки", e);
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @PatchMapping("/{id}/archive")
    public Board archiveBoard(@PathVariable String id) {
        return boardService.archiveBoard(id);
    }

    @PatchMapping("/{id}/restore")
    public ResponseEntity<Board> restoreBoard(@PathVariable String id) {
        return ResponseEntity.ok(boardService.unarchiveBoard(id));
    }

    @DeleteMapping(value = "/{id}", consumes = MediaType.APPLICATION_JSON_VALUE)
    public void deleteBoard(@PathVariable String id) {
        boardService.deleteBoard(id);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Board> getBoard(@PathVariable String id, @AuthenticationPrincipal User user) {
        logger.info("Запрос на получение доски с ID: {}, пользователь: {}", id, user != null ? user.getUsername() : "null");
        
        try {
            Board board = boardService.getBoard(id);
            
            // В DTO добавляем флаг, является ли текущий пользователь владельцем
            boolean isOwner = user != null && board.getOwner() != null && board.getOwner().getId().equals(user.getId());
            logger.info("Доска найдена. Владелец: {}. Текущий пользователь - владелец: {}", 
                       board.getOwner() != null ? board.getOwner().getUsername() : "null", isOwner);
            
            // Проверяем, является ли пользователь участником с ролью ADMIN
            boolean isAdmin = isOwner; // По умолчанию владелец всегда админ
            String roleName = "ADMIN"; // Значение по умолчанию для владельца
            Long roleId = null;
            
            if (user != null) {
                if (isOwner) {
                    // Если пользователь владелец, ищем системную роль ADMIN
                    try {
                        Role adminRole = boardService.getRoleService().getSystemRoleByName("ADMIN");
                        roleId = adminRole.getId();
                    } catch (Exception e) {
                        logger.warn("Не удалось найти системную роль ADMIN: {}", e.getMessage());
                    }
                } else {
                    // Если пользователь не владелец, получаем его роль
                    try {
                        BoardMember boardMember = boardService.getBoardMember(id, user.getId());
                        if (boardMember != null && boardMember.getRole() != null) {
                            roleName = boardMember.getRole().getName();
                            roleId = boardMember.getRole().getId();
                            isAdmin = "ADMIN".equalsIgnoreCase(roleName);
                            logger.info("Пользователь {} имеет роль {} на доске {}", 
                                user.getUsername(), roleName, id);
                        } else {
                            logger.info("Пользователь {} не является участником доски {}", 
                                user.getUsername(), id);
                            roleName = null; // Нет роли, если не участник
                        }
                    } catch (Exception e) {
                        logger.warn("Ошибка при получении роли пользователя: {}", e.getMessage());
                        roleName = null;
                    }
                }
            }
            
            // Добавляем информацию о текущем пользователе в объект доски
            Map<String, Object> currentUserInfo = new HashMap<>();
            currentUserInfo.put("id", user != null ? user.getId() : 0);
            currentUserInfo.put("isAdmin", isAdmin); // Оставляем для обратной совместимости
            currentUserInfo.put("role", roleName); // Добавляем название роли
            if (roleId != null) {
                currentUserInfo.put("roleId", roleId); // Добавляем ID роли, если доступен
            }
            board.setAdditionalProperty("currentUser", currentUserInfo);
            
            return ResponseEntity.ok(board);
        } catch (Exception e) {
            logger.error("Ошибка при получении доски с ID: {}", id, e);
            throw e;
        }
    }

    @PutMapping("/{boardId}/columns/{columnId}")
    public ResponseEntity<Board> updateColumn(
        @PathVariable String boardId,
        @PathVariable Long columnId,
        @RequestBody Map<String, String> updates,
        @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.ok(boardService.updateColumn(boardId, columnId, updates.get("name"), updates.get("color")));
    }

    @PatchMapping(value = "/{id}", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Board> partialUpdateBoard(
        @PathVariable String id,
        @RequestBody Map<String, String> updates,
        @AuthenticationPrincipal User user
    ) {
        Board currentBoard = boardService.getBoardById(id);
        
        // Обновляем только предоставленные поля
        if (updates.containsKey("name")) {
            currentBoard.setName(updates.get("name"));
        }
        
        if (updates.containsKey("description")) {
            currentBoard.setDescription(updates.get("description"));
        }
        
        Board updatedBoard = boardService.updateBoard(id, currentBoard);
        return ResponseEntity.ok(updatedBoard);
    }
}