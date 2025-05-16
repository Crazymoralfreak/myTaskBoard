-- Создание таблицы ссылок-приглашений
CREATE TABLE board_invite_links (
    id BIGSERIAL PRIMARY KEY,
    board_id VARCHAR(64) NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
    token VARCHAR(100) NOT NULL UNIQUE,
    created_by BIGINT NOT NULL REFERENCES users(id),
    default_role_id BIGINT NOT NULL REFERENCES roles(id),
    max_uses INTEGER,
    use_count INTEGER DEFAULT 0,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- Индексы для оптимизации
CREATE INDEX idx_board_invite_links_board ON board_invite_links(board_id);
CREATE INDEX idx_board_invite_links_token ON board_invite_links(token);
CREATE INDEX idx_board_invite_links_expires ON board_invite_links(expires_at);
CREATE INDEX idx_board_invite_links_active ON board_invite_links(is_active);

-- Комментарии к таблице
COMMENT ON TABLE board_invite_links IS 'Таблица ссылок-приглашений на доски';
COMMENT ON COLUMN board_invite_links.token IS 'Токен для приглашения, используемый в URL';
COMMENT ON COLUMN board_invite_links.default_role_id IS 'Роль, которая будет назначена пользователю при присоединении';
COMMENT ON COLUMN board_invite_links.max_uses IS 'Максимальное количество использований ссылки (NULL - без ограничений)';
COMMENT ON COLUMN board_invite_links.use_count IS 'Текущее количество использований ссылки';
COMMENT ON COLUMN board_invite_links.expires_at IS 'Дата и время истечения срока действия ссылки (NULL - бессрочная)';
COMMENT ON COLUMN board_invite_links.is_active IS 'Флаг активности ссылки';

-- Создание таблицы использований ссылок-приглашений
CREATE TABLE board_invite_uses (
    id BIGSERIAL PRIMARY KEY,
    invite_link_id BIGINT NOT NULL REFERENCES board_invite_links(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id),
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Индексы для оптимизации
CREATE INDEX idx_board_invite_uses_link ON board_invite_uses(invite_link_id);
CREATE INDEX idx_board_invite_uses_user ON board_invite_uses(user_id);

-- Комментарии к таблице
COMMENT ON TABLE board_invite_uses IS 'Таблица использований ссылок-приглашений';

-- Триггер для обновления счетчика использований ссылок
CREATE OR REPLACE FUNCTION update_invite_use_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE board_invite_links
    SET use_count = use_count + 1,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.invite_link_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER board_invite_use_count_update
    AFTER INSERT ON board_invite_uses
    FOR EACH ROW
    EXECUTE FUNCTION update_invite_use_count();

-- Функция для проверки валидности ссылки
CREATE OR REPLACE FUNCTION is_invite_link_valid(link_id BIGINT)
RETURNS BOOLEAN AS $$
DECLARE
    valid BOOLEAN;
BEGIN
    SELECT EXISTS(
        SELECT 1 FROM board_invite_links
        WHERE id = link_id
          AND is_active = TRUE
          AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
          AND (max_uses IS NULL OR use_count < max_uses)
    ) INTO valid;
    
    RETURN valid;
END;
$$ LANGUAGE plpgsql; 