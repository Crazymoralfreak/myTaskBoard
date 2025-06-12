package com.yourapp.controller;

import com.yourapp.dto.SubtaskDto;
import com.yourapp.dto.CreateSubtaskRequest;
import com.yourapp.dto.UpdateSubtaskRequest;
import com.yourapp.model.User;
import com.yourapp.service.SubtaskService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/tasks/{taskId}/subtasks")
@RequiredArgsConstructor
@Validated
@Tag(name = "Subtasks", description = "API для управления подзадачами")
public class SubtaskController {
    private static final Logger logger = LoggerFactory.getLogger(SubtaskController.class);
    
    private final SubtaskService subtaskService;
    
    @PostMapping
    @Operation(summary = "Создать подзадачу", description = "Создает новую подзадачу для указанной задачи")
    public ResponseEntity<SubtaskDto> createSubtask(
            @Parameter(description = "ID родительской задачи") @PathVariable Long taskId,
            @Valid @RequestBody CreateSubtaskRequest request,
            @AuthenticationPrincipal User currentUser) {
        
        logger.debug("Создание подзадачи для задачи {}. Пользователь: {}. Данные: {}", 
            taskId, currentUser.getUsername(), request.getTitle());
        
        try {
            SubtaskDto subtask = subtaskService.createSubtask(taskId, request);
            logger.debug("Подзадача успешно создана с ID: {}", subtask.getId());
            return ResponseEntity.status(HttpStatus.CREATED).body(subtask);
        } catch (IllegalArgumentException e) {
            logger.warn("Ошибка валидации при создании подзадачи: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (IllegalStateException e) {
            logger.error("Ошибка состояния при создании подзадачи: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        } catch (RuntimeException e) {
            logger.error("Ошибка при создании подзадачи: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            logger.error("Неожиданная ошибка при создании подзадачи", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @PutMapping("/{subtaskId}")
    @Operation(summary = "Обновить подзадачу", description = "Обновляет существующую подзадачу")
    public ResponseEntity<SubtaskDto> updateSubtask(
            @Parameter(description = "ID родительской задачи") @PathVariable Long taskId,
            @Parameter(description = "ID подзадачи") @PathVariable Long subtaskId,
            @Valid @RequestBody UpdateSubtaskRequest request,
            @AuthenticationPrincipal User currentUser) {
        
        logger.debug("Обновление подзадачи {} задачи {}. Пользователь: {}", 
            subtaskId, taskId, currentUser.getUsername());
        
        try {
            SubtaskDto subtask = subtaskService.updateSubtask(subtaskId, request);
            logger.debug("Подзадача {} успешно обновлена", subtaskId);
            return ResponseEntity.ok(subtask);
        } catch (IllegalArgumentException e) {
            logger.warn("Ошибка валидации при обновлении подзадачи: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (RuntimeException e) {
            logger.error("Ошибка при обновлении подзадачи: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            logger.error("Неожиданная ошибка при обновлении подзадачи", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @DeleteMapping("/{subtaskId}")
    @Operation(summary = "Удалить подзадачу", description = "Удаляет подзадачу")
    public ResponseEntity<Void> deleteSubtask(
            @Parameter(description = "ID родительской задачи") @PathVariable Long taskId,
            @Parameter(description = "ID подзадачи") @PathVariable Long subtaskId,
            @AuthenticationPrincipal User currentUser) {
        
        logger.debug("Удаление подзадачи {} задачи {}. Пользователь: {}", 
            subtaskId, taskId, currentUser.getUsername());
        
        try {
            subtaskService.deleteSubtask(subtaskId);
            logger.debug("Подзадача {} успешно удалена", subtaskId);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            logger.error("Ошибка при удалении подзадачи: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            logger.error("Неожиданная ошибка при удалении подзадачи", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @GetMapping("/{subtaskId}")
    @Operation(summary = "Получить подзадачу", description = "Возвращает информацию о подзадаче")
    public ResponseEntity<SubtaskDto> getSubtask(
            @Parameter(description = "ID родительской задачи") @PathVariable Long taskId,
            @Parameter(description = "ID подзадачи") @PathVariable Long subtaskId) {
        
        try {
            SubtaskDto subtask = subtaskService.getSubtask(subtaskId);
            return ResponseEntity.ok(subtask);
        } catch (RuntimeException e) {
            logger.error("Подзадача {} не найдена", subtaskId);
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            logger.error("Неожиданная ошибка при получении подзадачи", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @GetMapping
    @Operation(summary = "Получить подзадачи задачи", description = "Возвращает список всех подзадач для указанной задачи")
    public ResponseEntity<List<SubtaskDto>> getSubtasksByTask(
            @Parameter(description = "ID родительской задачи") @PathVariable Long taskId) {
        
        try {
            List<SubtaskDto> subtasks = subtaskService.getSubtasksByTask(taskId);
            return ResponseEntity.ok(subtasks);
        } catch (Exception e) {
            logger.error("Ошибка при получении подзадач для задачи {}", taskId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @PutMapping("/{subtaskId}/assign")
    @Operation(summary = "Назначить ответственного", description = "Назначает пользователя ответственным за подзадачу")
    public ResponseEntity<SubtaskDto> assignSubtask(
            @Parameter(description = "ID родительской задачи") @PathVariable Long taskId,
            @Parameter(description = "ID подзадачи") @PathVariable Long subtaskId,
            @Parameter(description = "ID пользователя") @RequestParam Long userId,
            @AuthenticationPrincipal User currentUser) {
        
        logger.debug("Назначение подзадачи {} пользователю {}. Инициатор: {}", 
            subtaskId, userId, currentUser.getUsername());
        
        try {
            SubtaskDto subtask = subtaskService.assignSubtask(subtaskId, userId);
            logger.debug("Подзадача {} успешно назначена пользователю {}", subtaskId, userId);
            return ResponseEntity.ok(subtask);
        } catch (RuntimeException e) {
            logger.error("Ошибка при назначении подзадачи: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            logger.error("Неожиданная ошибка при назначении подзадачи", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @PutMapping("/reorder")
    @Operation(summary = "Изменить порядок подзадач", description = "Изменяет порядок подзадач в списке")
    public ResponseEntity<List<SubtaskDto>> reorderSubtasks(
            @Parameter(description = "ID родительской задачи") @PathVariable Long taskId,
            @Parameter(description = "Список ID подзадач в новом порядке") @RequestBody List<Long> subtaskIds,
            @AuthenticationPrincipal User currentUser) {
        
        logger.debug("Изменение порядка подзадач для задачи {}. Пользователь: {}", 
            taskId, currentUser.getUsername());
        
        try {
            List<SubtaskDto> subtasks = subtaskService.reorderSubtasks(taskId, subtaskIds);
            logger.debug("Порядок подзадач для задачи {} успешно изменен", taskId);
            return ResponseEntity.ok(subtasks);
        } catch (RuntimeException e) {
            logger.error("Ошибка при изменении порядка подзадач: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            logger.error("Неожиданная ошибка при изменении порядка подзадач", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
} 