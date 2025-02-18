package com.yourapp.repository;

import com.yourapp.model.TimeEstimate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface TimeEstimateRepository extends JpaRepository<TimeEstimate, Long> {
    List<TimeEstimate> findByTaskId(Long taskId);
    Optional<TimeEstimate> findFirstByTaskIdOrderByCreatedAtDesc(Long taskId);
    void deleteByTaskId(Long taskId);
} 