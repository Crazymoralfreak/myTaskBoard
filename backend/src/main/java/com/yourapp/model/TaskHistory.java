package com.yourapp.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "task_history")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaskHistory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "changed_by_id")
    private User changedBy;
    
    private String fieldChanged;
    private String oldValue;
    private String newValue;
    private LocalDateTime changedAt;
    
    @ManyToOne
    @JoinColumn(name = "task_id")
    private Task task;
}