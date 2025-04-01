package com.yourapp.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import java.util.List;
import lombok.ToString;
import lombok.EqualsAndHashCode;

@Entity
@Table(name = "task_types")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TaskType {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String name;
    
    @Column(nullable = false)
    private String color;
    
    @Column
    private String icon;
    
    @Column(name = "is_default")
    private boolean isDefault;
    
    @Column(name = "is_custom")
    private boolean isCustom;
    
    @Column(nullable = false)
    private Integer position;
    
    @JsonBackReference("board-types")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "board_id")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Board board;
    
    @JsonManagedReference("task-type")
    @OneToMany(mappedBy = "type")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private List<Task> tasks;
} 