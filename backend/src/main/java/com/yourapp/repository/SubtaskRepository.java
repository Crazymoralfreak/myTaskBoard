package com.yourapp.repository;

import com.yourapp.model.Subtask;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface SubtaskRepository extends JpaRepository<Subtask, Long> {
    List<Subtask> findByParentTaskId(Long taskId);
    
    List<Subtask> findByParentTaskIdOrderByPositionAsc(Long taskId);
    
    List<Subtask> findByAssigneeId(Long userId);
    
    @Query("SELECT MAX(s.position) FROM Subtask s WHERE s.parentTask.id = :taskId")
    Integer findMaxPositionByTaskId(@Param("taskId") Long taskId);
} 