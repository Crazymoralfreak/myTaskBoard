package com.yourapp.model;

import org.junit.jupiter.api.Test;
import java.time.LocalDateTime;
import java.util.Arrays;

import static org.junit.jupiter.api.Assertions.*;

class TaskTest {

    @Test
    void testTaskCreation() {
        Task task = new Task();
        task.setId(1L);
        task.setTitle("Test Task");
        task.setDescription("Test Description");
        task.setDueDate(LocalDateTime.now());
        task.setPriority("High");
        task.setLabels(Arrays.asList("urgent", "important"));
        
        assertNotNull(task);
        assertEquals("Test Task", task.getTitle());
        assertEquals(2, task.getLabels().size());
        assertTrue(task.getLabels().contains("urgent"));
    }

    @Test
    void testTaskEquality() {
        Task task1 = new Task();
        task1.setId(1L);
        
        Task task2 = new Task();
        task2.setId(1L);
        
        assertEquals(task1, task2);
        assertEquals(task1.hashCode(), task2.hashCode());
    }
}