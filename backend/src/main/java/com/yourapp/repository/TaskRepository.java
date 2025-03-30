package com.yourapp.repository;

import com.yourapp.model.Task;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {
    @Query("SELECT t FROM Task t LEFT JOIN FETCH t.type LEFT JOIN FETCH t.customStatus WHERE t.column.id = :columnId")
    List<Task> findByColumnId(@Param("columnId") Long columnId);
    
    @Query("SELECT t FROM Task t LEFT JOIN FETCH t.type LEFT JOIN FETCH t.customStatus WHERE t.column.id = :columnId ORDER BY t.position ASC")
    List<Task> findByColumnIdOrderByPositionAsc(@Param("columnId") Long columnId);
    
    List<Task> findAllByEndDateIsNotNull();
    
    @Query("SELECT t FROM Task t WHERE t.endDate < :date AND t.daysRemaining >= :daysRemaining")
    List<Task> findAllByEndDateBeforeAndDaysRemainingGreaterThanEqual(
        @Param("date") LocalDateTime date, 
        @Param("daysRemaining") Long daysRemaining
    );
    
    @Query("SELECT t FROM Task t WHERE t.endDate IS NOT NULL " +
           "AND t.endDate > CURRENT_TIMESTAMP " +
           "AND t.daysRemaining <= :days")
    List<Task> findTasksEndingSoon(@Param("days") Long days);

    @Query("SELECT t FROM Task t LEFT JOIN FETCH t.type LEFT JOIN FETCH t.customStatus WHERE t.id = :id")
    Optional<Task> findByIdWithTypeAndStatus(@Param("id") Long id);
}