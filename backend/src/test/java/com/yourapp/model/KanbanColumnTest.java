package com.yourapp.model;

import org.junit.jupiter.api.Test;
import java.util.Collections;

import static org.junit.jupiter.api.Assertions.*;

class KanbanColumnTest {

    @Test
    void testKanbanColumnCreation() {
        KanbanColumn column = new KanbanColumn();
        column.setId(1L);
        column.setName("To Do");
        column.setTasks(Collections.emptyList());
        
        assertNotNull(column);
        assertEquals("To Do", column.getName());
        assertTrue(column.getTasks().isEmpty());
    }

    @Test
    void testKanbanColumnEquality() {
        KanbanColumn column1 = new KanbanColumn();
        column1.setId(1L);
        
        KanbanColumn column2 = new KanbanColumn();
        column2.setId(1L);
        
        assertEquals(column1, column2);
        assertEquals(column1.hashCode(), column2.hashCode());
    }
}