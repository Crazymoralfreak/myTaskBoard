package com.yourapp.controller;

import com.yourapp.model.Task;
import com.yourapp.model.User;
import com.yourapp.service.TaskService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/tasks")
public class TaskController {
    private final TaskService taskService;

    public TaskController(TaskService taskService) {
        this.taskService = taskService;
    }

    @PostMapping
    public Task createTask(@RequestBody Task task, @AuthenticationPrincipal User user) {
        return taskService.createTask(task, user.getId());
    }

    @GetMapping("/{id}")
    public Task getTask(@PathVariable Long id) {
        return taskService.getTask(id);
    }

    @GetMapping("/column/{columnId}")
    public List<Task> getTasksByColumn(@PathVariable Long columnId) {
        return taskService.getTasksByColumn(columnId);
    }

    @PutMapping("/{id}")
    public Task updateTask(
        @PathVariable Long id,
        @RequestBody Task task,
        @AuthenticationPrincipal User user
    ) {
        task.setAssignee(user);
        return taskService.updateTask(id, task);
    }

    @PatchMapping("/{taskId}/move/{newColumnId}")
    public Task moveTask(
        @PathVariable Long taskId,
        @PathVariable Long newColumnId
    ) {
        return taskService.moveTask(taskId, newColumnId);
    }

    @PatchMapping("/{taskId}/assign/{userId}")
    public Task assignTask(
        @PathVariable Long taskId,
        @PathVariable Long userId
    ) {
        return taskService.assignTask(taskId, userId);
    }

    @DeleteMapping("/{id}")
    public void deleteTask(@PathVariable Long id) {
        taskService.deleteTask(id);
    }
}