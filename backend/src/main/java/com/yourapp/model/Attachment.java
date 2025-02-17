package com.yourapp.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;
import com.fasterxml.jackson.annotation.JsonBackReference;

@Entity
@Data
public class Attachment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String fileName;
    private String filePath;
    private LocalDateTime uploadedAt;
    
    @JsonBackReference
    @ManyToOne
    @JoinColumn(name = "uploaded_by_id")
    private User uploadedBy;
}