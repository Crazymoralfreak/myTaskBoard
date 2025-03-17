package com.yourapp.controller;

import com.yourapp.model.Subtask;
import com.yourapp.model.User;
import com.yourapp.service.SubtaskService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tasks/{taskId}/subtasks")
@RequiredArgsConstructor
public class SubtaskController {
    private static final Logger logger = LoggerFactory.getLogger(SubtaskController.class);
    
    private final SubtaskService subtaskService;
    
    @PostMapping
    public ResponseEntity<Subtask> createSubtask(
            @PathVariable Long taskId,
            @RequestBody Subtask subtask,
            @AuthenticationPrincipal User currentUser) {
        logger.debug("Создание подзадачи для задачи {}. Пользователь: {}", 
            taskId, currentUser.getUsername());
        return ResponseEntity.ok(subtaskService.createSubtask(taskId, subtask));
    }
    
    @PutMapping("/{subtaskId}")
    public ResponseEntity<Subtask> updateSubtask(
            @PathVariable Long taskId,
            @PathVariable Long subtaskId,
            @RequestBody Map<String, Object> updates,
            @AuthenticationPrincipal User currentUser) {
        logger.debug("Обновление подзадачи {} задачи {}. Пользователь: {}", 
            subtaskId, taskId, currentUser.getUsername());
        return ResponseEntity.ok(subtaskService.updateSubtask(subtaskId, updates));
    }
    
    @DeleteMapping("/{subtaskId}")
    public ResponseEntity<Void> deleteSubtask(
            @PathVariable Long taskId,
            @PathVariable Long subtaskId,
            @AuthenticationPrincipal User currentUser) {
        logger.debug("Удаление подзадачи {} задачи {}. Пользователь: {}", 
            subtaskId, taskId, currentUser.getUsername());
        subtaskService.deleteSubtask(subtaskId);
        return ResponseEntity.ok().build();
    }
    
    @GetMapping("/{subtaskId}")
    public ResponseEntity<Subtask> getSubtask(
            @PathVariable Long taskId,
            @PathVariable Long subtaskId) {
        return ResponseEntity.ok(subtaskService.getSubtask(subtaskId));
    }
    
    @GetMapping
    public ResponseEntity<List<Subtask>> getSubtasksByTask(@PathVariable Long taskId) {
        return ResponseEntity.ok(subtaskService.getSubtasksByTask(taskId));
    }
    
    @PutMapping("/{subtaskId}/assign")
    public ResponseEntity<Subtask> assignSubtask(
            @PathVariable Long taskId,
            @PathVariable Long subtaskId,
            @RequestParam Long userId,
            @AuthenticationPrincipal User currentUser) {
        logger.debug("Назначение подзадачи {} пользователю {}. Инициатор: {}", 
            subtaskId, userId, currentUser.getUsername());
        return ResponseEntity.ok(subtaskService.assignSubtask(subtaskId, userId));
    }
    
    @PutMapping("/reorder")
    public ResponseEntity<List<Subtask>> reorderSubtasks(
            @PathVariable Long taskId,
            @RequestBody List<Long> subtaskIds,
            @AuthenticationPrincipal User currentUser) {
        logger.debug("Изменение порядка подзадач для задачи {}. Пользователь: {}", 
            taskId, currentUser.getUsername());
        return ResponseEntity.ok(subtaskService.reorderSubtasks(taskId, subtaskIds));
    }
} 