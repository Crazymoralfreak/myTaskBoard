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
@Table(name = "columns")
public class Column {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String title;
    private Integer position;
    
    @ManyToOne
    @JoinColumn(name = "board_id")
    private Board board;
    
    @OneToMany(mappedBy = "column", cascade = CascadeType.ALL)
    private List<Task> tasks;
}