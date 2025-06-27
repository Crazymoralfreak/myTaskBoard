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
    private Boolean globalNotificationsEnabled = true;
    
    @Column(name = "email_notifications_enabled")
    @Builder.Default
    private Boolean emailNotificationsEnabled = true;
    
    @Column(name = "telegram_notifications_enabled")
    @Builder.Default
    private Boolean telegramNotificationsEnabled = false;
    
    @Column(name = "browser_notifications_enabled")
    @Builder.Default
    private Boolean browserNotificationsEnabled = true;
    
    // Настройки по типам уведомлений
    @Column(name = "board_invite_notifications")
    @Builder.Default
    private Boolean boardInviteNotifications = true;
    
    @Column(name = "task_assigned_notifications")
    @Builder.Default
    private Boolean taskAssignedNotifications = true;
    
    @Column(name = "task_status_changed_notifications")
    @Builder.Default
    private Boolean taskStatusChangedNotifications = true;
    
    @Column(name = "task_created_notifications")
    @Builder.Default
    private Boolean taskCreatedNotifications = false;
    
    @Column(name = "task_updated_notifications")
    @Builder.Default
    private Boolean taskUpdatedNotifications = false;
    
    @Column(name = "task_deleted_notifications")
    @Builder.Default
    private Boolean taskDeletedNotifications = true;
    
    @Column(name = "task_comment_added_notifications")
    @Builder.Default
    private Boolean taskCommentAddedNotifications = true;
    
    @Column(name = "mention_notifications")
    @Builder.Default
    private Boolean mentionNotifications = true;
    
    @Column(name = "subtask_created_notifications")
    @Builder.Default
    private Boolean subtaskCreatedNotifications = false;
    
    @Column(name = "subtask_completed_notifications")
    @Builder.Default
    private Boolean subtaskCompletedNotifications = true;
    
    @Column(name = "board_member_added_notifications")
    @Builder.Default
    private Boolean boardMemberAddedNotifications = true;
    
    @Column(name = "board_member_removed_notifications")
    @Builder.Default
    private Boolean boardMemberRemovedNotifications = true;
    
    @Column(name = "attachment_added_notifications")
    @Builder.Default
    private Boolean attachmentAddedNotifications = false;
    
    @Column(name = "deadline_reminder_notifications")
    @Builder.Default
    private Boolean deadlineReminderNotifications = true;
    
    @Column(name = "role_changed_notifications")
    @Builder.Default
    private Boolean roleChangedNotifications = true;
    
    @Column(name = "task_due_soon_notifications")
    @Builder.Default
    private Boolean taskDueSoonNotifications = true;
    
    @Column(name = "task_overdue_notifications")
    @Builder.Default
    private Boolean taskOverdueNotifications = true;
    
    // Настройки приоритетов
    @Column(name = "only_high_priority_notifications")
    @Builder.Default
    private Boolean onlyHighPriorityNotifications = false;
    
    @Column(name = "group_similar_notifications")
    @Builder.Default
    private Boolean groupSimilarNotifications = true;
    
    @PrePersist
    public void prePersist() {
        // Метод для дополнительной инициализации при сохранении
        // Значения по умолчанию уже установлены через @Builder.Default
    }
}
