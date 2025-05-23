-- Добавление столбца id в таблицу board_members
-- Сначала удаляем первичный ключ, состоящий из двух столбцов
ALTER TABLE board_members DROP CONSTRAINT board_members_pkey;

-- Добавляем столбец id как BIGSERIAL
ALTER TABLE board_members ADD COLUMN id BIGSERIAL PRIMARY KEY;

-- Сохраняем уникальность пары user_id и board_id
ALTER TABLE board_members ADD CONSTRAINT uk_board_members_user_board UNIQUE (user_id, board_id);

-- Создаем индекс для быстрого поиска по id
CREATE INDEX idx_board_members_id ON board_members(id);

-- Комментарий к изменениям
COMMENT ON COLUMN board_members.id IS 'Уникальный идентификатор записи о членстве в доске'; 