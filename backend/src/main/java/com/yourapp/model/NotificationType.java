package com.yourapp.model;

/**
 * Перечисление типов уведомлений
 */
public enum NotificationType {
    /**
     * Приглашение на доску
     */
    BOARD_INVITE,
    
    /**
     * Назначение задачи
     */
    TASK_ASSIGNED,
    
    /**
     * Скоро срок выполнения задачи
     */
    TASK_DUE_SOON,
    
    /**
     * Просрочена задача
     */
    TASK_OVERDUE,
    
    /**
     * Упоминание в комментарии
     */
    NEW_COMMENT_MENTION,
    
    /**
     * Изменен статус задачи
     */
    TASK_STATUS_CHANGED
} 