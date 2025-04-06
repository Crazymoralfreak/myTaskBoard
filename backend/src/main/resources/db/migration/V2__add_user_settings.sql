-- Добавление новых полей в таблицу users
ALTER TABLE users
    ADD COLUMN display_name VARCHAR(255),
    ADD COLUMN phone_number VARCHAR(20),
    ADD COLUMN position VARCHAR(255),
    ADD COLUMN bio TEXT;

-- Создание таблицы user_settings
CREATE TABLE user_settings (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    dark_mode BOOLEAN DEFAULT FALSE,
    compact_view BOOLEAN DEFAULT FALSE,
    enable_animations BOOLEAN DEFAULT TRUE,
    browser_notifications BOOLEAN DEFAULT TRUE,
    email_notifications BOOLEAN DEFAULT TRUE,
    telegram_notifications BOOLEAN DEFAULT TRUE,
    language VARCHAR(10) DEFAULT 'ru',
    timezone VARCHAR(30) DEFAULT 'UTC+3',
    CONSTRAINT fk_user_settings_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Заполнение таблицы user_settings для существующих пользователей
INSERT INTO user_settings (user_id)
SELECT id FROM users
ON CONFLICT DO NOTHING; 