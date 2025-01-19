package com.yourapp.controller;

import com.yourapp.model.KanbanColumn;
import com.yourapp.service.KanbanColumnService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/columns")
public class KanbanColumnController {

    @Autowired
    private KanbanColumnService kanbanColumnService;

    @GetMapping
    public List<KanbanColumn> getAllColumns() {
        return kanbanColumnService.getAllColumns();
    }

    @PostMapping
    public KanbanColumn createColumn(@RequestBody KanbanColumn column) {
        return kanbanColumnService.createColumn(column);
    }

    @PutMapping("/{id}")
    public KanbanColumn updateColumn(@PathVariable Long id, @RequestBody KanbanColumn column) {
        return kanbanColumnService.updateColumn(id, column);
    }

    @DeleteMapping("/{id}")
    public void deleteColumn(@PathVariable Long id) {
        kanbanColumnService.deleteColumn(id);
    }
}