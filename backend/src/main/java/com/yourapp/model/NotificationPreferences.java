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
    
    // Глобальные настройки
    @Column(name = "global_notifications_enabled")
    @Builder.Default
    private boolean globalNotificationsEnabled = true;
    
    @Column(name = "email_notifications_enabled")
    @Builder.Default
    private boolean emailNotificationsEnabled = true;
    
    @Column(name = "telegram_notifications_enabled")
    @Builder.Default
    private boolean telegramNotificationsEnabled = false;
    
    @Column(name = "browser_notifications_enabled")
    @Builder.Default
    private boolean browserNotificationsEnabled = true;
    
    // Настройки по типам уведомлений
    @Column(name = "board_invite_notifications")
    @Builder.Default
    private boolean boardInviteNotifications = true;
    
    @Column(name = "task_assigned_notifications")
    @Builder.Default
    private boolean taskAssignedNotifications = true;
    
    @Column(name = "task_status_changed_notifications")
    @Builder.Default
    private boolean taskStatusChangedNotifications = true;
    
    @Column(name = "task_created_notifications")
    @Builder.Default
    private boolean taskCreatedNotifications = false;
    
    @Column(name = "task_updated_notifications")
    @Builder.Default
    private boolean taskUpdatedNotifications = false;
    
    @Column(name = "task_deleted_notifications")
    @Builder.Default
    private boolean taskDeletedNotifications = true;
    
    @Column(name = "task_comment_added_notifications")
    @Builder.Default
    private boolean taskCommentAddedNotifications = true;
    
    @Column(name = "mention_notifications")
    @Builder.Default
    private boolean mentionNotifications = true;
    
    @Column(name = "subtask_created_notifications")
    @Builder.Default
    private boolean subtaskCreatedNotifications = false;
    
    @Column(name = "subtask_completed_notifications")
    @Builder.Default
    private boolean subtaskCompletedNotifications = true;
    
    @Column(name = "board_member_added_notifications")
    @Builder.Default
    private boolean boardMemberAddedNotifications = true;
    
    @Column(name = "board_member_removed_notifications")
    @Builder.Default
    private boolean boardMemberRemovedNotifications = true;
    
    @Column(name = "attachment_added_notifications")
    @Builder.Default
    private boolean attachmentAddedNotifications = false;
    
    @Column(name = "deadline_reminder_notifications")
    @Builder.Default
    private boolean deadlineReminderNotifications = true;
    
    @Column(name = "role_changed_notifications")
    @Builder.Default
    private boolean roleChangedNotifications = true;
    
    @Column(name = "task_due_soon_notifications")
    @Builder.Default
    private boolean taskDueSoonNotifications = true;
    
    @Column(name = "task_overdue_notifications")
    @Builder.Default
    private boolean taskOverdueNotifications = true;
    
    // Настройки приоритетов
    @Column(name = "only_high_priority_notifications")
    @Builder.Default
    private boolean onlyHighPriorityNotifications = false;
    
    @Column(name = "group_similar_notifications")
    @Builder.Default
    private boolean groupSimilarNotifications = true;
    
    @PrePersist
    public void prePersist() {
        // Метод для дополнительной инициализации при сохранении
        // Значения по умолчанию уже установлены через @Builder.Default
    }
}
