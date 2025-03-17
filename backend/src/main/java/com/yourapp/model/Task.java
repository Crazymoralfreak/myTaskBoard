package com.yourapp.model;

import jakarta.persistence.*;
import jakarta.persistence.Column;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;
import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import java.util.List;
import java.util.ArrayList;
import lombok.ToString;
import lombok.EqualsAndHashCode;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "tasks")
public class Task {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String title;
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    @Column(name = "start_date")
    private LocalDateTime startDate;
    
    @Column(name = "end_date")
    private LocalDateTime endDate;
    
    @Column(name = "days_remaining")
    private Long daysRemaining;
    
    @Column(nullable = false)
    private Integer position;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "status_id")
    @JsonBackReference("task-status")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private TaskStatus customStatus;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "type_id")
    @JsonBackReference("task-type")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private TaskType type;
    
    @Enumerated(EnumType.STRING)
    @Column
    private TaskPriority priority;
    
    @ElementCollection
    @CollectionTable(name = "task_tags", joinColumns = @JoinColumn(name = "task_id"))
    @Column(name = "tag")
    private Set<String> tags = new HashSet<>();
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "column_id")
    @JsonBackReference("column-tasks")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private BoardColumn column;
    
    @JsonBackReference("task-assignee")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assignee_id")
    private User assignee;
    
    @JsonManagedReference("task-comments")
    @OneToMany(mappedBy = "task", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Comment> comments = new ArrayList<>();
    
    @JsonManagedReference("task-attachments")
    @OneToMany(mappedBy = "task", cascade = CascadeType.ALL)
    private List<Attachment> attachments;
    
    @ManyToMany
    @JoinTable(
        name = "task_watchers",
        joinColumns = @JoinColumn(name = "task_id"),
        inverseJoinColumns = @JoinColumn(name = "user_id")
    )
    @JsonBackReference("task-watchers")
    private Set<User> watchers = new HashSet<>();
    
    @OneToMany(mappedBy = "parentTask", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference("task-subtasks")
    private List<Subtask> subtasks = new ArrayList<>();

    @OneToMany(mappedBy = "task", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonBackReference("task-history")
    private List<TaskHistory> history = new ArrayList<>();
    
    @OneToMany(mappedBy = "task", cascade = CascadeType.ALL)
    @JsonManagedReference("task-timetracking")
    private List<TimeTracking> timeTrackings = new ArrayList<>();
    
    @OneToMany(mappedBy = "task", cascade = CascadeType.ALL)
    @JsonManagedReference("task-timeestimate")
    private List<TimeEstimate> timeEstimates = new ArrayList<>();
    
    @OneToMany(mappedBy = "sourceTask", cascade = CascadeType.ALL)
    @JsonManagedReference("task-source-links")
    private List<TaskLink> sourceLinks = new ArrayList<>();
    
    @OneToMany(mappedBy = "targetTask", cascade = CascadeType.ALL)
    @JsonManagedReference("task-target-links")
    private List<TaskLink> targetLinks = new ArrayList<>();
}