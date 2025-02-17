package com.yourapp.controller;

import com.yourapp.dto.TaskResponse;
import com.yourapp.mapper.TaskMapper;
import com.yourapp.model.Task;
import com.yourapp.model.User;
import com.yourapp.model.TaskPriority;
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
    private final TaskMapper taskMapper;

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public TaskResponse createTask(@RequestBody Map<String, Object> request, @AuthenticationPrincipal User currentUser) {
        logger.debug("Received task creation request: {}", request);

        Task task = new Task();
        task.setTitle((String) request.get("title"));
        task.setDescription((String) request.get("description"));
        task.setPriority(TaskPriority.valueOf((String) request.get("priority")));

        // Обработка column.id или columnId
        Object columnObj = request.get("column");
        Long columnId = null;
        if (columnObj instanceof Map) {
            columnId = Long.valueOf((String) ((Map<?, ?>) columnObj).get("id"));
        } else {
            columnId = Long.valueOf((String) request.get("columnId"));
        }

        if (columnId != null) {
            task.setColumn(columnRepository.findById(columnId)
                .orElseThrow(() -> new RuntimeException("Column not found")));
        }

        Task createdTask = taskService.createTask(task, currentUser.getId());
        return taskMapper.toResponse(createdTask);
    }

    @GetMapping("/{id}")
    public TaskResponse getTask(@PathVariable Long id) {
        return taskMapper.toResponse(taskService.getTask(id));
    }

    @GetMapping("/column/{columnId}")
    public List<TaskResponse> getTasksByColumn(@PathVariable Long columnId) {
        return taskService.getTasksByColumn(columnId).stream()
            .map(taskMapper::toResponse)
            .toList();
    }

    @PutMapping("/{id}")
    public TaskResponse updateTask(
        @PathVariable Long id,
        @RequestBody Map<String, Object> updates,
        @AuthenticationPrincipal User user
    ) {
        return taskMapper.toResponse(taskService.updateTask(id, updates));
    }

    @PatchMapping("/{taskId}/move/{newColumnId}")
    public TaskResponse moveTask(
        @PathVariable Long taskId,
        @PathVariable Long newColumnId
    ) {
        return taskMapper.toResponse(taskService.moveTask(taskId, newColumnId));
    }

    @PatchMapping("/{taskId}/assign/{userId}")
    public TaskResponse assignTask(
        @PathVariable Long taskId,
        @PathVariable Long userId
    ) {
        return taskMapper.toResponse(taskService.assignTask(taskId, userId));
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