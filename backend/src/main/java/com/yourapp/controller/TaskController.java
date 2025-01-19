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
        return taskService.createTask(task, user);
    }

    @PutMapping("/{id}")
    public Task updateTask(
        @PathVariable Long id,
        @RequestBody Task task,
        @AuthenticationPrincipal User user
    ) {
        return taskService.updateTask(id, task, user);
    }

    @PatchMapping("/{taskId}/move/{newColumnId}")
    public Task moveTask(
        @PathVariable Long taskId,
        @PathVariable Long newColumnId,
        @AuthenticationPrincipal User user
    ) {
        return taskService.moveTask(taskId, newColumnId, user);
    }

    @DeleteMapping("/{id}")
    public void deleteTask(@PathVariable Long id) {
        taskService.deleteTask(id);
    }
}