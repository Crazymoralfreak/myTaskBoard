package com.yourapp.service;

import com.yourapp.model.TaskHistory;
import com.yourapp.repository.TaskHistoryRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.time.LocalDateTime;

import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;

class TaskHistoryServiceTest {

    @Mock
    private TaskHistoryRepository taskHistoryRepository;

    @InjectMocks
    private TaskHistoryService taskHistoryService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void testLogTaskChange() {
        String changedBy = "testUser";
        String fieldName = "title";
        String oldValue = "Old Title";
        String newValue = "New Title";

        doAnswer(invocation -> {
            TaskHistory history = invocation.getArgument(0);
            assertNotNull(history.getChangeDate());
            assertEquals(changedBy, history.getChangedBy());
            assertEquals(fieldName, history.getFieldName());
            assertEquals(oldValue, history.getOldValue());
            assertEquals(newValue, history.getNewValue());
            return null;
        }).when(taskHistoryRepository).save(any(TaskHistory.class));

        taskHistoryService.logTaskChange(changedBy, fieldName, oldValue, newValue);
        verify(taskHistoryRepository, times(1)).save(any(TaskHistory.class));
    }
}