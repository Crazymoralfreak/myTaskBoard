package com.yourapp.service;

import com.yourapp.model.TaskHistory;
import com.yourapp.repository.TaskHistoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class TaskHistoryService {
    
    private final TaskHistoryRepository taskHistoryRepository;
    
    @Transactional
    public TaskHistory createHistory(TaskHistory history) {
        history.setChangedAt(LocalDateTime.now());
        return taskHistoryRepository.save(history);
    }
    
    @Transactional
    public TaskHistory updateHistory(Long id, TaskHistory historyDetails) {
        TaskHistory history = taskHistoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("History not found"));
        
        history.setChangedBy(historyDetails.getChangedBy());
        history.setFieldChanged(historyDetails.getFieldChanged());
        history.setOldValue(historyDetails.getOldValue());
        history.setNewValue(historyDetails.getNewValue());
        history.setChangedAt(LocalDateTime.now());
        
        return taskHistoryRepository.save(history);
    }
}