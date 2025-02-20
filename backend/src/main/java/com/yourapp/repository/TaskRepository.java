package com.yourapp.repository;

import com.yourapp.model.Task;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {
    List<Task> findByColumnId(Long columnId);
    
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
}