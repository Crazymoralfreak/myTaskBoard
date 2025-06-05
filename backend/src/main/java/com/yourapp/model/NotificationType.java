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
    TASK_STATUS_CHANGED,
    
    /**
     * Создана новая задача
     */
    TASK_CREATED,
    
    /**
     * Обновлена задача
     */
    TASK_UPDATED,
    
    /**
     * Удалена задача
     */
    TASK_DELETED,
    
    /**
     * Добавлен комментарий к задаче
     */
    TASK_COMMENT_ADDED,
    
    /**
     * Создана подзадача
     */
    SUBTASK_CREATED,
    
    /**
     * Завершена подзадача
     */
    SUBTASK_COMPLETED,
    
    /**
     * Добавлен участник доски
     */
    BOARD_MEMBER_ADDED,
    
    /**
     * Удален участник доски
     */
    BOARD_MEMBER_REMOVED,
    
    /**
     * Добавлено вложение к задаче
     */
    ATTACHMENT_ADDED,
    
    /**
     * Напоминание о дедлайне
     */
    DEADLINE_REMINDER,
    
    /**
     * Изменена роль пользователя
     */
    ROLE_CHANGED
} 