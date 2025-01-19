package com.yourapp.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Data
public class TaskHistory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String fieldChanged;
    private String oldValue;
    private String newValue;
    private LocalDateTime changedAt;
    
    @ManyToOne
    @JoinColumn(name = "changed_by_id")
    private User changedBy;
    
    @ManyToOne
    @JoinColumn(name = "task_id")
    private Task task;
}