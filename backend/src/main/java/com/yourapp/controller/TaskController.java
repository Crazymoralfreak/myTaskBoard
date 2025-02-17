package com.yourapp.controller;

import com.yourapp.model.Task;
import com.yourapp.model.User;
import com.yourapp.service.TaskService;
import com.yourapp.repository.ColumnRepository;
import com.yourapp.repository.TaskStatusRepository;
import com.yourapp.repository.UserRepository;
import com.yourapp.dto.CreateTaskRequest;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import java.util.HashMap;
import java.util.Map;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import com.yourapp.exception.ValidationException;

@RestController
@RequestMapping("/api/tasks")
@RequiredArgsConstructor
public class TaskController {
    private static final Logger logger = LoggerFactory.getLogger(TaskController.class);
    private final TaskService taskService;
    private final ColumnRepository columnRepository;
    private final TaskStatusRepository taskStatusRepository;
    private final UserRepository userRepository;

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public Task createTask(@RequestBody CreateTaskRequest request, @AuthenticationPrincipal User currentUser) {
        logger.debug("Received task creation request: {}", request);

        Map<String, String> errors = new HashMap<>();

        if (request.getTitle() == null || request.getTitle().trim().isEmpty()) {
            errors.put("title", "Title is required");
        }

        if (request.getDescription() == null || request.getDescription().trim().isEmpty()) {
            errors.put("description", "Description is required");
        }

        if (!errors.isEmpty()) {
            logger.warn("Task validation failed: {}", errors);
            throw new ValidationException(errors);
        }

        Task task = new Task();
        task.setTitle(request.getTitle());
        task.setDescription(request.getDescription());
        task.setDueDate(request.getDueDate());
        task.setPriority(request.getPriority());
        task.setTags(request.getTags());
        
        if (request.getColumnId() != null) {
            task.setColumn(columnRepository.findById(request.getColumnId())
                .orElseThrow(() -> new RuntimeException("Column not found")));
        }
        
        if (request.getStatusId() != null) {
            task.setCustomStatus(taskStatusRepository.findById(request.getStatusId())
                .orElseThrow(() -> new RuntimeException("Status not found")));
        }
        
        if (request.getAssigneeId() != null) {
            task.setAssignee(userRepository.findById(request.getAssigneeId())
                .orElseThrow(() -> new RuntimeException("User not found")));
        }
        
        return taskService.createTask(task, currentUser.getId());
    }

    @GetMapping("/{id}")
    public Task getTask(@PathVariable Long id) {
        return taskService.getTask(id);
    }

    @GetMapping("/column/{columnId}")
    public List<Task> getTasksByColumn(@PathVariable Long columnId) {
        return taskService.getTasksByColumn(columnId);
    }

    @PutMapping("/{id}")
    public Task updateTask(
        @PathVariable Long id,
        @RequestBody Task task,
        @AuthenticationPrincipal User user
    ) {
        task.setAssignee(user);
        return taskService.updateTask(id, task);
    }

    @PatchMapping("/{taskId}/move/{newColumnId}")
    public Task moveTask(
        @PathVariable Long taskId,
        @PathVariable Long newColumnId
    ) {
        return taskService.moveTask(taskId, newColumnId);
    }

    @PatchMapping("/{taskId}/assign/{userId}")
    public Task assignTask(
        @PathVariable Long taskId,
        @PathVariable Long userId
    ) {
        return taskService.assignTask(taskId, userId);
    }

    @DeleteMapping("/{id}")
    public void deleteTask(@PathVariable Long id) {
        taskService.deleteTask(id);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleIllegalArgumentException(IllegalArgumentException e) {
        Map<String, String> response = new HashMap<>();
        response.put("error", e.getMessage());
        response.put("status", "400");
        response.put("message", "Validation failed");
        return ResponseEntity.badRequest().body(response);
    }

    @ExceptionHandler(ValidationException.class)
    public ResponseEntity<Map<String, Object>> handleValidationException(ValidationException e) {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "400");
        response.put("message", "Validation failed");
        response.put("errors", e.getErrors());
        return ResponseEntity.badRequest().body(response);
    }
}