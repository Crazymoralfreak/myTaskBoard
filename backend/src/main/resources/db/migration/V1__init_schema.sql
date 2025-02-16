CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    telegram_id VARCHAR(255),
    telegram_chat_id VARCHAR(255)
);

CREATE TABLE notification_preferences (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    global_notifications_enabled BOOLEAN DEFAULT TRUE,
    task_assigned_notifications BOOLEAN DEFAULT TRUE,
    task_moved_notifications BOOLEAN DEFAULT TRUE,
    task_updated_notifications BOOLEAN DEFAULT TRUE,
    mention_notifications BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE boards (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    archived BOOLEAN DEFAULT FALSE,
    owner_id BIGINT REFERENCES users(id)
);

CREATE TABLE task_statuses (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    color VARCHAR(7) NOT NULL,
    position INTEGER NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    is_custom BOOLEAN DEFAULT TRUE,
    board_id BIGINT REFERENCES boards(id)
);

CREATE TABLE columns (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    position INTEGER NOT NULL,
    board_id BIGINT REFERENCES boards(id)
);

CREATE TABLE tasks (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    position INTEGER,
    due_date TIMESTAMP,
    system_status VARCHAR(50),
    priority VARCHAR(50),
    column_id BIGINT REFERENCES columns(id),
    assignee_id BIGINT REFERENCES users(id),
    status_id BIGINT REFERENCES task_statuses(id)
);

CREATE TABLE task_tags (
    task_id BIGINT REFERENCES tasks(id),
    tags VARCHAR(255),
    PRIMARY KEY (task_id, tags)
);

CREATE TABLE task_history (
    id BIGSERIAL PRIMARY KEY,
    changed_by_id BIGINT REFERENCES users(id),
    field_changed VARCHAR(255) NOT NULL,
    old_value TEXT,
    new_value TEXT,
    changed_at TIMESTAMP NOT NULL,
    task_id BIGINT REFERENCES tasks(id)
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
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(255) NOT NULL,
    file_type VARCHAR(50),
    task_id BIGINT REFERENCES tasks(id)
);

CREATE TABLE notes (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255),
    content VARCHAR(255),
    updated_at TIMESTAMP
); 