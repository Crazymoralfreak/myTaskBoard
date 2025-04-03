-- Добавление поля для даты последнего сброса пароля
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_password_reset_date TIMESTAMP;

-- Установка текущей даты для существующих пользователей
UPDATE users SET last_password_reset_date = CURRENT_TIMESTAMP WHERE last_password_reset_date IS NULL;

COMMENT ON COLUMN users.last_password_reset_date IS 'Дата и время последнего изменения пароля пользователя'; 