-- V8__Add_attachment_count_to_tasks.sql
-- Добавляем поле attachment_count в таблицу tasks

-- Добавляем колонку attachment_count
ALTER TABLE tasks 
ADD COLUMN attachment_count INTEGER DEFAULT 0;

-- Обновляем существующие записи, подсчитывая фактическое количество вложений
UPDATE tasks 
SET attachment_count = (
    SELECT COUNT(*) 
    FROM attachments 
    WHERE attachments.task_id = tasks.id
);

-- Создаем функцию для обновления счетчика вложений
CREATE OR REPLACE FUNCTION update_task_attachment_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE tasks 
        SET attachment_count = attachment_count + 1 
        WHERE id = NEW.task_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE tasks 
        SET attachment_count = attachment_count - 1 
        WHERE id = OLD.task_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Создаем триггеры для автоматического обновления счетчика
CREATE TRIGGER trigger_update_attachment_count_insert
    AFTER INSERT ON attachments
    FOR EACH ROW
    EXECUTE FUNCTION update_task_attachment_count();

CREATE TRIGGER trigger_update_attachment_count_delete
    AFTER DELETE ON attachments
    FOR EACH ROW
    EXECUTE FUNCTION update_task_attachment_count();

-- Добавляем индекс для оптимизации
CREATE INDEX IF NOT EXISTS idx_tasks_attachment_count ON tasks(attachment_count); 