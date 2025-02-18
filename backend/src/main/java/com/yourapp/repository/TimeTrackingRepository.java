package com.yourapp.repository;

import com.yourapp.model.TimeTracking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface TimeTrackingRepository extends JpaRepository<TimeTracking, Long> {
    List<TimeTracking> findByTaskId(Long taskId);
    Optional<TimeTracking> findByTaskIdAndEndedAtIsNull(Long taskId);
    void deleteByTaskId(Long taskId);
} 