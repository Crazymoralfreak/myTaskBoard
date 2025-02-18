package com.yourapp.controller;

import com.yourapp.dto.TaskResponse;
import com.yourapp.mapper.TaskMapper;
import com.yourapp.model.Task;
import com.yourapp.model.User;
import com.yourapp.model.TaskPriority;
import com.yourapp.model.TaskStatus;
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
import java.util.HashSet;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.Instant;
import java.time.ZoneId;
import org.springframework.web.multipart.MultipartFile;
import java.util.Set;
import org.springframework.http.HttpStatus;

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
        // Логируем входящий запрос со всеми полями
        logger.debug("Начало обработки запроса на создание задачи. Данные запроса: {}", request);

        // Создаем новый объект задачи и заполняем основные поля
        Task task = new Task();
        String title = (String) request.get("title");
        String description = (String) request.get("description");
        String priority = (String) request.get("priority");
        
        logger.debug("Установка основных полей задачи: title={}, description={}, priority={}", 
            title, description, priority);
        
        task.setTitle(title);
        task.setDescription(description);
        task.setPriority(priority != null ? TaskPriority.valueOf(priority) : TaskPriority.MEDIUM);

        // Обработка идентификатора колонки
        // Поддерживаются два формата:
        // 1. { "column": { "id": "1" } }
        // 2. { "columnId": "1" }
        Object columnObj = request.get("column");
        Long columnId = null;
        logger.debug("Начало обработки идентификатора колонки. Объект column: {}", columnObj);

        if (columnObj instanceof Map) {
            // Формат 1: извлекаем id из объекта column
            Map<?, ?> columnMap = (Map<?, ?>) columnObj;
            Object idObj = columnMap.get("id");
            logger.debug("Обработка column.id. Значение: {}, Тип: {}", idObj, 
                idObj != null ? idObj.getClass().getSimpleName() : "null");
            
            if (idObj instanceof String) {
                columnId = Long.valueOf((String) idObj);
            } else if (idObj instanceof Number) {
                columnId = ((Number) idObj).longValue();
            }
        } else if (request.containsKey("columnId")) {
            // Формат 2: используем прямое значение columnId
            Object columnIdObj = request.get("columnId");
            logger.debug("Обработка columnId. Значение: {}, Тип: {}", columnIdObj,
                columnIdObj != null ? columnIdObj.getClass().getSimpleName() : "null");
            
            if (columnIdObj instanceof String) {
                columnId = Long.valueOf((String) columnIdObj);
            } else if (columnIdObj instanceof Number) {
                columnId = ((Number) columnIdObj).longValue();
            }
        }

        // Проверяем, что идентификатор колонки был успешно получен
        if (columnId == null) {
            logger.error("Не удалось получить идентификатор колонки из запроса");
            throw new IllegalArgumentException("Column ID is required");
        }

        logger.debug("Получен идентификатор колонки: {}", columnId);

        // Находим колонку в базе данных и устанавливаем её для задачи
        try {
            task.setColumn(columnRepository.findById(columnId)
                .orElseThrow(() -> new RuntimeException("Column not found")));
            logger.debug("Колонка успешно найдена и установлена для задачи");
        } catch (Exception e) {
            logger.error("Ошибка при поиске колонки с id {}: {}", columnId, e.getMessage());
            throw e;
        }

        // Обработка тегов (опционально)
        if (request.containsKey("tags") && request.get("tags") instanceof List) {
            List<String> tagsList = (List<String>) request.get("tags");
            logger.debug("Установка тегов для задачи: {}", tagsList);
            task.setTags(new HashSet<>(tagsList));
        }

        // Обработка дат начала и окончания (опционально)
        if (request.containsKey("startDate")) {
            String startDateStr = (String) request.get("startDate");
            logger.debug("Обработка даты начала: {}", startDateStr);
            if (startDateStr != null && !startDateStr.isEmpty()) {
                try {
                    Instant instant = Instant.parse(startDateStr);
                    task.setStartDate(LocalDateTime.ofInstant(instant, ZoneId.systemDefault()));
                    logger.debug("Дата начала успешно установлена");
                } catch (Exception e) {
                    logger.error("Ошибка при парсинге даты начала {}: {}", startDateStr, e.getMessage());
                    throw new IllegalArgumentException("Invalid start date format. Expected ISO 8601 format (e.g. 2025-02-11T21:00:00.000Z)");
                }
            }
        }

        if (request.containsKey("endDate")) {
            String endDateStr = (String) request.get("endDate");
            logger.debug("Обработка даты окончания: {}", endDateStr);
            if (endDateStr != null && !endDateStr.isEmpty()) {
                try {
                    Instant instant = Instant.parse(endDateStr);
                    LocalDateTime endDate = LocalDateTime.ofInstant(instant, ZoneId.systemDefault());
                    task.setEndDate(endDate);
                    logger.debug("Дата окончания успешно установлена");

                    // Проверяем, что дата окончания позже даты начала
                    if (task.getStartDate() != null && task.getStartDate().isAfter(endDate)) {
                        throw new IllegalArgumentException("End date must be after start date");
                    }

                    // Рассчитываем оставшееся время, если указаны обе даты
                    if (task.getStartDate() != null) {
                        long daysRemaining = java.time.Duration.between(
                            LocalDateTime.now(),
                            endDate
                        ).toDays();
                        task.setDaysRemaining(daysRemaining);
                        logger.debug("Установлено оставшееся время: {} дней", daysRemaining);
                    }
                } catch (IllegalArgumentException e) {
                    throw e;
                } catch (Exception e) {
                    logger.error("Ошибка при парсинге даты окончания {}: {}", endDateStr, e.getMessage());
                    throw new IllegalArgumentException("Invalid end date format. Expected ISO 8601 format (e.g. 2025-02-11T21:00:00.000Z)");
                }
            }
        }

        // Обработка статуса задачи (опционально)
        if (request.containsKey("statusId")) {
            Object statusIdObj = request.get("statusId");
            logger.debug("Обработка statusId. Значение: {}, Тип: {}", statusIdObj,
                statusIdObj != null ? statusIdObj.getClass().getSimpleName() : "null");
            
            Long statusId = null;
            if (statusIdObj instanceof String) {
                statusId = Long.valueOf((String) statusIdObj);
            } else if (statusIdObj instanceof Number) {
                statusId = ((Number) statusIdObj).longValue();
            }
            
            if (statusId != null) {
                try {
                    TaskStatus status = taskStatusRepository.findById(statusId)
                        .orElseThrow(() -> new RuntimeException("Status not found"));
                    task.setCustomStatus(status);
                    logger.debug("Статус задачи успешно установлен: {}", status.getName());
                } catch (Exception e) {
                    logger.error("Ошибка при установке статуса {}: {}", statusId, e.getMessage());
                    throw e;
                }
            }
        }

        // Создаем задачу через сервис
        try {
            logger.debug("Отправка задачи в сервис для создания. UserId: {}", currentUser.getId());
            Task createdTask = taskService.createTask(task, currentUser.getId());
            logger.debug("Задача успешно создана с id: {}", createdTask.getId());
            
            // Преобразуем в DTO и возвращаем результат
            TaskResponse response = taskMapper.toResponse(createdTask);
            logger.debug("Задача успешно преобразована в DTO: {}", response);
            return response;
        } catch (Exception e) {
            logger.error("Ошибка при создании задачи: {}", e.getMessage(), e);
            throw e;
        }
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

    @PutMapping("/{taskId}")
    public TaskResponse updateTask(
        @PathVariable Long taskId,
        @RequestBody Map<String, Object> updates,
        @AuthenticationPrincipal User user
    ) {
        logger.debug("Обновление задачи с id: {}. Данные обновления: {}", taskId, updates);
        
        try {
            Task task = taskService.updateTask(taskId, updates);
            logger.debug("Задача успешно обновлена: {}", task.getId());
            return taskMapper.toResponse(task);
        } catch (Exception e) {
            logger.error("Ошибка при обновлении задачи: {}", e.getMessage(), e);
            throw e;
        }
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

    @PostMapping("/{taskId}/comments")
    @ResponseStatus(HttpStatus.CREATED)
    public TaskResponse addComment(
        @PathVariable Long taskId,
        @RequestBody Map<String, String> request,
        @AuthenticationPrincipal User user
    ) {
        logger.debug("Добавление комментария к задаче {}. Пользователь: {}", taskId, user.getUsername());
        
        if (!request.containsKey("content")) {
            throw new IllegalArgumentException("Comment content is required");
        }
        
        Task task = taskService.addComment(taskId, request.get("content"), user);
        return taskMapper.toResponse(task);
    }

    @DeleteMapping("/{taskId}/comments/{commentId}")
    public TaskResponse deleteComment(
        @PathVariable Long taskId,
        @PathVariable Long commentId
    ) {
        Task task = taskService.deleteComment(taskId, commentId);
        return taskMapper.toResponse(task);
    }

    @PostMapping("/{taskId}/attachments")
    public TaskResponse addAttachment(
        @PathVariable Long taskId,
        @RequestParam("file") MultipartFile file,
        @AuthenticationPrincipal User user
    ) {
        Task task = taskService.addAttachment(taskId, file, user);
        return taskMapper.toResponse(task);
    }

    @DeleteMapping("/{taskId}/attachments/{attachmentId}")
    public TaskResponse deleteAttachment(
        @PathVariable Long taskId,
        @PathVariable Long attachmentId
    ) {
        Task task = taskService.deleteAttachment(taskId, attachmentId);
        return taskMapper.toResponse(task);
    }

    @PatchMapping("/{taskId}/tags")
    public TaskResponse updateTags(
        @PathVariable Long taskId,
        @RequestBody Set<String> tags
    ) {
        Task task = taskService.updateTags(taskId, tags);
        return taskMapper.toResponse(task);
    }

    @PatchMapping("/{taskId}/status")
    public TaskResponse updateStatus(
        @PathVariable Long taskId,
        @RequestBody Map<String, Long> request
    ) {
        Task task = taskService.updateStatus(taskId, request.get("statusId"));
        return taskMapper.toResponse(task);
    }

    @PatchMapping("/{taskId}/priority")
    public TaskResponse updatePriority(
        @PathVariable Long taskId,
        @RequestBody Map<String, String> request
    ) {
        Task task = taskService.updatePriority(taskId, TaskPriority.valueOf(request.get("priority")));
        return taskMapper.toResponse(task);
    }
}