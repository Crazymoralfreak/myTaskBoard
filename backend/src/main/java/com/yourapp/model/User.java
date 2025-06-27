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
import org.hibernate.annotations.UpdateTimestamp;
import java.util.Date;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;

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
    
    @Column(unique = true)
    private String telegramId;
    
    private String telegramChatId;

    @Enumerated(EnumType.STRING)
    @Column(name = "auth_type", nullable = false)
    private AuthType authType = AuthType.WEB;

    @Column(name = "display_name")
    private String displayName;

    @Column(name = "phone_number")
    private String phoneNumber;

    @Column(name = "position")
    private String position;

    @Column(name = "bio", length = 1000)
    private String bio;

    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @Column(name = "last_password_reset_date")
    private LocalDateTime lastPasswordResetDate;

    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @JsonIgnore
    private NotificationPreferences notificationPreferences;

    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @JsonIgnore
    private UserSettings userSettings;

    @JsonIgnore
    @OneToMany(mappedBy = "owner")
    private List<Board> boards;
    
    @JsonIgnore
    @OneToMany(mappedBy = "assignee")
    private List<Task> assignedTasks;
    
    @JsonIgnore
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
    @JsonIgnore
    private Set<Task> watchedTasks = new HashSet<>();

    @PrePersist
    public void prePersist() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now();
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_USER"));
    }

    @Override
    public String getPassword() {
        return this.password;
    }
    
    public void setPassword(String password) {
        this.password = password;
    }
    
    @Override
    public String getUsername() {
        return this.username;
    }
    
    public void setUsername(String username) {
        this.username = username;
    }

    public Long getId() {
        return this.id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public String getEmail() {
        return this.email;
    }
    
    public void setEmail(String email) {
        this.email = email;
    }
    
    public String getAvatarUrl() {
        return this.avatarUrl;
    }
    
    public void setAvatarUrl(String avatarUrl) {
        this.avatarUrl = avatarUrl;
    }
    
    public String getPhoneNumber() {
        return this.phoneNumber;
    }
    
    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
    }
    
    public String getPosition() {
        return this.position;
    }
    
    public void setPosition(String position) {
        this.position = position;
    }
    
    public String getBio() {
        return this.bio;
    }
    
    public void setBio(String bio) {
        this.bio = bio;
    }
    
    public String getTelegramId() {
        return this.telegramId;
    }
    
    public void setTelegramId(String telegramId) {
        this.telegramId = telegramId;
    }
    
    public String getTelegramChatId() {
        return this.telegramChatId;
    }
    
    public void setTelegramChatId(String telegramChatId) {
        this.telegramChatId = telegramChatId;
    }
    
    public String getDisplayName() {
        return this.displayName;
    }
    
    public void setDisplayName(String displayName) {
        this.displayName = displayName;
    }
    
    public LocalDateTime getLastPasswordResetDate() {
        return this.lastPasswordResetDate;
    }
    
    public void setLastPasswordResetDate(LocalDateTime lastPasswordResetDate) {
        this.lastPasswordResetDate = lastPasswordResetDate;
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

    public NotificationPreferences getNotificationPreferences() {
        return this.notificationPreferences;
    }
    
    public void setNotificationPreferences(NotificationPreferences notificationPreferences) {
        this.notificationPreferences = notificationPreferences;
    }
    
    public UserSettings getUserSettings() {
        return this.userSettings;
    }
    
    public void setUserSettings(UserSettings userSettings) {
        this.userSettings = userSettings;
    }

    public UserDto toDto() {
        return UserDto.builder()
                .id(this.id)
                .email(this.email)
                .username(this.username)
                .displayName(this.displayName)
                .avatarUrl(this.avatarUrl)
                .phoneNumber(this.phoneNumber)
                .position(this.position)
                .bio(this.bio)
                .build();
    }
}

