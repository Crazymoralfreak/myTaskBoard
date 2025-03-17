package com.yourapp.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import jakarta.persistence.CascadeType;
import jakarta.persistence.OneToMany;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import com.yourapp.dto.UserDto;
import java.util.Collection;
import java.util.List;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import java.time.LocalDateTime;
import jakarta.persistence.OneToMany;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import java.util.Set;
import java.util.HashSet;
import lombok.ToString;
import lombok.EqualsAndHashCode;
import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "users")
public class User implements UserDetails {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(unique = true, nullable = false)
    private String email;
    
    @Column(name = "avatar_url")
    private String avatarUrl;
    
    @Column(nullable = false)
    private String username;
    
    @Column(name = "password_hash", nullable = false)
    private String password;
    
    private String telegramId;
    private String telegramChatId;

    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private NotificationPreferences notificationPreferences;

    @JsonManagedReference
    @OneToMany(mappedBy = "owner")
    private List<Board> boards;
    
    @JsonIgnore
    @OneToMany(mappedBy = "assignee")
    private List<Task> assignedTasks;
    
    @JsonManagedReference
    @OneToMany(mappedBy = "author")
    private List<Comment> comments;

    @OneToMany(mappedBy = "createdBy")
    @JsonIgnore
    private Set<TimeTracking> timeTrackings = new HashSet<>();

    @OneToMany(mappedBy = "createdBy")
    @JsonIgnore
    private Set<TimeEstimate> timeEstimates = new HashSet<>();

    @OneToMany(mappedBy = "createdBy")
    @JsonIgnore
    private Set<TaskLink> taskLinks = new HashSet<>();

    @OneToMany(mappedBy = "uploadedBy")
    @JsonManagedReference("user-uploads")
    private Set<Attachment> uploads = new HashSet<>();

    @ManyToMany(mappedBy = "watchers")
    @JsonManagedReference("task-watchers")
    private Set<Task> watchedTasks = new HashSet<>();

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_USER"));
    }

    @Override
    public String getUsername() {
        return this.username;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return true;
    }

    public UserDto toDto() {
        return UserDto.builder()
                .id(this.id)
                .email(this.email)
                .username(this.username)
                .build();
    }
}

