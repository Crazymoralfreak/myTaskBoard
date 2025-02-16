package com.yourapp.model;

import jakarta.persistence.*;
import jakarta.persistence.Column;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "task_statuses")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaskStatusEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String name;
    @Column(nullable = false)
    private String color;
    @Column(nullable = false)
    private Integer position;
    @Column(name = "is_default")
    private boolean isDefault;
    private boolean isCustom;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "board_id")
    private Board board;
} 