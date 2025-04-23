package com.yourapp.controller;

import com.yourapp.dto.TaskStatusDto;
import com.yourapp.dto.TaskTypeDto;
import com.yourapp.model.TaskStatus;
import com.yourapp.model.TaskType;
import com.yourapp.model.User;
import com.yourapp.service.BoardService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping(
    value = "/api/boards/{boardId}/entities",
    produces = "application/json"
)
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class BoardEntityController {
    private static final Logger logger = LoggerFactory.getLogger(BoardEntityController.class);
    private final BoardService boardService;

    // API для статусов задач

    @GetMapping("/statuses")
    public ResponseEntity<List<TaskStatusDto>> getBoardStatuses(@PathVariable String boardId) {
        List<TaskStatus> statuses = boardService.getBoardStatuses(boardId);
        List<TaskStatusDto> statusDtos = statuses.stream()
            .map(TaskStatusDto::fromEntity)
            .collect(Collectors.toList());
        return ResponseEntity.ok(statusDtos);
    }

    @PostMapping("/statuses")
    public ResponseEntity<TaskStatusDto> createTaskStatus(
        @PathVariable String boardId,
        @RequestBody TaskStatusDto statusDto,
        @AuthenticationPrincipal User user
    ) {
        try {
            logger.info("Создание статуса задачи для доски {}: {}", boardId, statusDto);
            
            // Проверяем обязательные поля
            if (statusDto.getName() == null || statusDto.getName().trim().isEmpty()) {
                return ResponseEntity.badRequest().build();
            }
            
            // Создаем статус
            TaskStatus status = new TaskStatus();
            status.setName(statusDto.getName());
            status.setColor(statusDto.getColor() != null ? statusDto.getColor() : "#808080");
            status.setCustom(true);
            status.setDefault(false);
            
            // Сохраняем статус
            TaskStatus createdStatus = boardService.createTaskStatus(boardId, status);
            
            return ResponseEntity.ok(TaskStatusDto.fromEntity(createdStatus));
        } catch (Exception e) {
            logger.error("Ошибка при создании статуса задачи", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PutMapping("/statuses/{statusId}")
    public ResponseEntity<TaskStatusDto> updateTaskStatus(
        @PathVariable String boardId,
        @PathVariable Long statusId,
        @RequestBody TaskStatusDto statusDto,
        @AuthenticationPrincipal User user
    ) {
        try {
            // Получаем текущий статус
            TaskStatus existingStatus = boardService.getTaskStatusById(statusId);
            
            // Проверяем, принадлежит ли статус данной доске
            if (!existingStatus.getBoard().getId().equals(boardId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            
            // Проверяем, можно ли изменить данный статус
            if (existingStatus.isDefault()) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            
            // Обновляем статус
            existingStatus.setName(statusDto.getName());
            existingStatus.setColor(statusDto.getColor());
            
            // Сохраняем обновленный статус
            TaskStatus updatedStatus = boardService.updateTaskStatus(boardId, statusId, existingStatus);
            
            return ResponseEntity.ok(TaskStatusDto.fromEntity(updatedStatus));
        } catch (Exception e) {
            logger.error("Ошибка при обновлении статуса задачи", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @DeleteMapping("/statuses/{statusId}")
    public ResponseEntity<Void> deleteTaskStatus(
        @PathVariable String boardId,
        @PathVariable Long statusId,
        @AuthenticationPrincipal User user
    ) {
        try {
            // Получаем текущий статус
            TaskStatus existingStatus = boardService.getTaskStatusById(statusId);
            
            // Проверяем, принадлежит ли статус данной доске
            if (!existingStatus.getBoard().getId().equals(boardId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            
            // Проверяем, можно ли удалить данный статус
            if (existingStatus.isDefault()) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            
            // Удаляем статус
            boardService.deleteTaskStatus(boardId, statusId);
            
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            logger.error("Ошибка при удалении статуса задачи", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // API для типов задач

    @GetMapping("/types")
    public ResponseEntity<List<TaskTypeDto>> getBoardTaskTypes(@PathVariable String boardId) {
        List<TaskType> types = boardService.getBoardTaskTypes(boardId);
        List<TaskTypeDto> typeDtos = types.stream()
            .map(TaskTypeDto::fromEntity)
            .collect(Collectors.toList());
        return ResponseEntity.ok(typeDtos);
    }

    @PostMapping("/types")
    public ResponseEntity<TaskTypeDto> createTaskType(
        @PathVariable String boardId,
        @RequestBody TaskTypeDto typeDto,
        @AuthenticationPrincipal User user
    ) {
        try {
            logger.info("Создание типа задачи для доски {}: {}", boardId, typeDto);
            
            // Проверяем обязательные поля
            if (typeDto.getName() == null || typeDto.getName().trim().isEmpty()) {
                return ResponseEntity.badRequest().build();
            }
            
            // Создаем тип
            TaskType type = new TaskType();
            type.setName(typeDto.getName());
            type.setColor(typeDto.getColor() != null ? typeDto.getColor() : "#808080");
            type.setIcon(typeDto.getIcon() != null ? typeDto.getIcon() : "task_alt");
            type.setCustom(true);
            type.setDefault(false);
            
            // Сохраняем тип
            TaskType createdType = boardService.createTaskType(boardId, type);
            
            return ResponseEntity.ok(TaskTypeDto.fromEntity(createdType));
        } catch (Exception e) {
            logger.error("Ошибка при создании типа задачи", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PutMapping("/types/{typeId}")
    public ResponseEntity<TaskTypeDto> updateTaskType(
        @PathVariable String boardId,
        @PathVariable Long typeId,
        @RequestBody TaskTypeDto typeDto,
        @AuthenticationPrincipal User user
    ) {
        try {
            // Получаем текущий тип
            TaskType existingType = boardService.getTaskTypeById(typeId);
            
            // Проверяем, принадлежит ли тип данной доске
            if (!existingType.getBoard().getId().equals(boardId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            
            // Проверяем, можно ли изменить данный тип
            if (existingType.isDefault()) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            
            // Обновляем тип
            existingType.setName(typeDto.getName());
            existingType.setColor(typeDto.getColor());
            existingType.setIcon(typeDto.getIcon());
            
            // Сохраняем обновленный тип
            TaskType updatedType = boardService.updateTaskType(boardId, typeId, existingType);
            
            return ResponseEntity.ok(TaskTypeDto.fromEntity(updatedType));
        } catch (Exception e) {
            logger.error("Ошибка при обновлении типа задачи", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @DeleteMapping("/types/{typeId}")
    public ResponseEntity<Void> deleteTaskType(
        @PathVariable String boardId,
        @PathVariable Long typeId,
        @AuthenticationPrincipal User user
    ) {
        try {
            // Получаем текущий тип
            TaskType existingType = boardService.getTaskTypeById(typeId);
            
            // Проверяем, принадлежит ли тип данной доске
            if (!existingType.getBoard().getId().equals(boardId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            
            // Проверяем, можно ли удалить данный тип
            if (existingType.isDefault()) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            
            // Удаляем тип
            boardService.deleteTaskType(boardId, typeId);
            
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            logger.error("Ошибка при удалении типа задачи", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
} 