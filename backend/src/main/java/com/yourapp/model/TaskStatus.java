package com.yourapp.model;

import jakarta.persistence.*;
import jakarta.persistence.Column;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import java.util.List;

@Entity
@Table(name = "task_statuses")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TaskStatus {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String name;
    
    @Column(nullable = false)
    private String color;
    
    @Column(nullable = false)
    private Integer position;
    
    @Column(name = "is_default")
    private boolean isDefault;
    
    @Column(name = "is_custom")
    private boolean isCustom;
    
    @JsonBackReference("board-statuses")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "board_id")
    private Board board;
    
    @JsonManagedReference("task-status")
    @OneToMany(mappedBy = "customStatus")
    private List<Task> tasks;
} 