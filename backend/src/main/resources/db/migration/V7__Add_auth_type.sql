-- Добавление колонки для типа аутентификации
ALTER TABLE users ADD COLUMN auth_type VARCHAR(20) NOT NULL DEFAULT 'WEB';

-- Обновление уникальности полей
-- Удаление уникального ограничения на username, если существует
ALTER TABLE users DROP CONSTRAINT IF EXISTS uk_users_username;

-- Добавление уникального ограничения на telegram_id
ALTER TABLE users ADD CONSTRAINT uk_users_telegram_id UNIQUE (telegram_id);

-- Комментарии к колонкам для документации
COMMENT ON COLUMN users.auth_type IS 'Тип аутентификации пользователя: WEB или TELEGRAM';
COMMENT ON COLUMN users.email IS 'Email пользователя (уникальный для WEB пользователей)';
COMMENT ON COLUMN users.telegram_id IS 'ID пользователя в Telegram (уникальный для TELEGRAM пользователей)'; 