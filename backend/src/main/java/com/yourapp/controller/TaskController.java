package com.yourapp.controller;

import com.yourapp.model.Task;
import com.yourapp.service.TaskService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tasks")
public class TaskController {

    @Autowired
    private TaskService taskService;

    @GetMapping
    public List<Task> getAllTasks() {
        return taskService.getAllTasks();
    }

    @PostMapping
    public Task createTask(@RequestBody Task task) {
        return taskService.createTask(task);
    }

    @PutMapping("/{id}")
    public Task updateTask(@PathVariable Long id, @RequestBody Task task, @RequestHeader("X-User-Id") String changedBy) {
        return taskService.updateTask(id, task, changedBy);
    }

    @DeleteMapping("/{id}")
    public void deleteTask(@PathVariable Long id) {
        taskService.deleteTask(id);
    }

    @PostMapping("/{taskId}/move/{newColumnId}")
    public Task moveTask(@PathVariable Long taskId, @PathVariable Long newColumnId) {
        return taskService.moveTask(taskId, newColumnId);
    }
}