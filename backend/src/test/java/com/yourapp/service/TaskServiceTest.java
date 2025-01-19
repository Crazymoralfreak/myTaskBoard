package com.yourapp.service;

import com.yourapp.model.Task;
import com.yourapp.repository.TaskRepository;
import com.yourapp.service.TaskHistoryService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.util.Optional;

import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;

class TaskServiceTest {

    @Mock
    private TaskRepository taskRepository;

    @Mock
    private TaskHistoryService taskHistoryService;

    @InjectMocks
    private TaskService taskService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void testCreateTask() {
        Task task = new Task();
        when(taskRepository.save(task)).thenReturn(task);

        Task created = taskService.createTask(task);
        assertNotNull(created);
        verify(taskRepository, times(1)).save(task);
    }

    @Test
    void testUpdateTask() {
        Task existingTask = new Task();
        existingTask.setId(1L);
        existingTask.setTitle("Old Title");

        Task updatedTask = new Task();
        updatedTask.setId(1L);
        updatedTask.setTitle("New Title");

        when(taskRepository.findById(1L)).thenReturn(Optional.of(existingTask));
        when(taskRepository.save(any(Task.class))).thenReturn(updatedTask);

        Task result = taskService.updateTask(1L, updatedTask, "testUser");
        assertEquals("New Title", result.getTitle());
        verify(taskHistoryService, atLeastOnce()).logTaskChange(anyString(), anyString(), anyString(), anyString());
    }

    @Test
    void testDeleteTask() {
        doNothing().when(taskRepository).deleteById(1L);
        
        taskService.deleteTask(1L);
        verify(taskRepository, times(1)).deleteById(1L);
    }
}