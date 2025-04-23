package com.yourapp.repository;

import com.yourapp.model.TaskTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface TaskTemplateRepository extends JpaRepository<TaskTemplate, Long> {
    @Query("SELECT t FROM TaskTemplate t " +
           "LEFT JOIN FETCH t.type " +
           "LEFT JOIN FETCH t.status " +
           "WHERE t.board.id = :boardId")
    List<TaskTemplate> findByBoardId(@Param("boardId") String boardId);

    @Query("SELECT t FROM TaskTemplate t " +
           "LEFT JOIN FETCH t.type " +
           "LEFT JOIN FETCH t.status " +
           "WHERE t.createdBy.id = :userId")
    List<TaskTemplate> findByCreatedById(@Param("userId") Long userId);
} 