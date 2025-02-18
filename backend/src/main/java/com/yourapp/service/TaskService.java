package com.yourapp.service;

import com.yourapp.model.*;
import com.yourapp.repository.*;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.scheduling.annotation.Scheduled;
import jakarta.annotation.PostConstruct;
import java.time.temporal.ChronoUnit;
import java.time.LocalDateTime;

import java.util.List;
import java.util.Map;
import java.util.HashMap;
import org.springframework.web.multipart.MultipartFile;
import java.util.Set;
import java.util.Optional;
import java.util.ArrayList;
import org.springframework.beans.factory.annotation.Value;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;
import java.time.Instant;
import java.time.ZoneId;
import java.util.HashSet;

@Service
@RequiredArgsConstructor
public class TaskService {
    
    private final TaskRepository taskRepository;
    private final ColumnRepository columnRepository;
    private final UserRepository userRepository;
    private final TaskStatusRepository taskStatusRepository;
    private static final Logger logger = LoggerFactory.getLogger(TaskService.class);
    
    @Value("${app.upload.max-file-size}")
    private long maxFileSize;

    @Value("${app.upload.directory:${user.home}/taskboard/uploads}")
    private String uploadDirectory;

    @PostConstruct
    public void init() {
        try {
            Files.createDirectories(Paths.get(uploadDirectory));
        } catch (IOException e) {
            throw new RuntimeException("Could not create upload directory!", e);
        }
    }
    
    @Transactional
    public Task createTask(Task task, Long userId) {
        logger.debug("Начало создания задачи. UserId: {}", userId);
        
        // Валидация обязательных полей
        if (task.getTitle() == null || task.getTitle().trim().isEmpty()) {
            throw new IllegalArgumentException("Task title is required");
        }
        
        // Находим пользователя, который создает задачу
        User user = userRepository.findById(userId)
                .orElseThrow(() -> {
                    logger.error("Пользователь с id {} не найден", userId);
                    return new RuntimeException("User not found");
                });
        logger.debug("Пользователь найден: {}", user.getUsername());
        
        // Проверяем и устанавливаем колонку
        if (task.getColumn() != null && task.getColumn().getId() != null) {
            logger.debug("Поиск колонки с id: {}", task.getColumn().getId());
            
            BoardColumn column = columnRepository.findById(task.getColumn().getId())
                    .orElseThrow(() -> {
                        logger.error("Колонка с id {} не найдена", task.getColumn().getId());
                        return new RuntimeException("Column not found");
                    });
            task.setColumn(column);
            logger.debug("Колонка успешно установлена: {}", column.getName());
            
            // Устанавливаем позицию как последнюю в колонке
            int maxPosition = column.getTasks().stream()
                    .mapToInt(Task::getPosition)
                    .max()
                    .orElse(-1);
            int newPosition = maxPosition + 1;
            task.setPosition(newPosition);
            logger.debug("Установлена позиция задачи в колонке: {}", newPosition);
            
            // Устанавливаем дефолтный статус из доски, если он не был установлен
            if (task.getCustomStatus() == null && column.getBoard() != null) {
                logger.debug("Поиск дефолтного статуса для доски: {}", column.getBoard().getId());
                
                TaskStatus defaultStatus = column.getBoard().getTaskStatuses().stream()
                        .filter(TaskStatus::isDefault)
                        .findFirst()
                        .orElse(null);
                
                if (defaultStatus != null) {
                    task.setCustomStatus(defaultStatus);
                    logger.debug("Установлен дефолтный статус: {}", defaultStatus.getName());
                } else {
                    logger.warn("Дефолтный статус не найден для доски: {}", column.getBoard().getId());
                }
            }
        } else {
            logger.error("Не указана колонка для задачи");
            throw new IllegalArgumentException("Column is required for task creation");
        }
        
        // Устанавливаем пользователя, создавшего задачу
        task.setAssignee(user);
        logger.debug("Назначен исполнитель задачи: {}", user.getUsername());
        
        // Устанавливаем дефолтный приоритет, если не указан
        if (task.getPriority() == null) {
            task.setPriority(TaskPriority.MEDIUM);
            logger.debug("Установлен дефолтный приоритет: MEDIUM");
        }
        
        // Инициализируем коллекции
        if (task.getTags() == null) {
            task.setTags(new HashSet<>());
        }
        if (task.getComments() == null) {
            task.setComments(new ArrayList<>());
        }
        if (task.getAttachments() == null) {
            task.setAttachments(new ArrayList<>());
        }
        if (task.getWatchers() == null) {
            task.setWatchers(new HashSet<>());
        }
        
        // Добавляем создателя в список наблюдателей
        task.getWatchers().add(user);
        
        // Устанавливаем даты создания и обновления
        LocalDateTime now = LocalDateTime.now();
        task.setCreatedAt(now);
        task.setUpdatedAt(now);
        
        // Проверяем и обновляем даты
        if (task.getStartDate() != null && task.getEndDate() != null) {
            if (task.getStartDate().isAfter(task.getEndDate())) {
                throw new IllegalArgumentException("End date must be after start date");
            }
            // Рассчитываем оставшееся время
            long daysRemaining = ChronoUnit.DAYS.between(now, task.getEndDate());
            task.setDaysRemaining(daysRemaining);
        }
        
        // Сохраняем задачу
        try {
            Task savedTask = taskRepository.save(task);
            logger.debug("Задача успешно сохранена с id: {}", savedTask.getId());
            return savedTask;
        } catch (Exception e) {
            logger.error("Ошибка при сохранении задачи: {}", e.getMessage(), e);
            throw e;
        }
    }
    
    @Transactional
    public Task updateTask(Long id, Map<String, Object> updates) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Task not found"));
        
        logger.debug("Обновление задачи {}. Данные обновления: {}", id, updates);
        
        // Обновление основных полей
        if (updates.containsKey("title")) {
            task.setTitle((String) updates.get("title"));
        }
        
        if (updates.containsKey("description")) {
            task.setDescription((String) updates.get("description"));
        }
        
        // Обновление статуса
        if (updates.containsKey("customStatus")) {
            @SuppressWarnings("unchecked")
            Map<String, Object> statusDetails = updates.get("customStatus") instanceof Map ? 
                (Map<String, Object>) updates.get("customStatus") : 
                new HashMap<>();
            TaskStatus status = taskStatusRepository.findById(((Number) statusDetails.get("id")).longValue())
                .orElseThrow(() -> new RuntimeException("Status not found"));
            task.setCustomStatus(status);
        }
        
        // Обновление приоритета
        if (updates.containsKey("priority")) {
            task.setPriority(TaskPriority.valueOf((String) updates.get("priority")));
        }
        
        // Обновление дат
        if (updates.containsKey("startDate")) {
            String startDateStr = (String) updates.get("startDate");
            if (startDateStr != null && !startDateStr.isEmpty()) {
                try {
                    Instant instant = Instant.parse(startDateStr);
                    task.setStartDate(LocalDateTime.ofInstant(instant, ZoneId.systemDefault()));
                } catch (Exception e) {
                    throw new IllegalArgumentException("Invalid start date format. Expected ISO 8601 format");
                }
            } else {
                task.setStartDate(null);
            }
        }
        
        if (updates.containsKey("endDate")) {
            String endDateStr = (String) updates.get("endDate");
            if (endDateStr != null && !endDateStr.isEmpty()) {
                try {
                    Instant instant = Instant.parse(endDateStr);
                    LocalDateTime endDate = LocalDateTime.ofInstant(instant, ZoneId.systemDefault());
                    
                    // Проверяем, что дата окончания позже даты начала
                    if (task.getStartDate() != null && task.getStartDate().isAfter(endDate)) {
                        throw new IllegalArgumentException("End date must be after start date");
                    }
                    
                    task.setEndDate(endDate);
                    
                    // Обновляем оставшееся время
                    long daysRemaining = ChronoUnit.DAYS.between(LocalDateTime.now(), endDate);
                    task.setDaysRemaining(daysRemaining);
                } catch (IllegalArgumentException e) {
                    throw e;
                } catch (Exception e) {
                    throw new IllegalArgumentException("Invalid end date format. Expected ISO 8601 format");
                }
            } else {
                task.setEndDate(null);
                task.setDaysRemaining(null);
            }
        }
        
        // Обновление тегов
        if (updates.containsKey("tags")) {
            @SuppressWarnings("unchecked")
            List<String> tagsList = (List<String>) updates.get("tags");
            task.setTags(new HashSet<>(tagsList));
        }
        
        // Обновление позиции
        if (updates.containsKey("position")) {
            task.setPosition(((Number) updates.get("position")).intValue());
        }
        
        task.setUpdatedAt(LocalDateTime.now());
        
        logger.debug("Сохранение обновленной задачи");
        return taskRepository.save(task);
    }
    
    @Transactional
    public void deleteTask(Long taskId) {
        taskRepository.deleteById(taskId);
    }
    
    public Task getTask(Long taskId) {
        return taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));
    }
    
    public List<Task> getTasksByColumn(Long columnId) {
        return taskRepository.findByColumnId(columnId);
    }
    
    @Transactional
    public Task moveTask(Long taskId, Long targetColumnId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));
        
        BoardColumn targetColumn = columnRepository.findById(targetColumnId)
                .orElseThrow(() -> new RuntimeException("Target column not found"));
        
        task.setColumn(targetColumn);
        return taskRepository.save(task);
    }
    
    @Transactional
    public Task assignTask(Long taskId, Long userId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));
        
        User assignee = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        task.setAssignee(assignee);
        return taskRepository.save(task);
    }

    /**
     * Обновляет оставшееся количество дней для всех активных задач
     * Запускается каждый день в полночь
     */
    @Scheduled(cron = "0 0 0 * * ?")
    @Transactional
    public void updateAllTasksRemainingDays() {
        logger.info("Начало обновления оставшегося времени для всех задач");
        List<Task> tasksWithEndDate = taskRepository.findAllByEndDateIsNotNull();
        
        for (Task task : tasksWithEndDate) {
            updateTaskRemainingDays(task);
        }
        logger.info("Обновление оставшегося времени завершено");
    }

    /**
     * Обновляет оставшееся количество дней для конкретной задачи
     */
    @Transactional
    public void updateTaskRemainingDays(Task task) {
        if (task.getEndDate() != null) {
            LocalDateTime now = LocalDateTime.now();
            LocalDateTime endDate = task.getEndDate();
            
            if (endDate.isBefore(now)) {
                // Если дата окончания уже прошла, устанавливаем -1
                task.setDaysRemaining(-1L);
                logger.debug("Задача {} просрочена", task.getId());
            } else {
                // Рассчитываем оставшееся количество дней
                long daysRemaining = ChronoUnit.DAYS.between(now, endDate);
                task.setDaysRemaining(daysRemaining);
                logger.debug("Для задачи {} установлено оставшееся время: {} дней", 
                    task.getId(), daysRemaining);
            }
            
            taskRepository.save(task);
        }
    }

    /**
     * Получает список просроченных задач
     */
    public List<Task> getOverdueTasks() {
        return taskRepository.findAllByEndDateBeforeAndDaysRemainingGreaterThanEqual(
            LocalDateTime.now(), 0L);
    }

    @Transactional
    public Task addComment(Long taskId, String content, User author) {
        if (content == null || content.trim().isEmpty()) {
            throw new IllegalArgumentException("Comment content cannot be empty");
        }

        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));

        Comment comment = new Comment();
        comment.setContent(content.trim());
        comment.setAuthor(author);
        comment.setTask(task);
        
        if (task.getComments() == null) {
            task.setComments(new ArrayList<>());
        }
        task.getComments().add(comment);
        
        // Добавляем запись в историю
        TaskHistory history = new TaskHistory();
        history.setUsername(author.getUsername());
        history.setAvatarUrl(author.getAvatarUrl());
        history.setAction("comment_added");
        history.setTimestamp(LocalDateTime.now());
        
        if (task.getHistory() == null) {
            task.setHistory(new ArrayList<>());
        }
        task.getHistory().add(history);

        return taskRepository.save(task);
    }

    @Transactional
    public Task deleteComment(Long taskId, Long commentId) {
        Task task = getTask(taskId);
        task.getComments().removeIf(comment -> comment.getId().equals(commentId));
        return taskRepository.save(task);
    }

    @Transactional
    public Task addAttachment(Long taskId, MultipartFile file, User uploader) {
        Task task = getTask(taskId);
        
        // Проверяем размер файла
        if (file.getSize() > maxFileSize) {
            throw new IllegalArgumentException(
                String.format("File size exceeds maximum limit of %d bytes", maxFileSize)
            );
        }
        
        try {
            String fileName = file.getOriginalFilename();
            String filePath = saveFile(file);
            
            Attachment attachment = new Attachment();
            attachment.setFileName(fileName);
            attachment.setFilePath(filePath);
            attachment.setContentType(file.getContentType());
            attachment.setSize(file.getSize());
            attachment.setTask(task);
            attachment.setUploadedBy(uploader);
            attachment.setCreatedAt(LocalDateTime.now());
            attachment.setUpdatedAt(LocalDateTime.now());
            
            if (task.getAttachments() == null) {
                task.setAttachments(new ArrayList<>());
            }
            task.getAttachments().add(attachment);
            
            return taskRepository.save(task);
        } catch (Exception e) {
            throw new RuntimeException("Failed to save attachment: " + e.getMessage());
        }
    }

    @Transactional
    public Task deleteAttachment(Long taskId, Long attachmentId) {
        Task task = getTask(taskId);
        task.getAttachments().removeIf(attachment -> attachment.getId().equals(attachmentId));
        return taskRepository.save(task);
    }

    @Transactional
    public Task updateTags(Long taskId, Set<String> tags) {
        Task task = getTask(taskId);
        task.setTags(tags);
        return taskRepository.save(task);
    }

    @Transactional
    public Task updateStatus(Long taskId, Long statusId) {
        Task task = getTask(taskId);
        TaskStatus status = taskStatusRepository.findById(statusId)
            .orElseThrow(() -> new RuntimeException("Status not found"));
        task.setCustomStatus(status);
        return taskRepository.save(task);
    }

    @Transactional
    public Task updatePriority(Long taskId, TaskPriority priority) {
        Task task = getTask(taskId);
        task.setPriority(priority);
        return taskRepository.save(task);
    }

    private String saveFile(MultipartFile file) throws IOException {
        // Генерируем уникальное имя файла
        String originalFilename = file.getOriginalFilename();
        String fileExtension = originalFilename != null ? 
            originalFilename.substring(originalFilename.lastIndexOf(".")) : "";
        String uniqueFilename = UUID.randomUUID().toString() + fileExtension;
        
        // Создаем путь к файлу
        Path targetLocation = Paths.get(uploadDirectory).resolve(uniqueFilename);
        
        // Сохраняем файл
        Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);
        
        // Возвращаем относительный путь к файлу
        return uniqueFilename;
    }
}