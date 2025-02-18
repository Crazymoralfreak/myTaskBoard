package com.yourapp.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;
import com.fasterxml.jackson.annotation.JsonBackReference;

@Entity
@Data
@Table(name = "comments")
public class Comment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String content;
    private LocalDateTime createdAt;
    
    @JsonBackReference
    @ManyToOne
    @JoinColumn(name = "author_id")
    private User author;
    
    @JsonBackReference("task-comments")
    @ManyToOne
    @JoinColumn(name = "task_id")
    private Task task;
}