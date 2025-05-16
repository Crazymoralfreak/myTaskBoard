-- Создание таблицы ролей
CREATE TABLE roles (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    board_id VARCHAR(64) REFERENCES boards(id) ON DELETE CASCADE,
    is_system BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (name, board_id)
);

-- Индексы для оптимизации
CREATE INDEX idx_roles_board_id ON roles(board_id);
CREATE INDEX idx_roles_is_system ON roles(is_system);

-- Комментарии к таблице
COMMENT ON TABLE roles IS 'Таблица ролей для доступа к доскам';
COMMENT ON COLUMN roles.board_id IS 'Ссылка на доску для пользовательских ролей; NULL для системных ролей';
COMMENT ON COLUMN roles.is_system IS 'Признак системной предустановленной роли';

-- Вставка предустановленных системных ролей
INSERT INTO roles (name, description, is_system) VALUES 
('ADMIN', 'Полный доступ к доске', TRUE),
('EDITOR', 'Может редактировать задачи и колонки', TRUE),
('VIEWER', 'Только просмотр доски', TRUE);

-- Добавление поля role_id в таблицу board_members
ALTER TABLE board_members ADD COLUMN role_id BIGINT REFERENCES roles(id);

-- Обновление данных (связывание с системными ролями)
UPDATE board_members
SET role_id = (SELECT id FROM roles WHERE name = board_members.role AND is_system = TRUE)
WHERE role IN ('ADMIN', 'EDITOR', 'VIEWER');

-- Для ролей, которые не совпадают с системными, устанавливаем роль VIEWER
UPDATE board_members
SET role_id = (SELECT id FROM roles WHERE name = 'VIEWER' AND is_system = TRUE)
WHERE role_id IS NULL;

-- Делаем поле role_id NOT NULL
ALTER TABLE board_members ALTER COLUMN role_id SET NOT NULL;

-- Добавляем индекс для ускорения поиска
CREATE INDEX idx_board_members_role_id ON board_members(role_id);

-- Удаляем старое поле role
ALTER TABLE board_members DROP COLUMN role;

-- Добавляем поле joined_at в таблицу board_members
ALTER TABLE board_members ADD COLUMN joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Функция для автоматического обновления поля updated_at в таблице ролей
CREATE OR REPLACE FUNCTION update_roles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггер для автоматического обновления поля updated_at при обновлении роли
CREATE TRIGGER roles_updated_at
    BEFORE UPDATE ON roles
    FOR EACH ROW
    EXECUTE FUNCTION update_roles_updated_at(); 