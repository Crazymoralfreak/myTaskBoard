package com.yourapp.service;

import com.yourapp.model.Task;
import com.yourapp.model.Column;
import com.yourapp.model.User;
import com.yourapp.repository.TaskRepository;
import com.yourapp.repository.ColumnRepository;
import com.yourapp.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class TaskService {
    
    private final TaskRepository taskRepository;
    private final ColumnRepository columnRepository;
    private final UserRepository userRepository;
    
    @Transactional
    public Task createTask(Task task, Long columnId) {
        Column column = columnRepository.findById(columnId)
                .orElseThrow(() -> new RuntimeException("Column not found"));
        
        task.setColumn(column);
        return taskRepository.save(task);
    }
    
    @Transactional
    public Task updateTask(Long taskId, Task updatedTask) {
        Task existingTask = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));
        
        existingTask.setTitle(updatedTask.getTitle());
        existingTask.setDescription(updatedTask.getDescription());
        existingTask.setPriority(updatedTask.getPriority());
        existingTask.setDueDate(updatedTask.getDueDate());
        existingTask.setTags(updatedTask.getTags());
        
        if (updatedTask.getAssignee() != null) {
            User assignee = userRepository.findById(updatedTask.getAssignee().getId())
                    .orElseThrow(() -> new RuntimeException("Assignee not found"));
            existingTask.setAssignee(assignee);
        }
        
        return taskRepository.save(existingTask);
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
        
        Column targetColumn = columnRepository.findById(targetColumnId)
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