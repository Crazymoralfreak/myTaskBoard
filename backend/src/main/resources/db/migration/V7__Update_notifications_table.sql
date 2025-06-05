-- Добавление новых полей к таблице уведомлений
ALTER TABLE notifications 
ADD COLUMN priority VARCHAR(20) DEFAULT 'NORMAL',
ADD COLUMN group_key VARCHAR(255),
ADD COLUMN is_archived BOOLEAN DEFAULT FALSE,
ADD COLUMN read_at TIMESTAMP;

-- Создание индексов для новых полей
CREATE INDEX idx_notifications_priority ON notifications(priority);
CREATE INDEX idx_notifications_group_key ON notifications(group_key);
CREATE INDEX idx_notifications_is_archived ON notifications(is_archived);
CREATE INDEX idx_notifications_read_at ON notifications(read_at);

-- Создание составного индекса для оптимизации запросов активных уведомлений
CREATE INDEX idx_notifications_active ON notifications(user_id, is_read, is_archived, priority, created_at);

-- Комментарии к новым полям
COMMENT ON COLUMN notifications.priority IS 'Приоритет уведомления (CRITICAL, HIGH, NORMAL, LOW)';
COMMENT ON COLUMN notifications.group_key IS 'Ключ для группировки похожих уведомлений';
COMMENT ON COLUMN notifications.is_archived IS 'Флаг архивирования уведомления';
COMMENT ON COLUMN notifications.read_at IS 'Время прочтения уведомления';

-- Обновление настроек уведомлений в таблице notification_preferences
DO $$
BEGIN
    -- Проверяем, существует ли таблица notification_preferences
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'notification_preferences') THEN
        -- Добавляем новые поля, если они не существуют
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'notification_preferences' AND column_name = 'email_notifications_enabled') THEN
            ALTER TABLE notification_preferences 
            ADD COLUMN email_notifications_enabled BOOLEAN DEFAULT TRUE,
            ADD COLUMN telegram_notifications_enabled BOOLEAN DEFAULT FALSE,
            ADD COLUMN browser_notifications_enabled BOOLEAN DEFAULT TRUE,
            ADD COLUMN board_invite_notifications BOOLEAN DEFAULT TRUE,
            ADD COLUMN task_status_changed_notifications BOOLEAN DEFAULT TRUE,
            ADD COLUMN task_created_notifications BOOLEAN DEFAULT FALSE,
            ADD COLUMN task_deleted_notifications BOOLEAN DEFAULT TRUE,
            ADD COLUMN task_comment_added_notifications BOOLEAN DEFAULT TRUE,
            ADD COLUMN subtask_created_notifications BOOLEAN DEFAULT FALSE,
            ADD COLUMN subtask_completed_notifications BOOLEAN DEFAULT TRUE,
            ADD COLUMN board_member_added_notifications BOOLEAN DEFAULT TRUE,
            ADD COLUMN board_member_removed_notifications BOOLEAN DEFAULT TRUE,
            ADD COLUMN attachment_added_notifications BOOLEAN DEFAULT FALSE,
            ADD COLUMN deadline_reminder_notifications BOOLEAN DEFAULT TRUE,
            ADD COLUMN role_changed_notifications BOOLEAN DEFAULT TRUE,
            ADD COLUMN task_due_soon_notifications BOOLEAN DEFAULT TRUE,
            ADD COLUMN task_overdue_notifications BOOLEAN DEFAULT TRUE,
            ADD COLUMN only_high_priority_notifications BOOLEAN DEFAULT FALSE,
            ADD COLUMN group_similar_notifications BOOLEAN DEFAULT TRUE;
        END IF;
        
        -- Удаляем старое поле task_moved_notifications, если оно существует
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'notification_preferences' AND column_name = 'task_moved_notifications') THEN
            ALTER TABLE notification_preferences DROP COLUMN task_moved_notifications;
        END IF;
        
    ELSE
        -- Создаем таблицу notification_preferences, если она не существует
        CREATE TABLE notification_preferences (
            id BIGSERIAL PRIMARY KEY,
            user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            global_notifications_enabled BOOLEAN DEFAULT TRUE,
            email_notifications_enabled BOOLEAN DEFAULT TRUE,
            telegram_notifications_enabled BOOLEAN DEFAULT FALSE,
            browser_notifications_enabled BOOLEAN DEFAULT TRUE,
            board_invite_notifications BOOLEAN DEFAULT TRUE,
            task_assigned_notifications BOOLEAN DEFAULT TRUE,
            task_status_changed_notifications BOOLEAN DEFAULT TRUE,
            task_created_notifications BOOLEAN DEFAULT FALSE,
            task_updated_notifications BOOLEAN DEFAULT FALSE,
            task_deleted_notifications BOOLEAN DEFAULT TRUE,
            task_comment_added_notifications BOOLEAN DEFAULT TRUE,
            mention_notifications BOOLEAN DEFAULT TRUE,
            subtask_created_notifications BOOLEAN DEFAULT FALSE,
            subtask_completed_notifications BOOLEAN DEFAULT TRUE,
            board_member_added_notifications BOOLEAN DEFAULT TRUE,
            board_member_removed_notifications BOOLEAN DEFAULT TRUE,
            attachment_added_notifications BOOLEAN DEFAULT FALSE,
            deadline_reminder_notifications BOOLEAN DEFAULT TRUE,
            role_changed_notifications BOOLEAN DEFAULT TRUE,
            task_due_soon_notifications BOOLEAN DEFAULT TRUE,
            task_overdue_notifications BOOLEAN DEFAULT TRUE,
            only_high_priority_notifications BOOLEAN DEFAULT FALSE,
            group_similar_notifications BOOLEAN DEFAULT TRUE,
            UNIQUE(user_id)
        );
        
        -- Создание индекса
        CREATE INDEX idx_notification_preferences_user ON notification_preferences(user_id);
        
        -- Комментарии к таблице
        COMMENT ON TABLE notification_preferences IS 'Настройки уведомлений пользователей';
    END IF;
END $$; 