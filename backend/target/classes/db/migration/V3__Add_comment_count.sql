ALTER TABLE tasks ADD COLUMN comment_count INTEGER DEFAULT 0;

-- Создаем функцию для обновления счетчика комментариев
CREATE OR REPLACE FUNCTION update_task_comment_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE tasks SET comment_count = comment_count + 1 WHERE id = NEW.task_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE tasks SET comment_count = comment_count - 1 WHERE id = OLD.task_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Создаем триггер для автоматического обновления счетчика при добавлении/удалении комментария
CREATE TRIGGER update_task_comment_count_trigger
AFTER INSERT OR DELETE ON comments
FOR EACH ROW
EXECUTE FUNCTION update_task_comment_count();

-- Обновляем существующие записи, устанавливая количество комментариев
UPDATE tasks t 
SET comment_count = (
    SELECT COUNT(*) 
    FROM comments c 
    WHERE c.task_id = t.id
); 