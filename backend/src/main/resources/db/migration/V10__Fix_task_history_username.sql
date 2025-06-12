-- V10: Исправление автоматического заполнения username в task_history

-- Обновляем существующие записи task_history, где username пустой/null
UPDATE task_history 
SET username = COALESCE(u.username, u.email, 'user_' || u.id)
FROM users u 
WHERE task_history.changed_by_id = u.id 
  AND (task_history.username IS NULL OR task_history.username = '');

-- Обновляем функцию триггера для автоматического заполнения username
CREATE OR REPLACE FUNCTION sync_task_history_columns()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- При вставке заполняем username из связанного пользователя, если не указан
        IF (NEW.username IS NULL OR NEW.username = '') AND NEW.changed_by_id IS NOT NULL THEN
            SELECT COALESCE(u.username, u.email, 'user_' || u.id)
            INTO NEW.username
            FROM users u 
            WHERE u.id = NEW.changed_by_id;
        END IF;
        
        -- При вставке заполняем timestamp из changed_at, если не указан
        IF NEW.timestamp IS NULL AND NEW.changed_at IS NOT NULL THEN
            NEW.timestamp = NEW.changed_at;
        ELSIF NEW.changed_at IS NULL AND NEW.timestamp IS NOT NULL THEN
            NEW.changed_at = NEW.timestamp;
        END IF;

        -- Синхронизируем action и field_changed
        IF NEW.action IS NOT NULL AND (NEW.field_changed IS NULL OR NEW.field_changed != NEW.action) THEN
            NEW.field_changed = NEW.action;
        ELSIF NEW.field_changed IS NOT NULL AND (NEW.action IS NULL OR NEW.action != NEW.field_changed) THEN
            NEW.action = NEW.field_changed;
        END IF;
    ELSIF TG_OP = 'UPDATE' THEN
        -- При обновлении заполняем username из связанного пользователя, если он изменился
        IF NEW.changed_by_id IS DISTINCT FROM OLD.changed_by_id AND NEW.changed_by_id IS NOT NULL THEN
            SELECT COALESCE(u.username, u.email, 'user_' || u.id)
            INTO NEW.username
            FROM users u 
            WHERE u.id = NEW.changed_by_id;
        END IF;
        
        -- При обновлении проверяем, какое из полей изменилось
        IF NEW.action IS DISTINCT FROM OLD.action THEN
            NEW.field_changed = NEW.action;
        ELSIF NEW.field_changed IS DISTINCT FROM OLD.field_changed THEN
            NEW.action = NEW.field_changed;
        END IF;

        -- Синхронизируем timestamp и changed_at
        IF NEW.timestamp IS DISTINCT FROM OLD.timestamp THEN
            NEW.changed_at = NEW.timestamp;
        ELSIF NEW.changed_at IS DISTINCT FROM OLD.changed_at THEN
            NEW.timestamp = NEW.changed_at;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Комментарий к миграции
COMMENT ON FUNCTION sync_task_history_columns() IS 'Функция триггера для автоматического заполнения полей в task_history, включая username из связанной таблицы users'; 