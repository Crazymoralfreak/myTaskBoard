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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
    
    @Transactional
    public Task createTask(Task task, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        if (task.getColumn() != null && task.getColumn().getId() != null) {
            BoardColumn column = columnRepository.findById(task.getColumn().getId())
                    .orElseThrow(() -> new RuntimeException("Column not found"));
            task.setColumn(column);
            
            // Устанавливаем позицию как последнюю в колонке
            int maxPosition = column.getTasks().stream()
                    .mapToInt(Task::getPosition)
                    .max()
                    .orElse(-1);
            task.setPosition(maxPosition + 1);
            
            // Устанавливаем дефолтный статус из доски
            if (task.getCustomStatus() == null && column.getBoard() != null) {
                TaskStatus defaultStatus = column.getBoard().getTaskStatuses().stream()
                        .filter(TaskStatus::isDefault)
                        .findFirst()
                        .orElse(null);
                task.setCustomStatus(defaultStatus);
            }
        }
        
        task.setAssignee(user);
        return taskRepository.save(task);
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
}