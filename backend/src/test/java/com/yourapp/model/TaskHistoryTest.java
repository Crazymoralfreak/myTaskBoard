package com.yourapp.model;

import org.junit.jupiter.api.Test;
import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;

class TaskHistoryTest {

    @Test
    void testTaskHistoryCreation() {
        TaskHistory history = new TaskHistory();
        history.setId(1L);
        history.setChangedBy("testUser");
        history.setChangeDate(LocalDateTime.now());
        history.setFieldName("status");
        history.setOldValue("To Do");
        history.setNewValue("In Progress");
        
        assertNotNull(history);
        assertEquals("testUser", history.getChangedBy());
        assertEquals("status", history.getFieldName());
        assertEquals("To Do", history.getOldValue());
        assertEquals("In Progress", history.getNewValue());
    }

    @Test
    void testTaskHistoryEquality() {
        TaskHistory history1 = new TaskHistory();
        history1.setId(1L);
        
        TaskHistory history2 = new TaskHistory();
        history2.setId(1L);
        
        assertEquals(history1, history2);
        assertEquals(history1.hashCode(), history2.hashCode());
    }
}