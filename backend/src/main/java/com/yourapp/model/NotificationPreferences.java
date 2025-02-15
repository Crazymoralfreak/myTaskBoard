package com.yourapp.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "notification_preferences")
public class NotificationPreferences {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Builder.Default
    private boolean globalNotificationsEnabled = true;
    
    @Builder.Default
    private boolean taskAssignedNotifications = true;
    
    @Builder.Default
    private boolean taskUpdatedNotifications = true;
    
    @Builder.Default
    private boolean taskMovedNotifications = true;
    
    @Builder.Default
    private boolean mentionNotifications = true;
    
    @OneToOne
    @JoinColumn(name = "user_id")
    private User user;
}
