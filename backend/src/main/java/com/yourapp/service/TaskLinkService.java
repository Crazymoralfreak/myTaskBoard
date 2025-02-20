package com.yourapp.service;

import com.yourapp.model.TaskLink;
import com.yourapp.model.Task;
import com.yourapp.model.User;
import com.yourapp.repository.TaskLinkRepository;
import com.yourapp.repository.TaskRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class TaskLinkService {
    private final TaskLinkRepository taskLinkRepository;
    private final TaskRepository taskRepository;

    @Transactional
    public TaskLink createTaskLink(Long sourceTaskId, Long targetTaskId, TaskLink.LinkType type, User user) {
        // Проверяем, что задачи существуют
        Task sourceTask = taskRepository.findById(sourceTaskId)
            .orElseThrow(() -> new RuntimeException("Source task not found"));
        Task targetTask = taskRepository.findById(targetTaskId)
            .orElseThrow(() -> new RuntimeException("Target task not found"));

        // Проверяем, что связь еще не существует
        Optional<TaskLink> existingLink = taskLinkRepository
            .findBySourceTaskIdAndTargetTaskId(sourceTaskId, targetTaskId);
        if (existingLink.isPresent()) {
            throw new RuntimeException("Task link already exists");
        }

        // Создаем связь
        TaskLink link = new TaskLink();
        link.setSourceTask(sourceTask);
        link.setTargetTask(targetTask);
        link.setType(type);
        link.setCreatedBy(user);
        return taskLinkRepository.save(link);
    }

    @Transactional
    public void deleteTaskLink(Long sourceTaskId, Long targetTaskId) {
        TaskLink link = taskLinkRepository
            .findBySourceTaskIdAndTargetTaskId(sourceTaskId, targetTaskId)
            .orElseThrow(() -> new RuntimeException("Task link not found"));
        taskLinkRepository.delete(link);
    }

    public List<TaskLink> getTaskOutgoingLinks(Long taskId) {
        return taskLinkRepository.findBySourceTaskId(taskId);
    }

    public List<TaskLink> getTaskIncomingLinks(Long taskId) {
        return taskLinkRepository.findByTargetTaskId(taskId);
    }

    @Transactional
    public void deleteAllTaskLinks(Long taskId) {
        taskLinkRepository.deleteBySourceTaskIdOrTargetTaskId(taskId, taskId);
    }
} 