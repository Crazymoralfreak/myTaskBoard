package com.yourapp.model;

import jakarta.persistence.*;
import lombok.Data;
import java.util.List;

@Entity
@Data
public class Column {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String name;
    private String description;
    private int position;
    private int taskLimit;
    private boolean isCollapsed;
    
    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "column_id")
    private List<Task> tasks;
    
    @ManyToOne
    @JoinColumn(name = "board_id")
    private Board board;
    
    public boolean isFull() {
        return taskLimit > 0 && tasks.size() >= taskLimit;
    }
    
    public boolean canAcceptTask() {
        return taskLimit == 0 || tasks.size() < taskLimit;
    }
}