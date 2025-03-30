ALTER TABLE tasks ADD COLUMN comment_count INTEGER DEFAULT 0;

-- Обновляем существующие записи, устанавливая количество комментариев
UPDATE tasks t 
SET comment_count = (
    SELECT COUNT(*) 
    FROM comments c 
    WHERE c.task_id = t.id
); 