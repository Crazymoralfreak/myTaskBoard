package com.yourapp.model;

import jakarta.persistence.*;
import jakarta.persistence.Column;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;
import com.yourapp.model.enums.TaskStatus;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "tasks")
public class Task {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String title;
    private String description;
    private Integer position;
    
    @Column(name = "due_date")
    private LocalDateTime dueDate;
    
    // Системный статус
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private TaskStatus systemStatus = TaskStatus.TODO;
    
    // Кастомный статус
    @ManyToOne
    @JoinColumn(name = "status_id")
    private TaskStatusEntity customStatus;
    
    @Enumerated(EnumType.STRING)
    private TaskPriority priority;
    
    @ElementCollection
    @CollectionTable(name = "task_tags", joinColumns = @JoinColumn(name = "task_id"))
    @Column(name = "tags")
    private Set<String> tags = new HashSet<>();
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "column_id")
    private BoardColumn column;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assignee_id")
    private User assignee;
}