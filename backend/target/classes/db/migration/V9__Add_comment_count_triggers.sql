-- V9__Add_comment_count_triggers.sql
-- Обновляем существующие записи, подсчитывая фактическое количество комментариев
UPDATE tasks 
SET comment_count = (
    SELECT COUNT(*) 
    FROM comments 
    WHERE comments.task_id = tasks.id
);

-- Создаем функцию для обновления счетчика комментариев
CREATE OR REPLACE FUNCTION update_task_comment_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE tasks 
        SET comment_count = comment_count + 1 
        WHERE id = NEW.task_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE tasks 
        SET comment_count = GREATEST(comment_count - 1, 0) 
        WHERE id = OLD.task_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Создаем триггеры для автоматического обновления comment_count
DROP TRIGGER IF EXISTS trigger_update_comment_count_on_insert ON comments;
CREATE TRIGGER trigger_update_comment_count_on_insert
    AFTER INSERT ON comments
    FOR EACH ROW
    EXECUTE FUNCTION update_task_comment_count();

DROP TRIGGER IF EXISTS trigger_update_comment_count_on_delete ON comments;
CREATE TRIGGER trigger_update_comment_count_on_delete
    AFTER DELETE ON comments
    FOR EACH ROW
    EXECUTE FUNCTION update_task_comment_count(); 