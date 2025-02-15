CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(255),
    password VARCHAR(255) NOT NULL,
    telegram_id VARCHAR(255),
    telegram_chat_id VARCHAR(255)
);

CREATE TABLE notification_preferences (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT UNIQUE REFERENCES users(id),
    global_notifications_enabled BOOLEAN DEFAULT true,
    task_assigned_notifications BOOLEAN DEFAULT true,
    task_updated_notifications BOOLEAN DEFAULT true,
    task_moved_notifications BOOLEAN DEFAULT true,
    mention_notifications BOOLEAN DEFAULT true
);

CREATE TABLE boards (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    archived BOOLEAN DEFAULT false,
    owner_id BIGINT REFERENCES users(id)
);

CREATE TABLE columns (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    position INTEGER NOT NULL,
    board_id BIGINT REFERENCES boards(id) ON DELETE CASCADE
);

CREATE TABLE tasks (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    priority VARCHAR(50),
    due_date TIMESTAMP,
    column_id BIGINT REFERENCES columns(id) ON DELETE CASCADE,
    assignee_id BIGINT REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE task_tags (
    task_id BIGINT REFERENCES tasks(id) ON DELETE CASCADE,
    tag VARCHAR(255),
    PRIMARY KEY (task_id, tag)
);

CREATE TABLE task_history (
    id BIGSERIAL PRIMARY KEY,
    task_id BIGINT REFERENCES tasks(id) ON DELETE CASCADE,
    changed_by_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    field_changed VARCHAR(255) NOT NULL,
    old_value TEXT,
    new_value TEXT,
    changed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE files (
    id BIGSERIAL PRIMARY KEY,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(255) NOT NULL,
    file_type VARCHAR(50),
    uploaded_by_id BIGINT REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE notes (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255),
    content TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
); 