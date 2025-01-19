package com.yourapp.service;

import com.yourapp.model.Task;
import com.yourapp.repository.TaskRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class TaskService {

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private TaskHistoryService taskHistoryService;

    public List<Task> getAllTasks() {
        return taskRepository.findAll();
    }

    public Task createTask(Task task) {
        return taskRepository.save(task);
    }

    public Task updateTask(Long id, Task task, String changedBy) {
        Task existingTask = taskRepository.findById(id).orElseThrow();
        
        // Track changes
        if (!existingTask.getTitle().equals(task.getTitle())) {
            taskHistoryService.logTaskChange(changedBy, "title", existingTask.getTitle(), task.getTitle());
        }
        if (!existingTask.getDescription().equals(task.getDescription())) {
            taskHistoryService.logTaskChange(changedBy, "description", existingTask.getDescription(), task.getDescription());
        }
        if (!existingTask.getPriority().equals(task.getPriority())) {
            taskHistoryService.logTaskChange(changedBy, "priority", existingTask.getPriority(), task.getPriority());
        }
        
        task.setId(id);
        return taskRepository.save(task);
    }

    public void deleteTask(Long id) {
        taskRepository.deleteById(id);
    }

    public Task moveTask(Long taskId, Long newColumnId) {
        Task task = taskRepository.findById(taskId).orElseThrow();
        // Logic to move task to new column
        return taskRepository.save(task);
    }
}