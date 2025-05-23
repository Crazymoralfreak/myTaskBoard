-- Если в базе уже есть данные, то нужно преобразовать существующие числовые ID в строковые
-- Эта миграция выполняется после V1, когда нужно обновить формат ID для существующих записей

-- Создаем временную таблицу для хранения старых ID
CREATE TABLE temp_board_ids (
    old_id BIGINT,
    new_id VARCHAR(64)
);

-- Функция для генерации UUID
CREATE OR REPLACE FUNCTION generate_uuid() RETURNS VARCHAR AS $$
BEGIN
    RETURN CAST(gen_random_uuid() AS VARCHAR);
END;
$$ LANGUAGE plpgsql;

-- Создаем функцию для обновления board_id во всех связанных таблицах
CREATE OR REPLACE FUNCTION update_board_references() RETURNS VOID AS $$
DECLARE
    board_record RECORD;
BEGIN
    -- Перебираем все записи в таблице boards
    FOR board_record IN SELECT id FROM boards LOOP
        -- Генерируем новый UUID
        INSERT INTO temp_board_ids (old_id, new_id) VALUES (board_record.id, generate_uuid());
    END LOOP;

    -- Обновляем board_id в task_statuses
    UPDATE task_statuses ts
    SET board_id = tbi.new_id
    FROM temp_board_ids tbi
    WHERE ts.board_id::BIGINT = tbi.old_id;

    -- Обновляем board_id в task_types
    UPDATE task_types tt
    SET board_id = tbi.new_id
    FROM temp_board_ids tbi
    WHERE tt.board_id::BIGINT = tbi.old_id;

    -- Обновляем board_id в board_columns
    UPDATE board_columns bc
    SET board_id = tbi.new_id
    FROM temp_board_ids tbi
    WHERE bc.board_id::BIGINT = tbi.old_id;

    -- Обновляем board_id в board_members
    UPDATE board_members bm
    SET board_id = tbi.new_id
    FROM temp_board_ids tbi
    WHERE bm.board_id::BIGINT = tbi.old_id;

    -- Обновляем board_id в task_templates
    UPDATE task_templates tt
    SET board_id = tbi.new_id
    FROM temp_board_ids tbi
    WHERE tt.board_id::BIGINT = tbi.old_id;

    -- Обновляем сами ID в таблице boards в самом конце
    UPDATE boards b
    SET id = tbi.new_id
    FROM temp_board_ids tbi
    WHERE b.id::BIGINT = tbi.old_id;
END;
$$ LANGUAGE plpgsql;

-- Выполняем функцию для обновления всех ссылок
SELECT update_board_references();

-- Удаляем временную таблицу
DROP TABLE temp_board_ids;

-- Удаляем функции, которые больше не нужны
DROP FUNCTION update_board_references();
DROP FUNCTION generate_uuid(); 