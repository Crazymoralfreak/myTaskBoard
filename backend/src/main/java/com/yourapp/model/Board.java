package com.yourapp.model;

import jakarta.persistence.*;
import lombok.Data;
import java.util.List;

@Entity
@Data
public class Board {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String name;
    private String description;
    private boolean isArchived;
    
    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @JoinColumn(name = "board_id")
    @OrderBy("position ASC")
    private List<Column> columns;
    
    @ManyToOne
    @JoinColumn(name = "user_id")
    private User owner;
    
    public int getColumnCount() {
        return columns != null ? columns.size() : 0;
    }
    
    public boolean hasColumns() {
        return columns != null && !columns.isEmpty();
    }
}