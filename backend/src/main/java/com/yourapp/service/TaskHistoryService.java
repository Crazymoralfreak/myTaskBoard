package com.yourapp.service;

import com.yourapp.model.TaskHistory;
import com.yourapp.model.User;
import com.yourapp.repository.TaskHistoryRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class TaskHistoryService {
    private final TaskHistoryRepository taskHistoryRepository;

    public TaskHistoryService(TaskHistoryRepository taskHistoryRepository) {
        this.taskHistoryRepository = taskHistoryRepository;
    }

    public void logTaskChange(Long taskId, User changedBy, String fieldName, String oldValue, String newValue) {
        TaskHistory history = new TaskHistory();
        history.setId(taskId);
        history.setChangedBy(changedBy);
        history.setFieldChanged(fieldName);
        history.setOldValue(oldValue);
        history.setNewValue(newValue);
        history.setChangedAt(LocalDateTime.now());
        
        taskHistoryRepository.save(history);
    }
}