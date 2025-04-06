-- Удаляем уникальное ограничение с поля username
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_username_key;

-- Добавляем комментарий к изменению
COMMENT ON COLUMN users.username IS 'Имя пользователя (не уникальное, чтобы разрешить одинаковые имена для разных методов авторизации)'; 