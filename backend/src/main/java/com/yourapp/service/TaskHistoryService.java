package com.yourapp.service;

import com.yourapp.model.TaskHistory;
import com.yourapp.repository.TaskHistoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class TaskHistoryService {

    @Autowired
    private TaskHistoryRepository taskHistoryRepository;

    public void logTaskChange(String changedBy, String fieldName, String oldValue, String newValue) {
        TaskHistory history = new TaskHistory();
        history.setChangedBy(changedBy);
        history.setChangeDate(LocalDateTime.now());
        history.setFieldName(fieldName);
        history.setOldValue(oldValue);
        history.setNewValue(newValue);
        taskHistoryRepository.save(history);
    }
}