package com.yourapp.service;

import com.yourapp.model.Task;
import com.yourapp.model.BoardColumn;
import com.yourapp.model.User;
import com.yourapp.repository.TaskRepository;
import com.yourapp.repository.ColumnRepository;
import com.yourapp.repository.UserRepository;
import com.yourapp.repository.TaskStatusRepository;
import com.yourapp.model.TaskStatus;
import com.yourapp.model.TaskPriority;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.scheduling.annotation.Scheduled;
import java.time.temporal.ChronoUnit;
import java.time.LocalDateTime;

import java.util.List;
import java.util.Map;
import java.util.HashMap;

@Service
@RequiredArgsConstructor
public class TaskService {
    
    private final TaskRepository taskRepository;
    private final ColumnRepository columnRepository;
    private final UserRepository userRepository;
    private final TaskStatusRepository taskStatusRepository;
    private static final Logger logger = LoggerFactory.getLogger(TaskService.class);
    
    @Transactional
    public Task createTask(Task task, Long userId) {
        logger.debug("Начало создания задачи. UserId: {}", userId);
        
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
        
        if (updates.containsKey("customStatus")) {
            @SuppressWarnings("unchecked")
            Map<String, Object> statusDetails = updates.get("customStatus") instanceof Map ? 
                (Map<String, Object>) updates.get("customStatus") : 
                new HashMap<>();
            TaskStatus status = taskStatusRepository.findById(((Number) statusDetails.get("id")).longValue())
                .orElseThrow(() -> new RuntimeException("Status not found"));
            task.setCustomStatus(status);
        }
        
        if (updates.containsKey("priority")) {
            task.setPriority(TaskPriority.valueOf((String) updates.get("priority")));
        }
        
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
}