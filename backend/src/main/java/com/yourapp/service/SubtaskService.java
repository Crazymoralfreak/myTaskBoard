package com.yourapp.service;

import com.yourapp.model.Subtask;
import com.yourapp.model.Task;
import com.yourapp.model.User;
import com.yourapp.repository.SubtaskRepository;
import com.yourapp.repository.TaskRepository;
import com.yourapp.repository.UserRepository;
import com.yourapp.util.NotificationUtil;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class SubtaskService {
    private static final Logger logger = LoggerFactory.getLogger(SubtaskService.class);
    
    private final SubtaskRepository subtaskRepository;
    private final TaskRepository taskRepository;
    private final UserRepository userRepository;
    private final NotificationUtil notificationUtil;
    
    @Transactional
    public Subtask createSubtask(Long taskId, Subtask subtask) {
        logger.debug("Создание подзадачи для задачи {}", taskId);
        
        Task parentTask = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));
        
        // Валидация
        if (subtask.getTitle() == null || subtask.getTitle().trim().isEmpty()) {
            throw new IllegalArgumentException("Subtask title is required");
        }
        
        // Установка позиции
        Integer maxPosition = subtaskRepository.findMaxPositionByTaskId(taskId);
        subtask.setPosition(maxPosition != null ? maxPosition + 1 : 0);
        
        // Установка родительской задачи
        subtask.setParentTask(parentTask);
        
        // Установка дат
        LocalDateTime now = LocalDateTime.now();
        subtask.setCreatedAt(now);
        subtask.setUpdatedAt(now);
        
        logger.debug("Сохранение подзадачи");
        Subtask savedSubtask = subtaskRepository.save(subtask);
        
        // Создаем уведомление о создании подзадачи для назначенного пользователя родительской задачи
        notificationUtil.notifySubtaskCreated(savedSubtask);
        
        return savedSubtask;
    }
    
    @Transactional
    public Subtask updateSubtask(Long subtaskId, Map<String, Object> updates) {
        logger.debug("Обновление подзадачи {}. Данные: {}", subtaskId, updates);
        
        Subtask subtask = subtaskRepository.findById(subtaskId)
                .orElseThrow(() -> new RuntimeException("Subtask not found"));
        
        if (updates.containsKey("title")) {
            String title = (String) updates.get("title");
            if (title == null || title.trim().isEmpty()) {
                throw new IllegalArgumentException("Title cannot be empty");
            }
            subtask.setTitle(title);
        }
        
        if (updates.containsKey("description")) {
            subtask.setDescription((String) updates.get("description"));
        }
        
        if (updates.containsKey("completed")) {
            boolean wasCompleted = subtask.isCompleted();
            boolean isCompleted = (Boolean) updates.get("completed");
            subtask.setCompleted(isCompleted);
            
                         // Если подзадача была завершена (изменилась с false на true)
             if (!wasCompleted && isCompleted) {
                 // Создаем уведомление о завершении подзадачи для назначенного пользователя родительской задачи
                 notificationUtil.notifySubtaskCompleted(subtask);
             }
        }
        
        if (updates.containsKey("position")) {
            subtask.setPosition((Integer) updates.get("position"));
        }
        
        if (updates.containsKey("dueDate")) {
            subtask.setDueDate(LocalDateTime.parse((String) updates.get("dueDate")));
        }
        
        if (updates.containsKey("estimatedHours")) {
            subtask.setEstimatedHours((Integer) updates.get("estimatedHours"));
        }
        
        subtask.setUpdatedAt(LocalDateTime.now());
        
        logger.debug("Сохранение обновленной подзадачи");
        return subtaskRepository.save(subtask);
    }
    
    @Transactional
    public void deleteSubtask(Long subtaskId) {
        logger.debug("Удаление подзадачи {}", subtaskId);
        subtaskRepository.deleteById(subtaskId);
    }
    
    public Subtask getSubtask(Long subtaskId) {
        return subtaskRepository.findById(subtaskId)
                .orElseThrow(() -> new RuntimeException("Subtask not found"));
    }
    
    public List<Subtask> getSubtasksByTask(Long taskId) {
        return subtaskRepository.findByParentTaskIdOrderByPositionAsc(taskId);
    }
    
    @Transactional
    public Subtask assignSubtask(Long subtaskId, Long userId) {
        logger.debug("Назначение подзадачи {} пользователю {}", subtaskId, userId);
        
        Subtask subtask = subtaskRepository.findById(subtaskId)
                .orElseThrow(() -> new RuntimeException("Subtask not found"));
        
        User assignee = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        subtask.setAssignee(assignee);
        subtask.setUpdatedAt(LocalDateTime.now());
        
        return subtaskRepository.save(subtask);
    }
    
    @Transactional
    public List<Subtask> reorderSubtasks(Long taskId, List<Long> subtaskIds) {
        logger.debug("Изменение порядка подзадач для задачи {}", taskId);
        
        List<Subtask> subtasks = subtaskRepository.findByParentTaskId(taskId);
        
        // Создаем мапу для быстрого доступа к подзадачам
        Map<Long, Subtask> subtaskMap = subtasks.stream()
                .collect(java.util.stream.Collectors.toMap(Subtask::getId, s -> s));
        
        // Обновляем позиции
        for (int i = 0; i < subtaskIds.size(); i++) {
            Subtask subtask = subtaskMap.get(subtaskIds.get(i));
            if (subtask != null) {
                subtask.setPosition(i);
                subtask.setUpdatedAt(LocalDateTime.now());
            }
        }
        
        return subtaskRepository.saveAll(subtasks);
    }
} 