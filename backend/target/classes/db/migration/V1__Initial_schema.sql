-- Создание таблицы пользователей
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    telegram_id VARCHAR(255),
    telegram_chat_id VARCHAR(255),
    avatar_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создание таблицы досок
CREATE TABLE boards (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by BIGINT REFERENCES users(id),
    is_archived BOOLEAN DEFAULT FALSE
);

-- Создание таблицы статусов задач
CREATE TABLE task_statuses (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    color VARCHAR(7) NOT NULL,
    board_id BIGINT REFERENCES boards(id),
    position INTEGER NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    is_custom BOOLEAN DEFAULT FALSE
);

-- Создание таблицы колонок
CREATE TABLE board_columns (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    board_id BIGINT REFERENCES boards(id),
    position INTEGER NOT NULL,
    color VARCHAR(7) DEFAULT '#E0E0E0',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создание таблицы задач
CREATE TABLE tasks (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    position INTEGER NOT NULL,
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    days_remaining BIGINT,
    column_id BIGINT REFERENCES board_columns(id),
    assignee_id BIGINT REFERENCES users(id),
    status_id BIGINT REFERENCES task_statuses(id),
    priority VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создание таблицы тегов задач
CREATE TABLE task_tags (
    task_id BIGINT REFERENCES tasks(id),
    tag VARCHAR(255) NOT NULL,
    PRIMARY KEY (task_id, tag)
);

-- Создание таблицы комментариев
CREATE TABLE comments (
    id BIGSERIAL PRIMARY KEY,
    content TEXT NOT NULL,
    task_id BIGINT REFERENCES tasks(id),
    author_id BIGINT REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создание таблицы участников доски
CREATE TABLE board_members (
    board_id BIGINT REFERENCES boards(id),
    user_id BIGINT REFERENCES users(id),
    role VARCHAR(50) NOT NULL,
    PRIMARY KEY (board_id, user_id)
);

-- Создание таблицы вложений
CREATE TABLE attachments (
    id BIGSERIAL PRIMARY KEY,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(255) NOT NULL,
    content_type VARCHAR(100),
    size BIGINT,
    task_id BIGINT REFERENCES tasks(id),
    uploaded_by BIGINT REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создание таблицы истории задач
CREATE TABLE task_history (
    id BIGSERIAL PRIMARY KEY,
    task_id BIGINT REFERENCES tasks(id),
    changed_by_id BIGINT REFERENCES users(id),
    username VARCHAR(255),
    avatar_url VARCHAR(255),
    field_changed VARCHAR(255) NOT NULL,
    old_value TEXT,
    new_value TEXT,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создание таблицы настроек уведомлений
CREATE TABLE notification_preferences (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) UNIQUE,
    global_notifications_enabled BOOLEAN DEFAULT true,
    task_assigned_notifications BOOLEAN DEFAULT true,
    task_moved_notifications BOOLEAN DEFAULT true,
    task_updated_notifications BOOLEAN DEFAULT true,
    mention_notifications BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица чек-листов
CREATE TABLE checklists (
    id BIGSERIAL PRIMARY KEY,
    task_id BIGINT REFERENCES tasks(id),
    title VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица элементов чек-листа
CREATE TABLE checklist_items (
    id BIGSERIAL PRIMARY KEY,
    checklist_id BIGINT REFERENCES checklists(id),
    content TEXT NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    position INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица отслеживания времени
CREATE TABLE time_tracking (
    id BIGSERIAL PRIMARY KEY,
    task_id BIGINT REFERENCES tasks(id),
    started_at TIMESTAMP NOT NULL,
    ended_at TIMESTAMP,
    duration INTEGER,
    created_by BIGINT REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица оценок времени
CREATE TABLE time_estimates (
    id BIGSERIAL PRIMARY KEY,
    task_id BIGINT REFERENCES tasks(id),
    estimated_minutes INTEGER NOT NULL,
    created_by BIGINT REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица связей между задачами
CREATE TABLE task_links (
    id BIGSERIAL PRIMARY KEY,
    source_task_id BIGINT REFERENCES tasks(id),
    target_task_id BIGINT REFERENCES tasks(id),
    link_type VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by BIGINT REFERENCES users(id),
    UNIQUE (source_task_id, target_task_id)
);

-- Таблица наблюдателей задач
CREATE TABLE task_watchers (
    task_id BIGINT REFERENCES tasks(id),
    user_id BIGINT REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (task_id, user_id)
);

-- Таблица подзадач
CREATE TABLE subtasks (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    completed BOOLEAN DEFAULT FALSE,
    position INTEGER NOT NULL,
    parent_task_id BIGINT REFERENCES tasks(id) ON DELETE CASCADE,
    assignee_id BIGINT REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    due_date TIMESTAMP,
    estimated_hours INTEGER
);

-- Индексы для оптимизации
CREATE INDEX idx_tasks_column ON tasks(column_id);
CREATE INDEX idx_tasks_assignee ON tasks(assignee_id);
CREATE INDEX idx_tasks_status ON tasks(status_id);
CREATE INDEX idx_task_start_date ON tasks(start_date);
CREATE INDEX idx_task_end_date ON tasks(end_date);
CREATE INDEX idx_board_columns_board ON board_columns(board_id);
CREATE INDEX idx_task_statuses_board ON task_statuses(board_id);
CREATE INDEX idx_comments_task ON comments(task_id);
CREATE INDEX idx_comments_author ON comments(author_id);
CREATE INDEX idx_attachments_task ON attachments(task_id);
CREATE INDEX idx_task_history_task ON task_history(task_id);
CREATE INDEX idx_task_history_user ON task_history(changed_by_id);
CREATE INDEX idx_notification_preferences_user ON notification_preferences(user_id);
CREATE INDEX idx_checklists_task ON checklists(task_id);
CREATE INDEX idx_checklist_items_checklist ON checklist_items(checklist_id);
CREATE INDEX idx_time_tracking_task ON time_tracking(task_id);
CREATE INDEX idx_time_estimates_task ON time_estimates(task_id);
CREATE INDEX idx_task_links_source ON task_links(source_task_id);
CREATE INDEX idx_task_links_target ON task_links(target_task_id);
CREATE INDEX idx_task_watchers_task ON task_watchers(task_id);
CREATE INDEX idx_task_watchers_user ON task_watchers(user_id);
CREATE INDEX idx_subtasks_parent ON subtasks(parent_task_id);
CREATE INDEX idx_subtasks_assignee ON subtasks(assignee_id);

-- Комментарии к таблицам
COMMENT ON TABLE users IS 'Таблица пользователей системы';
COMMENT ON TABLE boards IS 'Таблица досок (проектов)';
COMMENT ON TABLE board_columns IS 'Таблица колонок на досках';
COMMENT ON TABLE tasks IS 'Таблица задач';
COMMENT ON TABLE task_tags IS 'Таблица тегов задач';
COMMENT ON TABLE comments IS 'Таблица комментариев к задачам';
COMMENT ON TABLE board_members IS 'Таблица участников досок';
COMMENT ON TABLE task_statuses IS 'Таблица статусов задач';
COMMENT ON TABLE attachments IS 'Таблица вложений к задачам';
COMMENT ON TABLE task_history IS 'Таблица истории изменений задач';
COMMENT ON TABLE notification_preferences IS 'Таблица настроек уведомлений пользователей';
COMMENT ON TABLE checklists IS 'Таблица чек-листов задач';
COMMENT ON TABLE checklist_items IS 'Таблица элементов чек-листа';
COMMENT ON TABLE time_tracking IS 'Таблица записей отслеживания времени';
COMMENT ON TABLE time_estimates IS 'Таблица оценок времени задач';
COMMENT ON TABLE task_links IS 'Таблица связей между задачами';
COMMENT ON TABLE task_watchers IS 'Таблица наблюдателей задач';
COMMENT ON TABLE subtasks IS 'Таблица подзадач';

-- Комментарии к колонкам
COMMENT ON COLUMN users.telegram_id IS 'Идентификатор пользователя в Telegram';
COMMENT ON COLUMN users.telegram_chat_id IS 'Идентификатор чата пользователя в Telegram';
COMMENT ON COLUMN users.avatar_url IS 'URL аватара пользователя';
COMMENT ON COLUMN tasks.start_date IS 'Дата начала выполнения задачи';
COMMENT ON COLUMN tasks.end_date IS 'Дата окончания выполнения задачи';
COMMENT ON COLUMN tasks.days_remaining IS 'Оставшееся количество дней до окончания задачи';
COMMENT ON COLUMN task_history.username IS 'Имя пользователя, внесшего изменение';
COMMENT ON COLUMN task_history.avatar_url IS 'URL аватара пользователя, внесшего изменение';
COMMENT ON COLUMN subtasks.position IS 'Позиция подзадачи в списке';
COMMENT ON COLUMN subtasks.estimated_hours IS 'Оценка времени в часах'; 