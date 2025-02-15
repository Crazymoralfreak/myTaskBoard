CREATE TABLE "app_user" (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255),
    username VARCHAR(255),
    password VARCHAR(255),
    telegram_chat_id BIGINT,
    global_notifications_enabled BOOLEAN NOT NULL DEFAULT true,
    mention_notifications BOOLEAN NOT NULL DEFAULT true,
    task_assigned_notifications BOOLEAN NOT NULL DEFAULT true,
    task_moved_notifications BOOLEAN NOT NULL DEFAULT true,
    task_updated_notifications BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE board (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    user_id BIGINT REFERENCES "app_user"(id)
);

CREATE TABLE board_column (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    position INTEGER NOT NULL,
    board_id BIGINT REFERENCES board(id)
);

CREATE TABLE task (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    priority INTEGER NOT NULL DEFAULT 0,
    due_date TIMESTAMP,
    column_id BIGINT REFERENCES board_column(id),
    assignee_id BIGINT REFERENCES "app_user"(id)
);

CREATE TABLE task_comment (
    id BIGSERIAL PRIMARY KEY,
    content TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    task_id BIGINT REFERENCES task(id),
    author_id BIGINT REFERENCES "app_user"(id)
);

CREATE TABLE task_history (
    id BIGSERIAL PRIMARY KEY,
    task_id BIGINT REFERENCES task(id),
    changed_by_id BIGINT REFERENCES "app_user"(id),
    field_changed VARCHAR(255) NOT NULL,
    old_value TEXT,
    new_value TEXT,
    changed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE attachment (
    id BIGSERIAL PRIMARY KEY,
    task_id BIGINT REFERENCES task(id),
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(255) NOT NULL,
    uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    uploaded_by_id BIGINT REFERENCES "app_user"(id)
);

CREATE TABLE task_tags (
    task_id BIGINT REFERENCES task(id),
    tags VARCHAR(255)
); 