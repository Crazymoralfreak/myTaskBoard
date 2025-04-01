package com.yourapp.controller;

import com.yourapp.model.TaskStatus;
import com.yourapp.model.TaskType;
import com.yourapp.service.BoardService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import com.yourapp.model.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import com.yourapp.dto.TaskStatusDto;
import com.yourapp.dto.TaskTypeDto;
import java.util.stream.Collectors;

import java.util.List;
import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping(
    value = "/api/boards/{boardId}/entities",
    produces = MediaType.APPLICATION_JSON_VALUE
)
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class BoardEntityController {
    private static final Logger logger = LoggerFactory.getLogger(BoardEntityController.class);
    private final BoardService boardService;

    // Статусы задач
    @GetMapping("/statuses")
    public ResponseEntity<List<TaskStatusDto>> getBoardStatuses(@PathVariable Long boardId) {
        List<TaskStatus> statuses = boardService.getBoardStatuses(boardId);
        List<TaskStatusDto> statusDtos = statuses.stream()
                .map(TaskStatusDto::fromEntity)
                .collect(Collectors.toList());
        return ResponseEntity.ok(statusDtos);
    }

    @PostMapping(value = "/statuses")
    public ResponseEntity<?> createTaskStatus(
        @PathVariable Long boardId,
        @RequestBody TaskStatusDto statusDto,
        @AuthenticationPrincipal User currentUser,
        @RequestHeader(value = "Content-Type", required = false) String contentType
    ) {
        try {
            logger.debug("Получен запрос на создание статуса задачи, ContentType: {}", contentType);
            logger.debug("Данные статуса: {}", statusDto);
            
            if (currentUser == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(
                    Map.of("message", "User not authenticated")
                );
            }
            
            TaskStatus status = new TaskStatus();
            status.setName(statusDto.getName());
            status.setColor(statusDto.getColor());
            status.setPosition(statusDto.getPosition());
            status.setDefault(statusDto.isDefault());
            status.setCustom(statusDto.isCustom());
            
            TaskStatus createdStatus = boardService.createTaskStatus(boardId, status);
            logger.debug("Статус задачи успешно создан: {}", createdStatus);
            return ResponseEntity.ok(TaskStatusDto.fromEntity(createdStatus));
        } catch (Exception e) {
            logger.error("Failed to create task status", e);
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @PutMapping(value = "/statuses/{statusId}")
    public ResponseEntity<?> updateTaskStatus(
        @PathVariable Long boardId,
        @PathVariable Long statusId,
        @RequestBody TaskStatusDto statusDto,
        @AuthenticationPrincipal User currentUser
    ) {
        try {
            logger.debug("Получен запрос на обновление статуса задачи: {}", statusDto);
            
            if (currentUser == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(
                    Map.of("message", "User not authenticated")
                );
            }
            
            TaskStatus existingStatus = boardService.getTaskStatusById(statusId);
            if (existingStatus == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(
                    Map.of("message", "Status not found")
                );
            }
            
            // Обновляем существующий объект вместо создания нового
            existingStatus.setName(statusDto.getName());
            existingStatus.setColor(statusDto.getColor());
            
            // Обновляем позицию только если она явно указана
            if (statusDto.getPosition() != null) {
                existingStatus.setPosition(statusDto.getPosition());
            }
            
            // Обновляем флаги
            existingStatus.setDefault(statusDto.isDefault());
            existingStatus.setCustom(statusDto.isCustom());
            
            TaskStatus updatedStatus = boardService.updateTaskStatus(boardId, statusId, existingStatus);
            logger.debug("Статус задачи успешно обновлен: {}", updatedStatus);
            return ResponseEntity.ok(TaskStatusDto.fromEntity(updatedStatus));
        } catch (Exception e) {
            logger.error("Failed to update task status", e);
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @DeleteMapping("/statuses/{statusId}")
    public ResponseEntity<?> deleteTaskStatus(
        @PathVariable Long boardId,
        @PathVariable Long statusId,
        @AuthenticationPrincipal User currentUser,
        @RequestHeader(value = "Content-Type", required = false) String contentType
    ) {
        try {
            logger.debug("Получен запрос на удаление статуса задачи: {}", statusId);
            logger.debug("Content-Type заголовок: {}", contentType);
            
            if (currentUser == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(
                    Map.of("message", "User not authenticated")
                );
            }
            
            boardService.deleteTaskStatus(boardId, statusId);
            return ResponseEntity.ok(Map.of("message", "Status deleted successfully"));
        } catch (Exception e) {
            logger.error("Failed to delete task status", e);
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    // Типы задач
    @GetMapping("/types")
    public ResponseEntity<List<TaskTypeDto>> getBoardTaskTypes(@PathVariable Long boardId) {
        List<TaskType> types = boardService.getBoardTaskTypes(boardId);
        List<TaskTypeDto> typeDtos = types.stream()
                .map(TaskTypeDto::fromEntity)
                .collect(Collectors.toList());
        return ResponseEntity.ok(typeDtos);
    }

    @PostMapping(value = "/types")
    public ResponseEntity<?> createTaskType(
        @PathVariable Long boardId,
        @RequestBody TaskTypeDto typeDto,
        @AuthenticationPrincipal User currentUser,
        @RequestHeader(value = "Content-Type", required = false) String contentType
    ) {
        try {
            logger.debug("Получен запрос на создание типа задачи, ContentType: {}", contentType);
            logger.debug("Данные типа: {}", typeDto);
            
            if (currentUser == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(
                    Map.of("message", "User not authenticated")
                );
            }
            
            TaskType type = new TaskType();
            type.setName(typeDto.getName());
            type.setColor(typeDto.getColor());
            type.setIcon(typeDto.getIcon());
            type.setPosition(typeDto.getPosition());
            type.setDefault(typeDto.isDefault());
            type.setCustom(typeDto.isCustom());
            
            TaskType createdType = boardService.createTaskType(boardId, type);
            logger.debug("Тип задачи успешно создан: {}", createdType);
            return ResponseEntity.ok(TaskTypeDto.fromEntity(createdType));
        } catch (Exception e) {
            logger.error("Failed to create task type", e);
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @PutMapping(value = "/types/{typeId}")
    public ResponseEntity<?> updateTaskType(
        @PathVariable Long boardId,
        @PathVariable Long typeId,
        @RequestBody TaskTypeDto typeDto,
        @AuthenticationPrincipal User currentUser,
        @RequestHeader(value = "Content-Type", required = false) String contentType
    ) {
        try {
            logger.debug("Получен запрос на обновление типа задачи, ContentType: {}", contentType);
            logger.debug("Данные типа: {}", typeDto);
            
            if (currentUser == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(
                    Map.of("message", "User not authenticated")
                );
            }
            
            TaskType existingType = boardService.getTaskTypeById(typeId);
            if (existingType == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(
                    Map.of("message", "Type not found")
                );
            }
            
            // Обновляем существующий объект вместо создания нового
            existingType.setName(typeDto.getName());
            existingType.setColor(typeDto.getColor());
            
            // Обновляем иконку, если она указана
            if (typeDto.getIcon() != null && !typeDto.getIcon().isEmpty()) {
                existingType.setIcon(typeDto.getIcon());
            }
            
            // Обновляем позицию только если она явно указана
            if (typeDto.getPosition() != null) {
                existingType.setPosition(typeDto.getPosition());
            }
            
            // Обновляем флаги
            existingType.setDefault(typeDto.isDefault());
            existingType.setCustom(typeDto.isCustom());
            
            TaskType updatedType = boardService.updateTaskType(boardId, typeId, existingType);
            logger.debug("Тип задачи успешно обновлен: {}", updatedType);
            return ResponseEntity.ok(TaskTypeDto.fromEntity(updatedType));
        } catch (Exception e) {
            logger.error("Failed to update task type", e);
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @DeleteMapping("/types/{typeId}")
    public ResponseEntity<?> deleteTaskType(
        @PathVariable Long boardId,
        @PathVariable Long typeId,
        @AuthenticationPrincipal User currentUser,
        @RequestHeader(value = "Content-Type", required = false) String contentType
    ) {
        try {
            logger.debug("Получен запрос на удаление типа задачи: {}", typeId);
            logger.debug("Content-Type заголовок: {}", contentType);
            
            if (currentUser == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(
                    Map.of("message", "User not authenticated")
                );
            }
            
            boardService.deleteTaskType(boardId, typeId);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            logger.error("Failed to delete task type", e);
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }
} 