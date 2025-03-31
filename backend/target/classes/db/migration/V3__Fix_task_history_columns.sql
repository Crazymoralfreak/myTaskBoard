-- Добавляем столбец action (если его нет)
ALTER TABLE task_history ADD COLUMN IF NOT EXISTS action VARCHAR(255);

-- Копируем значения из field_changed в action
UPDATE task_history SET action = field_changed WHERE action IS NULL;

-- Заполняем username для записей, где он NULL
UPDATE task_history SET username = 'Система' WHERE username IS NULL;

-- Делаем action и username NOT NULL
ALTER TABLE task_history ALTER COLUMN action SET NOT NULL;
ALTER TABLE task_history ALTER COLUMN username SET NOT NULL;

-- Добавляем триггер для синхронизации поля field_changed и action
CREATE OR REPLACE FUNCTION sync_task_history_columns()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
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

-- Создаем триггер
DROP TRIGGER IF EXISTS sync_task_history_trigger ON task_history;
CREATE TRIGGER sync_task_history_trigger
BEFORE INSERT OR UPDATE ON task_history
FOR EACH ROW
EXECUTE FUNCTION sync_task_history_columns();

-- Обновляем комментарии
COMMENT ON COLUMN task_history.action IS 'Действие, выполненное над задачей';
COMMENT ON COLUMN task_history.timestamp IS 'Время выполнения действия';
COMMENT ON COLUMN task_history.changed_at IS 'Время изменения (совпадает с timestamp)';
COMMENT ON COLUMN task_history.created_at IS 'Время создания записи';
COMMENT ON COLUMN task_history.updated_at IS 'Время последнего обновления записи'; 