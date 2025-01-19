package com.yourapp.service;

import com.yourapp.model.KanbanColumn;
import com.yourapp.repository.KanbanColumnRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class KanbanColumnService {

    @Autowired
    private KanbanColumnRepository kanbanColumnRepository;

    public List<KanbanColumn> getAllColumns() {
        return kanbanColumnRepository.findAll();
    }

    public KanbanColumn createColumn(KanbanColumn column) {
        return kanbanColumnRepository.save(column);
    }

    public KanbanColumn updateColumn(Long id, KanbanColumn column) {
        column.setId(id);
        return kanbanColumnRepository.save(column);
    }

    public void deleteColumn(Long id) {
        kanbanColumnRepository.deleteById(id);
    }
}