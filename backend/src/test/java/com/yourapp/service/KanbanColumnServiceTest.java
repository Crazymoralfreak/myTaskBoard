package com.yourapp.service;

import com.yourapp.model.KanbanColumn;
import com.yourapp.repository.KanbanColumnRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;

class KanbanColumnServiceTest {

    @Mock
    private KanbanColumnRepository kanbanColumnRepository;

    @InjectMocks
    private KanbanColumnService kanbanColumnService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void testGetAllColumns() {
        KanbanColumn column1 = new KanbanColumn();
        KanbanColumn column2 = new KanbanColumn();
        
        when(kanbanColumnRepository.findAll()).thenReturn(Arrays.asList(column1, column2));

        List<KanbanColumn> columns = kanbanColumnService.getAllColumns();
        assertEquals(2, columns.size());
        verify(kanbanColumnRepository, times(1)).findAll();
    }

    @Test
    void testCreateColumn() {
        KanbanColumn column = new KanbanColumn();
        when(kanbanColumnRepository.save(column)).thenReturn(column);

        KanbanColumn created = kanbanColumnService.createColumn(column);
        assertNotNull(created);
        verify(kanbanColumnRepository, times(1)).save(column);
    }

    @Test
    void testUpdateColumn() {
        KanbanColumn existing = new KanbanColumn();
        existing.setId(1L);
        existing.setName("Old Name");

        KanbanColumn updated = new KanbanColumn();
        updated.setId(1L);
        updated.setName("New Name");

        when(kanbanColumnRepository.findById(1L)).thenReturn(Optional.of(existing));
        when(kanbanColumnRepository.save(any(KanbanColumn.class))).thenReturn(updated);

        KanbanColumn result = kanbanColumnService.updateColumn(1L, updated);
        assertEquals("New Name", result.getName());
    }
}