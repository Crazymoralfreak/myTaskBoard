package com.yourapp.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.ArrayList;
import java.util.List;
import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonManagedReference;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "board_columns")
public class BoardColumn {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String name;
    
    @Column(nullable = false)
    private Integer position;
    
    @Column(name = "color", nullable = false)
    private String color = "#E0E0E0"; // Цвет по умолчанию
    
    @JsonBackReference("board-columns")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "board_id")
    private Board board;
    
    @JsonManagedReference("column-tasks")
    @OneToMany(mappedBy = "column", cascade = CascadeType.ALL)
    private List<Task> tasks = new ArrayList<>();
} 