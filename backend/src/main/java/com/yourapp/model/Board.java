package com.yourapp.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.ArrayList;
import java.util.List;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.fasterxml.jackson.annotation.JsonBackReference;

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
    
    @JsonBackReference("board-owner")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id")
    private User owner;
    
    @JsonManagedReference("board-columns")
    @OneToMany(mappedBy = "board", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<BoardColumn> columns = new ArrayList<>();
    
    @JsonManagedReference("board-statuses")
    @OneToMany(mappedBy = "board", cascade = CascadeType.ALL)
    private List<TaskStatus> taskStatuses = new ArrayList<>();
    
    public void addColumn(BoardColumn column) {
        column.setBoard(this);
        column.setPosition(columns.size());
        columns.add(column);
    }
    
    public void removeColumn(BoardColumn column) {
        columns.remove(column);
        column.setBoard(null);
    }
    
    public void moveColumn(BoardColumn column, int newPosition) {
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