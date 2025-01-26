package com.yourapp.model;

import jakarta.persistence.Embeddable;
import lombok.Getter;
import lombok.Setter;

@Embeddable
@Getter
@Setter
public class NotificationPreferences {
    private boolean globalNotificationsEnabled = true;
    private boolean taskAssignedNotifications = true;
    private boolean taskUpdatedNotifications = true;
    private boolean taskMovedNotifications = true;
    private boolean mentionNotifications = true;
}
