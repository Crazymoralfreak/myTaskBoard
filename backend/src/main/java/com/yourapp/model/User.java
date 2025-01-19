package com.yourapp.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Getter
@Setter
@ToString
@NoArgsConstructor
@AllArgsConstructor
@Entity
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String username;
    private String password;
    private String email;
    private Long telegramChatId;

    @Embedded
    private NotificationPreferences notificationPreferences = new NotificationPreferences();
}

@Embeddable
@Getter
@Setter
class NotificationPreferences {
    private boolean globalNotificationsEnabled = true;
    private boolean taskAssignedNotifications = true;
    private boolean taskUpdatedNotifications = true;
    private boolean taskMovedNotifications = true;
    private boolean mentionNotifications = true;
}