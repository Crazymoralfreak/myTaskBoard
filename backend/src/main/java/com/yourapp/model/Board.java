package com.yourapp.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
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
    
    private String title;
    
    @ManyToOne
    @JoinColumn(name = "owner_id")
    private User owner;
    
    @OneToMany(mappedBy = "board", cascade = CascadeType.ALL)
    private List<Column> columns;
    
    public void addColumn(Column column) {
        columns.add(column);
        column.setBoard(this);
        column.setPosition(columns.size() - 1);
    }
    
    public void removeColumn(Column column) {
        columns.remove(column);
        column.setBoard(null);
        
        // Пересчитываем позиции оставшихся колонок
        for (int i = 0; i < columns.size(); i++) {
            columns.get(i).setPosition(i);
        }
    }
}