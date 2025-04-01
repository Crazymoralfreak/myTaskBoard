package com.yourapp.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;
import lombok.EqualsAndHashCode;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "notification_preferences")
public class NotificationPreferences {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @OneToOne
    @JoinColumn(name = "user_id")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @JsonIgnore
    private User user;
    
    private boolean globalNotificationsEnabled;
    private boolean taskAssignedNotifications;
    private boolean taskMovedNotifications;
    private boolean taskUpdatedNotifications;
    private boolean mentionNotifications;
}
