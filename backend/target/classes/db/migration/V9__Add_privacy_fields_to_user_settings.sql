-- Добавление колонок для настроек приватности в таблицу user_settings
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS profile_visibility VARCHAR(20) DEFAULT 'public';
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS email_visible BOOLEAN DEFAULT true;
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS phone_visible BOOLEAN DEFAULT true;
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS position_visible BOOLEAN DEFAULT true;
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS bio_visible BOOLEAN DEFAULT true;

-- Добавление комментариев к колонкам
COMMENT ON COLUMN user_settings.profile_visibility IS 'Видимость профиля (public, private)';
COMMENT ON COLUMN user_settings.email_visible IS 'Видимость email для других пользователей';
COMMENT ON COLUMN user_settings.phone_visible IS 'Видимость телефона для других пользователей';
COMMENT ON COLUMN user_settings.position_visible IS 'Видимость должности для других пользователей';
COMMENT ON COLUMN user_settings.bio_visible IS 'Видимость информации о себе для других пользователей'; 