-- Исправление NULL значений в boolean полях
-- Заменяем NULL на FALSE для полей is_default и is_custom

UPDATE task_statuses SET is_default = FALSE WHERE is_default IS NULL;
UPDATE task_statuses SET is_custom = FALSE WHERE is_custom IS NULL;

UPDATE task_types SET is_default = FALSE WHERE is_default IS NULL;
UPDATE task_types SET is_custom = FALSE WHERE is_custom IS NULL;

-- Устанавливаем NOT NULL ограничения
ALTER TABLE task_statuses ALTER COLUMN is_default SET NOT NULL;
ALTER TABLE task_statuses ALTER COLUMN is_custom SET NOT NULL;

ALTER TABLE task_types ALTER COLUMN is_default SET NOT NULL;
ALTER TABLE task_types ALTER COLUMN is_custom SET NOT NULL; 