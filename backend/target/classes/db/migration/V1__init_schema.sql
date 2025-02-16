CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255),
    username VARCHAR(255),
    telegram_id VARCHAR(255),
    telegram_chat_id VARCHAR(255)
);

CREATE TABLE notification_preferences (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT UNIQUE REFERENCES users(id),
    global_notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    task_assigned_notifications BOOLEAN NOT NULL DEFAULT TRUE,
    task_updated_notifications BOOLEAN NOT NULL DEFAULT TRUE,
    task_moved_notifications BOOLEAN NOT NULL DEFAULT TRUE,
    mention_notifications BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE boards (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255),
    description VARCHAR(255),
    archived BOOLEAN NOT NULL DEFAULT FALSE,
    owner_id BIGINT REFERENCES users(id)
);

CREATE TABLE columns (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255),
    position INTEGER NOT NULL,
    board_id BIGINT REFERENCES boards(id)
);

CREATE TABLE tasks (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255),
    description VARCHAR(255),
    priority VARCHAR(255),
    due_date TIMESTAMP,
    column_id BIGINT REFERENCES columns(id),
    assignee_id BIGINT REFERENCES users(id)
);

CREATE TABLE task_tags (
    task_id BIGINT REFERENCES tasks(id),
    tags VARCHAR(255)
);

CREATE TABLE task_history (
    id BIGSERIAL PRIMARY KEY,
    task_id BIGINT REFERENCES tasks(id),
    field_changed VARCHAR(255),
    old_value VARCHAR(255),
    new_value VARCHAR(255),
    changed_by_id BIGINT REFERENCES users(id),
    changed_at TIMESTAMP
);

CREATE TABLE task_comment (
    id BIGSERIAL PRIMARY KEY,
    task_id BIGINT REFERENCES tasks(id),
    content VARCHAR(255),
    author_id BIGINT REFERENCES users(id),
    created_at TIMESTAMP
);

CREATE TABLE attachment (
    id BIGSERIAL PRIMARY KEY,
    file_name VARCHAR(255),
    file_path VARCHAR(255),
    uploaded_by_id BIGINT REFERENCES users(id),
    uploaded_at TIMESTAMP
);

CREATE TABLE files (
    id BIGSERIAL PRIMARY KEY,
    file_name VARCHAR(255),
    file_path VARCHAR(255),
    file_type VARCHAR(255),
    uploaded_by_id BIGINT REFERENCES users(id)
);

CREATE TABLE notes (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255),
    content VARCHAR(255),
    updated_at TIMESTAMP
); 