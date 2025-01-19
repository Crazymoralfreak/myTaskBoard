package com.yourapp.model;

import jakarta.persistence.*;
import lombok.Data;
import java.util.ArrayList;
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

    public void addColumn(Column column) {
        if (columns == null) {
            columns = new ArrayList<>();
        }
        column.setPosition(columns.size());
        columns.add(column);
    }

    public void removeColumn(Column column) {
        if (columns != null) {
            columns.remove(column);
            updateColumnPositions();
        }
    }

    public void moveColumn(Column column, int newPosition) {
        if (columns != null && columns.contains(column)) {
            columns.remove(column);
            columns.add(newPosition, column);
            updateColumnPositions();
        }
    }

    private void updateColumnPositions() {
        for (int i = 0; i < columns.size(); i++) {
            columns.get(i).setPosition(i);
        }
    }

    public int getColumnCount() {
        return columns != null ? columns.size() : 0;
    }
    
    public boolean hasColumns() {
        return columns != null && !columns.isEmpty();
    }
}