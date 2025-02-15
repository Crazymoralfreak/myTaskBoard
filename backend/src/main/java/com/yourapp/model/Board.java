package com.yourapp.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "boards")
public class Board {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String name;
    private String description;
    private boolean archived;
    
    @ManyToOne
    @JoinColumn(name = "owner_id")
    private User owner;
    
    @OneToMany(mappedBy = "board", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Column> columns = new ArrayList<>();
    
    public void addColumn(Column column) {
        column.setBoard(this);
        column.setPosition(columns.size());
        columns.add(column);
    }
    
    public void removeColumn(Column column) {
        columns.remove(column);
        column.setBoard(null);
    }
    
    public void moveColumn(Column column, int newPosition) {
        columns.remove(column);
        columns.add(newPosition, column);
        reorderColumns();
    }
    
    private void reorderColumns() {
        for (int i = 0; i < columns.size(); i++) {
            columns.get(i).setPosition(i);
        }
    }
}