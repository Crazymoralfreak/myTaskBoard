package com.yourapp.service;

import com.yourapp.dto.SubtaskDto;
import com.yourapp.dto.CreateSubtaskRequest;
import com.yourapp.dto.UpdateSubtaskRequest;
import com.yourapp.mapper.SubtaskMapper;
import com.yourapp.model.Subtask;
import com.yourapp.model.Task;
import com.yourapp.model.User;
import com.yourapp.model.TaskHistory;
import com.yourapp.repository.SubtaskRepository;
import com.yourapp.repository.TaskRepository;
import com.yourapp.repository.UserRepository;
import com.yourapp.util.NotificationUtil;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.Optional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SubtaskService {
    private static final Logger logger = LoggerFactory.getLogger(SubtaskService.class);
    
    private final SubtaskRepository subtaskRepository;
    private final TaskRepository taskRepository;
    private final UserRepository userRepository;
    private final SubtaskMapper subtaskMapper;
    private final NotificationUtil notificationUtil;
    private final TaskHistoryService taskHistoryService;
    
    /**
     * Получает текущего пользователя из контекста безопасности
     */
    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        logger.debug("Получение текущего пользователя. Authentication: {}", authentication);
        
        if (authentication == null || authentication.getName() == null) {
            logger.error("Пользователь не аутентифицирован. Authentication: {}", authentication);
            throw new IllegalStateException("Пользователь не аутентифицирован");
        }
        
        String username = authentication.getName();
        logger.debug("Username из контекста: {}", username);
        
        // Сначала пытаемся найти по username
        Optional<User> userOpt = userRepository.findByUsername(username);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            logger.debug("Найден пользователь по username: {} (ID: {})", user.getUsername(), user.getId());
            return user;
        }
        
        // Если не найдено по username, пытаемся найти по email
        userOpt = userRepository.findByEmail(username);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            logger.debug("Найден пользователь по email: {} (ID: {})", user.getEmail(), user.getId());
            return user;
        }
        
        // В крайнем случае пытаемся парсить как ID (для совместимости)
        try {
            Long userId = Long.parseLong(username);
            Optional<User> userByIdOpt = userRepository.findById(userId);
            if (userByIdOpt.isPresent()) {
                User user = userByIdOpt.get();
                logger.debug("Найден пользователь по ID: {} ({})", user.getUsername(), user.getId());
                return user;
            }
        } catch (NumberFormatException e) {
            logger.debug("Username '{}' не является числовым ID", username);
        }
        
        logger.error("Пользователь не найден: {}", username);
        throw new RuntimeException("User not found: " + username);
    }
    
    @Transactional
    public SubtaskDto createSubtask(Long taskId, CreateSubtaskRequest request) {
        logger.debug("Создание подзадачи для задачи {}. Данные: {}", taskId, request);
        
        if (request.getTitle() == null || request.getTitle().trim().isEmpty()) {
            throw new IllegalArgumentException("Title is required");
        }
        
        Task parentTask = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found with id: " + taskId));
        
        // Получаем текущего пользователя
        User currentUser = getCurrentUser();
        
        // Определяем следующую позицию
        Integer maxPosition = subtaskRepository.findMaxPositionByTaskId(taskId);
        int newPosition = (maxPosition != null) ? maxPosition + 1 : 0;
        
        Subtask subtask = new Subtask();
        subtask.setTitle(request.getTitle().trim());
        subtask.setDescription(request.getDescription());
        subtask.setCompleted(false);
        subtask.setParentTask(parentTask);
        subtask.setPosition(newPosition);
        subtask.setDueDate(request.getDueDate());
        subtask.setEstimatedHours(request.getEstimatedHours());
        
        LocalDateTime now = LocalDateTime.now();
        subtask.setCreatedAt(now);
        subtask.setUpdatedAt(now);
        
        logger.debug("Сохранение подзадачи");
        Subtask savedSubtask = subtaskRepository.save(subtask);
        
        // Создаем запись в истории задачи
        try {
            logger.debug("Создание записи в истории для подзадачи");
            TaskHistory history = new TaskHistory();
            history.setTask(parentTask);
            history.setChangedBy(currentUser);
            // username будет автоматически заполнен триггером базы данных
            history.setAction("subtask_created");
            history.setNewValue("Создана подзадача: " + savedSubtask.getTitle());
            history.setTimestamp(now);
            
            logger.debug("Сохранение истории в базу данных");
            taskHistoryService.createHistory(history);
            logger.debug("Добавлена запись в историю о создании подзадачи");
        } catch (Exception e) {
            logger.error("Ошибка при записи истории создания подзадачи", e);
        }
        
        // Создаем уведомление
        try {
            notificationUtil.notifySubtaskCreated(savedSubtask);
        } catch (Exception e) {
            logger.error("Ошибка при отправке уведомления о создании подзадачи", e);
        }
        
        return subtaskMapper.toDto(savedSubtask);
    }
    
    @Transactional
    public SubtaskDto updateSubtask(Long subtaskId, UpdateSubtaskRequest request) {
        logger.debug("Обновление подзадачи {}. Данные: {}", subtaskId, request);
        
        Subtask subtask = subtaskRepository.findById(subtaskId)
                .orElseThrow(() -> new RuntimeException("Subtask not found with id: " + subtaskId));
        
        Task parentTask = subtask.getParentTask();
        String oldTitle = subtask.getTitle();
        boolean wasCompleted = subtask.isCompleted();
        
        // Обновляем поля
        if (request.getTitle() != null) {
            if (request.getTitle().trim().isEmpty()) {
                throw new IllegalArgumentException("Title cannot be empty");
            }
            subtask.setTitle(request.getTitle());
        }
        
        if (request.getDescription() != null) {
            subtask.setDescription(request.getDescription());
        }
        
        if (request.getCompleted() != null) {
            subtask.setCompleted(request.getCompleted());
        }
        
        if (request.getPosition() != null) {
            subtask.setPosition(request.getPosition());
        }
        
        if (request.getDueDate() != null) {
            subtask.setDueDate(request.getDueDate());
        }
        
        if (request.getEstimatedHours() != null) {
            subtask.setEstimatedHours(request.getEstimatedHours());
        }
        
        // Назначение ответственного
        if (request.getAssigneeId() != null) {
            if (request.getAssigneeId() == 0) {
                // Снимаем назначение
                subtask.setAssignee(null);
                logger.debug("Снято назначение с подзадачи {}", subtaskId);
            } else {
                User assignee = userRepository.findById(request.getAssigneeId())
                        .orElseThrow(() -> new RuntimeException("User not found with id: " + request.getAssigneeId()));
                subtask.setAssignee(assignee);
                logger.debug("Назначен ответственный {} на подзадачу {}", assignee.getUsername(), subtaskId);
            }
        }
        
        LocalDateTime now = LocalDateTime.now();
        subtask.setUpdatedAt(now);
        
        logger.debug("Сохранение обновленной подзадачи");
        Subtask savedSubtask = subtaskRepository.save(subtask);
        
        // Записываем изменения в историю
        try {
            User currentUser = getCurrentUser();
            if (request.getCompleted() != null && !wasCompleted && request.getCompleted()) {
                TaskHistory history = new TaskHistory();
                history.setTask(parentTask);
                history.setChangedBy(currentUser);
                history.setAction("subtask_completed");
                history.setNewValue("Завершена подзадача: " + savedSubtask.getTitle());
                history.setTimestamp(now);
                taskHistoryService.createHistory(history);
                
                // Отправляем уведомление о завершении подзадачи
                notificationUtil.notifySubtaskCompleted(savedSubtask);
            } else if (request.getTitle() != null && !oldTitle.equals(request.getTitle())) {
                TaskHistory history = new TaskHistory();
                history.setTask(parentTask);
                history.setChangedBy(currentUser);
                history.setAction("subtask_updated");
                history.setOldValue("Старое название: " + oldTitle);
                history.setNewValue("Новое название: " + request.getTitle());
                history.setTimestamp(now);
                taskHistoryService.createHistory(history);
            }
        } catch (Exception e) {
            logger.error("Ошибка при записи истории обновления подзадачи", e);
        }
        
        return subtaskMapper.toDto(savedSubtask);
    }
    
    @Transactional
    public void deleteSubtask(Long subtaskId) {
        logger.debug("Удаление подзадачи {}", subtaskId);
        
        Subtask subtask = subtaskRepository.findById(subtaskId)
                .orElseThrow(() -> new RuntimeException("Subtask not found with id: " + subtaskId));
        
        Task parentTask = subtask.getParentTask();
        String subtaskTitle = subtask.getTitle();
        
        subtaskRepository.deleteById(subtaskId);
        
        // Записываем удаление в историю
        try {
            User currentUser = getCurrentUser();
            TaskHistory history = new TaskHistory();
            history.setTask(parentTask);
            history.setChangedBy(currentUser);
            history.setAction("subtask_deleted");
            history.setNewValue("Удалена подзадача: " + subtaskTitle);
            history.setTimestamp(LocalDateTime.now());
            taskHistoryService.createHistory(history);
        } catch (Exception e) {
            logger.error("Ошибка при записи истории удаления подзадачи", e);
        }
    }
    
    public SubtaskDto getSubtask(Long subtaskId) {
        Subtask subtask = subtaskRepository.findById(subtaskId)
                .orElseThrow(() -> new RuntimeException("Subtask not found with id: " + subtaskId));
        return subtaskMapper.toDto(subtask);
    }
    
    public List<SubtaskDto> getSubtasksByTask(Long taskId) {
        List<Subtask> subtasks = subtaskRepository.findByParentTaskIdOrderByPositionAsc(taskId);
        return subtaskMapper.toDtoList(subtasks);
    }
    
    @Transactional
    public SubtaskDto assignSubtask(Long subtaskId, Long userId) {
        logger.debug("Назначение подзадачи {} пользователю {}", subtaskId, userId);
        
        Subtask subtask = subtaskRepository.findById(subtaskId)
                .orElseThrow(() -> new RuntimeException("Subtask not found with id: " + subtaskId));
        
        User assignee = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
        
        User oldAssignee = subtask.getAssignee();
        subtask.setAssignee(assignee);
        subtask.setUpdatedAt(LocalDateTime.now());
        
        Subtask savedSubtask = subtaskRepository.save(subtask);
        
        // Записываем назначение в историю
        try {
            User currentUser = getCurrentUser();
            TaskHistory history = new TaskHistory();
            history.setTask(subtask.getParentTask());
            history.setChangedBy(currentUser);
            history.setAction("subtask_assigned");
            if (oldAssignee != null) {
                history.setOldValue("Старый ответственный: " + oldAssignee.getUsername());
            }
            history.setNewValue("Назначен ответственный за подзадачу \"" + subtask.getTitle() + "\": " + assignee.getUsername());
            history.setTimestamp(LocalDateTime.now());
            taskHistoryService.createHistory(history);
        } catch (Exception e) {
            logger.error("Ошибка при записи истории назначения подзадачи", e);
        }
        
        return subtaskMapper.toDto(savedSubtask);
    }
    
    @Transactional
    public List<SubtaskDto> reorderSubtasks(Long taskId, List<Long> subtaskIds) {
        logger.debug("Изменение порядка подзадач для задачи {}", taskId);
        
        // Проверяем существование задачи
        Task parentTask = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found with id: " + taskId));
        
        List<Subtask> subtasks = subtaskRepository.findByParentTaskId(taskId);
        
        // Создаем мапу для быстрого доступа к подзадачам
        java.util.Map<Long, Subtask> subtaskMap = subtasks.stream()
                .collect(java.util.stream.Collectors.toMap(Subtask::getId, s -> s));
        
        // Обновляем позиции
        for (int i = 0; i < subtaskIds.size(); i++) {
            Subtask subtask = subtaskMap.get(subtaskIds.get(i));
            if (subtask != null) {
                subtask.setPosition(i);
                subtask.setUpdatedAt(LocalDateTime.now());
            }
        }
        
        List<Subtask> savedSubtasks = subtaskRepository.saveAll(subtasks);
        
        // Записываем изменение порядка в историю
        try {
            User currentUser = getCurrentUser();
            TaskHistory history = new TaskHistory();
            history.setTask(parentTask);
            history.setChangedBy(currentUser);
            history.setAction("subtasks_reordered");
            history.setNewValue("Изменен порядок подзадач");
            history.setTimestamp(LocalDateTime.now());
            taskHistoryService.createHistory(history);
        } catch (Exception e) {
            logger.error("Ошибка при записи истории изменения порядка подзадач", e);
        }
        
        return subtaskMapper.toDtoList(savedSubtasks);
    }
} 