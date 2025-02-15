package com.yourapp.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

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
    private String priority;
    private LocalDateTime dueDate;
    
    @ElementCollection
    @Builder.Default
    private Set<String> tags = new HashSet<>();
    
    @ManyToOne
    @JoinColumn(name = "column_id")
    private Column column;
    
    @ManyToOne
    @JoinColumn(name = "assignee_id")
    private User assignee;
}