package com.yourapp.repository;

import com.yourapp.model.TaskType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface TaskTypeRepository extends JpaRepository<TaskType, Long> {
    List<TaskType> findByBoardId(String boardId);
    List<TaskType> findByBoardIdOrderByPositionAsc(String boardId);
} 