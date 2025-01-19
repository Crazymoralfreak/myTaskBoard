package com.yourapp.repository;

import com.yourapp.model.KanbanColumn;
import org.springframework.data.jpa.repository.JpaRepository;

public interface KanbanColumnRepository extends JpaRepository<KanbanColumn, Long> {
}