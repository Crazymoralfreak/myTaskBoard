package com.yourapp.repository;

import com.yourapp.model.TaskLink;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface TaskLinkRepository extends JpaRepository<TaskLink, Long> {
    List<TaskLink> findBySourceTaskId(Long sourceTaskId);
    List<TaskLink> findByTargetTaskId(Long targetTaskId);
    Optional<TaskLink> findBySourceTaskIdAndTargetTaskId(Long sourceTaskId, Long targetTaskId);
    void deleteBySourceTaskIdOrTargetTaskId(Long taskId, Long sameTaskId);
} 