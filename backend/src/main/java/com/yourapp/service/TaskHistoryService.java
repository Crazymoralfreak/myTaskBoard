package com.yourapp.service;

import com.yourapp.model.TaskHistory;
import com.yourapp.repository.TaskHistoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TaskHistoryService {
    
    private final TaskHistoryRepository taskHistoryRepository;
    
    @Transactional
    public TaskHistory createHistory(TaskHistory history) {
        history.setTimestamp(LocalDateTime.now());
        return taskHistoryRepository.save(history);
    }
    
    @Transactional
    public TaskHistory updateHistory(Long id, TaskHistory historyDetails) {
        TaskHistory history = taskHistoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("History not found"));
        
        history.setAction(historyDetails.getAction());
        history.setTimestamp(LocalDateTime.now());
        
        return taskHistoryRepository.save(history);
    }

    public List<TaskHistory> getTaskHistory(Long taskId) {
        return taskHistoryRepository.findByTaskIdOrderByTimestampDesc(taskId);
    }
}