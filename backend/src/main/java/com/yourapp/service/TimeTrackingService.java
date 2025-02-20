package com.yourapp.service;

import com.yourapp.model.TimeTracking;
import com.yourapp.model.TimeEstimate;
import com.yourapp.model.Task;
import com.yourapp.model.User;
import com.yourapp.repository.TimeTrackingRepository;
import com.yourapp.repository.TimeEstimateRepository;
import com.yourapp.repository.TaskRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class TimeTrackingService {
    private final TimeTrackingRepository timeTrackingRepository;
    private final TimeEstimateRepository timeEstimateRepository;
    private final TaskRepository taskRepository;

    @Transactional
    public TimeTracking startTimeTracking(Long taskId, User user) {
        // Проверяем, нет ли уже запущенного таймера
        Optional<TimeTracking> activeTracking = timeTrackingRepository
            .findByTaskIdAndEndedAtIsNull(taskId);
        
        if (activeTracking.isPresent()) {
            throw new RuntimeException("Task already has active time tracking");
        }

        Task task = taskRepository.findById(taskId)
            .orElseThrow(() -> new RuntimeException("Task not found"));

        TimeTracking tracking = new TimeTracking();
        tracking.setTask(task);
        tracking.setStartedAt(LocalDateTime.now());
        tracking.setCreatedBy(user);
        return timeTrackingRepository.save(tracking);
    }

    @Transactional
    public TimeTracking stopTimeTracking(Long taskId) {
        TimeTracking tracking = timeTrackingRepository
            .findByTaskIdAndEndedAtIsNull(taskId)
            .orElseThrow(() -> new RuntimeException("No active time tracking found"));

        tracking.stop();
        return timeTrackingRepository.save(tracking);
    }

    @Transactional
    public TimeEstimate updateTimeEstimate(Long taskId, Integer estimatedMinutes, User user) {
        Task task = taskRepository.findById(taskId)
            .orElseThrow(() -> new RuntimeException("Task not found"));

        TimeEstimate estimate = new TimeEstimate();
        estimate.setTask(task);
        estimate.setEstimatedMinutes(estimatedMinutes);
        estimate.setCreatedBy(user);
        return timeEstimateRepository.save(estimate);
    }

    public List<TimeTracking> getTaskTimeTrackings(Long taskId) {
        return timeTrackingRepository.findByTaskId(taskId);
    }

    public Optional<TimeEstimate> getLatestTimeEstimate(Long taskId) {
        return timeEstimateRepository.findFirstByTaskIdOrderByCreatedAtDesc(taskId);
    }

    public int calculateTotalTimeSpent(Long taskId) {
        return timeTrackingRepository.findByTaskId(taskId).stream()
            .filter(t -> t.getDuration() != null)
            .mapToInt(TimeTracking::getDuration)
            .sum();
    }
} 