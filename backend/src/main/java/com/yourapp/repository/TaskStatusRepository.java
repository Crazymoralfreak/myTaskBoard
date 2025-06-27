package com.yourapp.repository;

import com.yourapp.model.Board;
import com.yourapp.model.TaskStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface TaskStatusRepository extends JpaRepository<TaskStatus, Long> {
    List<TaskStatus> findByBoardId(String boardId);
    List<TaskStatus> findByBoardIdOrderByPositionAsc(String boardId);
    List<TaskStatus> findByBoardOrderByPosition(Board board);
} 