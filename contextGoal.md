# План добавления функционала для системы досок задач

## 1. Возможность подключать пользователей к доскам

### Backend:
- Создать модель `BoardMember` со связями к `User` и `Board`
- Разработать API эндпоинты:
  - `POST /api/boards/{boardId}/members` - добавление пользователя к доске
  - `GET /api/boards/{boardId}/members` - получение списка участников
  - `DELETE /api/boards/{boardId}/members/{userId}` - удаление пользователя из доски
  - `GET /api/users/search` - поиск пользователей по username или email для приглашения
- Реализовать сервис `UserSearchService` с методами:
  - `findByQuery(query, searchType?)` - универсальный поиск. `searchType` (опционально) может уточнять поиск ('username', 'email', 'any'). Рассмотреть возможность определения типа поиска автоматически (например, по наличию "@"). Это может сделать отдельные методы `findByUsername` и `findByEmail` избыточными.
  - `findByUsername(username)` - поиск по имени пользователя (возможно, будет удален в пользу `findByQuery`)
  - `findByEmail(email)` - поиск по электронной почте (возможно, будет удален в пользу `findByQuery`)
- Добавить систему уведомлений:
  - Создать таблицу `Notification` (см. описание ниже). Поле `type` в таблице `Notification` может принимать значения, например: `BOARD_INVITE`, `TASK_ASSIGNED`, `NEW_COMMENT_MENTION`, `TASK_STATUS_CHANGED` и т.д. Необходимо продумать конкретный список типов.
  - Реализовать сервис `NotificationService` для отправки уведомлений
- Добавить WebSocket для real-time уведомлений

### Frontend:
- Создать компоненты:
  - `BoardMembersModal.tsx` - модальное окно для управления участниками
  - `InviteForm.tsx` - форма приглашения пользователей
  - `MembersList.tsx` - список участников с возможностью управления
  - `UserSearch.tsx` - компонент для поиска пользователей с автодополнением (логика может измениться в зависимости от реализации `UserSearchService`)
- Реализовать индикацию типа поиска (по username или email), если `UserSearchService` сохранит отдельные типы поиска.
- Добавить функционал автодополнения при вводе имени пользователя или email
- Обновить компонент `BoardHeader.tsx`:
  - добавить кнопку "Участники"
- Создать страницу `Notifications.tsx` для просмотра и принятия приглашений
- Обновить `BoardsService` для работы с новыми API эндпоинтами
- Создать `UserService` с методами для поиска пользователей

### БД и миграции:
- Обратить внимание на существующую таблицу `board_members` в V1__Initial_schema.sql, которая уже имеет связи с `users` и `boards`, но нужно модифицировать:
  - Текущий столбец `role VARCHAR(50)` будет изменен в пункте 2 плана
- Создать новую таблицу `notifications`: 
  ```sql
  CREATE TABLE notifications (
      id BIGSERIAL PRIMARY KEY,
      user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      type VARCHAR(50) NOT NULL,
      related_entity_id VARCHAR(255),
      related_entity_type VARCHAR(50),
      is_read BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  
  CREATE INDEX idx_notifications_user ON notifications(user_id);
  CREATE INDEX idx_notifications_is_read ON notifications(is_read);
  CREATE INDEX idx_notifications_created_at ON notifications(created_at);
  
  COMMENT ON TABLE notifications IS 'Таблица уведомлений пользователей';
  ```
- Добавить функцию и триггер для автоматического обновления поля `updated_at`: 
  ```sql
  CREATE OR REPLACE FUNCTION update_notifications_updated_at()
  RETURNS TRIGGER AS $$
  BEGIN
      NEW.updated_at = CURRENT_TIMESTAMP;
      RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;
  
  CREATE TRIGGER notifications_updated_at
      BEFORE UPDATE ON notifications
      FOR EACH ROW
      EXECUTE FUNCTION update_notifications_updated_at();
  ```

## 2. Добавить ролевую модель в доски

### Backend:
- Создать модель `Role` с полями:
  - `id`, `name`, `description`, `permissions`
  - `boardId` (для пользовательских ролей)
- Модифицировать модель `BoardMember`, добавив поле `roleId`
- Создать предустановленные роли в миграции:
  - `ADMIN` - полный доступ
  - `EDITOR` - может редактировать задачи, создавать колонки
  - `VIEWER` - только просмотр
- Разработать API эндпоинты:
  - `GET /api/boards/{boardId}/roles` - получение доступных ролей
  - `PUT /api/boards/{boardId}/members/{userId}/role` - изменение роли участника

### Frontend:
- Создать интерфейсы типов:
  - `src/types/Role.ts`
  - Обновить `src/types/BoardMember.ts`
- Создать компоненты:
  - `RoleSelector.tsx` - выпадающий список выбора роли
  - `RoleBadge.tsx` - отображение роли пользователя
- Интегрировать селектор ролей в `BoardMembersModal.tsx`
- Обновить `BoardsService` и `AuthService` для работы с ролями

### БД и миграции:
- Создать таблицу `roles`: 
  ```sql
  CREATE TABLE roles (
      id BIGSERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      description TEXT,
      permissions JSONB NOT NULL DEFAULT '{}',
      board_id VARCHAR(64) REFERENCES boards(id) ON DELETE CASCADE,
      is_system BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (name, board_id)
  );
  
  CREATE INDEX idx_roles_board_id ON roles(board_id);
  CREATE INDEX idx_roles_is_system ON roles(is_system);
  
  COMMENT ON TABLE roles IS 'Таблица ролей для доступа к доскам';
  COMMENT ON COLUMN roles.permissions IS 'JSON массив ID прав из таблицы permissions (например, ["CREATE_TASK", "EDIT_TASK"])';
  COMMENT ON COLUMN roles.board_id IS 'Ссылка на доску для пользовательских ролей; NULL для системных ролей';
  COMMENT ON COLUMN roles.is_system IS 'Признак системной предустановленной роли';
  ```
- Модифицировать таблицу `board_members`: 
  ```sql
  INSERT INTO roles (name, description, permissions, is_system) VALUES 
  ('ADMIN', 'Полный доступ к доске', '{"VIEW_BOARD": true, "EDIT_BOARD": true, "DELETE_BOARD": true, "MANAGE_MEMBERS": true, "MANAGE_ROLES": true, "CREATE_COLUMN": true, "EDIT_COLUMN": true, "DELETE_COLUMN": true, "MOVE_COLUMN": true, "CREATE_TASK": true, "EDIT_TASK": true, "DELETE_TASK": true, "MOVE_TASK": true, "ASSIGN_TASK": true, "COMMENT_TASK": true, "ATTACH_FILES": true, "MANAGE_TAGS": true, "MANAGE_TEMPLATES": true}', TRUE),
  ('EDITOR', 'Может редактировать задачи и колонки', '{"VIEW_BOARD": true, "CREATE_COLUMN": true, "EDIT_COLUMN": true, "MOVE_COLUMN": true, "CREATE_TASK": true, "EDIT_TASK": true, "MOVE_TASK": true, "ASSIGN_TASK": true, "COMMENT_TASK": true, "ATTACH_FILES": true}', TRUE),
  ('VIEWER', 'Только просмотр доски', '{"VIEW_BOARD": true, "COMMENT_TASK": true}', TRUE);
  

  ALTER TABLE board_members ADD COLUMN role_id BIGINT REFERENCES roles(id);
  
  -- Обновляем данные, устанавливая правильные роли на основе текущего поля role 
  UPDATE board_members
  SET role_id = (SELECT id FROM roles WHERE name = board_members.role AND is_system = TRUE)
  WHERE role IN ('ADMIN', 'EDITOR', 'VIEWER');
  
  -- Для других ролей, которые не совпадают с системными, устанавливаем роль VIEWER (
  UPDATE board_members
  SET role_id = (SELECT id FROM roles WHERE name = 'VIEWER' AND is_system = TRUE)
  WHERE role_id IS NULL;
  
  -- Делаем поле role_id NOT NULL и удаляем старое поле role 
  ALTER TABLE board_members ALTER COLUMN role_id SET NOT NULL;
  ALTER TABLE board_members DROP COLUMN role;
  
  -- Добавляем индекс для ускорения поиска 
  CREATE INDEX idx_board_members_role_id ON board_members(role_id);
  ```
- Добавить триггер для автоматического обновления updated_at в таблице roles: 
  ```sql
  CREATE OR REPLACE FUNCTION update_roles_updated_at()
  RETURNS TRIGGER AS $$
  BEGIN
      NEW.updated_at = CURRENT_TIMESTAMP;
      RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;
  
  CREATE TRIGGER roles_updated_at
      BEFORE UPDATE ON roles
      FOR EACH ROW
      EXECUTE FUNCTION update_roles_updated_at();
  ```

## 3. Управление ролевой моделью и правами

### Backend:
- Создать модель `Permission` с атомарными правами: 
  - `CREATE_TASK`, `EDIT_TASK`, `DELETE_TASK`, `VIEW_TASK` и т.д.
- Создать сервис `PermissionService` для проверки прав 
- Разработать API эндпоинты:
  - `GET /api/permissions` - получение всех доступных прав из справочника `permissions` (для `PermissionCheckboxGrid.tsx`) 
  - `GET /api/roles` - получение всех системных ролей 
  - `POST /api/boards/{boardId}/roles` - создание пользовательской роли
  - `PUT /api/boards/{boardId}/roles/{roleId}` - редактирование роли 
  - `DELETE /api/boards/{boardId}/roles/{roleId}` - удаление роли 
- Добавить сервис `AuditLogService` для логирования действий пользователей 

### Frontend:
- Создать страницу `RoleManagement.tsx` для администрирования ролей
- Разработать компоненты:
  - `RoleForm.tsx` - создание/редактирование роли
  - `PermissionCheckboxGrid.tsx` - матрица выбора прав
  - `AuditLogViewer.tsx` - просмотр аудита действий
- Создать хуки:
  - `useRoles.ts` - управление ролями
  - `usePermissions.ts` - проверка прав текущего пользователя

### БД и миграции:
- Создать таблицу `permissions` (справочник всех доступных прав): 
  ```sql
  CREATE TABLE permissions (
      id VARCHAR(50) PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      description TEXT,
      group_name VARCHAR(50) NOT NULL,
      display_order INTEGER NOT NULL
  );
  
  CREATE INDEX idx_permissions_group ON permissions(group_name);
  
  COMMENT ON TABLE permissions IS 'Справочник всех доступных прав';
  COMMENT ON COLUMN permissions.group_name IS 'Группа прав для отображения в UI';
  COMMENT ON COLUMN permissions.display_order IS 'Порядок отображения в UI';
  
  -- Вставляем предопределенные права 
  INSERT INTO permissions (id, name, description, group_name, display_order) VALUES
  ('VIEW_BOARD', 'Просмотр доски', 'Право на просмотр доски и её содержимого', 'BOARD', 10),
  ('EDIT_BOARD', 'Редактирование доски', 'Право на изменение настроек доски', 'BOARD', 20),
  ('DELETE_BOARD', 'Удаление доски', 'Право на удаление доски', 'BOARD', 30),
  ('MANAGE_MEMBERS', 'Управление участниками', 'Право на добавление и удаление участников доски', 'BOARD', 40),
  ('MANAGE_ROLES', 'Управление ролями', 'Право на создание и изменение ролей', 'BOARD', 50),
  ('CREATE_COLUMN', 'Создание колонок', 'Право на добавление новых колонок', 'COLUMN', 10),
  ('EDIT_COLUMN', 'Редактирование колонок', 'Право на изменение настроек колонок', 'COLUMN', 20),
  ('DELETE_COLUMN', 'Удаление колонок', 'Право на удаление колонок', 'COLUMN', 30),
  ('MOVE_COLUMN', 'Перемещение колонок', 'Право на изменение порядка колонок', 'COLUMN', 40),
  ('CREATE_TASK', 'Создание задач', 'Право на создание новых задач', 'TASK', 10),
  ('EDIT_TASK', 'Редактирование задач', 'Право на изменение содержимого задач', 'TASK', 20),
  ('DELETE_TASK', 'Удаление задач', 'Право на удаление задач', 'TASK', 30),
  ('MOVE_TASK', 'Перемещение задач', 'Право на перемещение задач между колонками', 'TASK', 40),
  ('ASSIGN_TASK', 'Назначение исполнителей', 'Право на назначение исполнителей задач', 'TASK', 50),
  ('COMMENT_TASK', 'Комментирование задач', 'Право на добавление комментариев к задачам', 'TASK', 60),
  ('ATTACH_FILES', 'Прикрепление файлов', 'Право на прикрепление файлов к задачам', 'TASK', 70),
  ('MANAGE_TAGS', 'Управление тегами', 'Право на создание и назначение тегов', 'TAG', 10),
  ('MANAGE_TEMPLATES', 'Управление шаблонами', 'Право на создание и редактирование шаблонов задач', 'TEMPLATE', 10);
  ```
- Создать таблицу `audit_log` для отслеживания действий пользователей: 
  ```sql
  CREATE TABLE audit_log (
      id BIGSERIAL PRIMARY KEY,
      user_id BIGINT REFERENCES users(id),
      username VARCHAR(255) NOT NULL,
      action VARCHAR(100) NOT NULL,
      entity_type VARCHAR(50) NOT NULL,
      entity_id VARCHAR(255) NOT NULL,
      details JSONB,
      ip_address VARCHAR(45),
      user_agent TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  
  CREATE INDEX idx_audit_log_user_id ON audit_log(user_id);
  CREATE INDEX idx_audit_log_action ON audit_log(action);
  CREATE INDEX idx_audit_log_entity ON audit_log(entity_type, entity_id);
  CREATE INDEX idx_audit_log_created_at ON audit_log(created_at);
  
  COMMENT ON TABLE audit_log IS 'Журнал аудита действий пользователей';
  COMMENT ON COLUMN audit_log.details IS 'Дополнительные детали действия в формате JSON';
  COMMENT ON COLUMN audit_log.ip_address IS 'IP-адрес пользователя';
  COMMENT ON COLUMN audit_log.user_agent IS 'User-Agent браузера пользователя';
  ```

## 4. Добавить права в функциональность доски/колонок/задач

### Backend:
- Обновить все контроллеры, добавив проверку прав:
  - `BoardController` - проверка прав на доску
  - `ColumnController` - проверка прав на колонки
  - `TaskController` - проверка прав на задачи
- Создать перехватчики (interceptors) для проверки прав
- Реализовать декоратор `@RequirePermission` для методов контроллеров
- Обеспечить высокую производительность проверки прав, возможно, с использованием кеширования ролей и прав пользователя.

### Frontend:
- Создать HOC (компонент высшего порядка) `withPermissionCheck`:
  - обертка компонентов с проверкой прав
- Обновить компоненты UI с учетом прав:
  - Скрывать/отключать кнопки создания/редактирования/удаления
  - Добавить подсказки при наведении для недоступных элементов
- Модифицировать `BoardComponent.tsx`, `ColumnComponent.tsx`, `TaskComponent.tsx`:
  - Учитывать права при отображении элементов управления
- Обновить редьюсеры в `store` для проверки прав перед отправкой запроса

### БД и миграции:
- На уровне базы данных для этого пункта нет необходимости в создании новых таблиц или миграций, так как вся необходимая структура уже создана в предыдущих пунктах.
- Убедиться, что таблицы `roles` и `permissions` правильно настроены и заполнены данными.
- Проверить, что связь между `board_members` и `roles` корректно работает.

## 5. Приглашение пользователей по ссылке

### Backend:
- Создать сервис `InviteLinkService` для генерации уникальных ссылок 
- Разработать модель `BoardInviteLink` со следующими полями: 
  - `id`, `boardId`, `token`, `createdBy`, `expiresAt`, `defaultRoleId`
- Убедиться, что генерируемые токены (`BoardInviteLink.token`) являются криптографически стойкими и достаточно длинными. 
- Создать API эндпоинты:
  - `POST /api/boards/{boardId}/invite-links` - генерация новой ссылки 
  - `DELETE /api/boards/{boardId}/invite-links/{linkId}` - удаление ссылки 
  - `GET /api/boards/{boardId}/invite-links` - получение всех ссылок доски 
  - `POST /api/invite/{token}` - присоединение к доске по ссылке: 
    - Продумать поведение, если пользователь уже является участником доски (например, сообщить об этом). 
    - Если пользователь не аутентифицирован, направить на вход/регистрацию, затем автоматически добавить на доску. (Частично, текущий эндпоинт предполагает аутентификацию; требуется доработка на стороне клиента или изменение логики)
- Добавить возможность установки срока действия ссылки 
- При успешном присоединении пользователя по ссылке, рассмотреть отправку уведомления (через `NotificationService`) администратору доски или создателю ссылки.
### Frontend:
- Создать компоненты:
  - `InviteLinkGenerator.tsx` - генерация новых ссылок с настройками
  - `InviteLinksList.tsx` - управление существующими ссылками
  - `JoinByInviteLink.tsx` - страница для присоединения по ссылке
- Реализовать копирование ссылки в буфер обмена с уведомлением
- Добавить роутинг для обработки приглашений:
  - `/invite/:token` - страница присоединения
- Создать страницу приветствия после успешного присоединения к доске

### БД и миграции:
- Создать таблицу `board_invite_links`: 
  ```sql
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
  
  CREATE INDEX idx_board_invite_links_board ON board_invite_links(board_id);
  CREATE INDEX idx_board_invite_links_token ON board_invite_links(token);
  CREATE INDEX idx_board_invite_links_expires ON board_invite_links(expires_at);
  CREATE INDEX idx_board_invite_links_active ON board_invite_links(is_active);
  
  COMMENT ON TABLE board_invite_links IS 'Таблица ссылок-приглашений на доски';
  COMMENT ON COLUMN board_invite_links.token IS 'Токен для приглашения, используемый в URL';
  COMMENT ON COLUMN board_invite_links.default_role_id IS 'Роль, которая будет назначена пользователю при присоединении';
  COMMENT ON COLUMN board_invite_links.max_uses IS 'Максимальное количество использований ссылки (NULL - без ограничений)';
  COMMENT ON COLUMN board_invite_links.use_count IS 'Текущее количество использований ссылки';
  COMMENT ON COLUMN board_invite_links.expires_at IS 'Дата и время истечения срока действия ссылки (NULL - бессрочная)';
  COMMENT ON COLUMN board_invite_links.is_active IS 'Флаг активности ссылки';
  ```
- Создать таблицу `board_invite_uses` для отслеживания использования приглашений: 
  ```sql
  CREATE TABLE board_invite_uses (
      id BIGSERIAL PRIMARY KEY,
      invite_link_id BIGINT NOT NULL REFERENCES board_invite_links(id) ON DELETE CASCADE,
      user_id BIGINT NOT NULL REFERENCES users(id),
      ip_address VARCHAR(45),
      user_agent TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  
  CREATE INDEX idx_board_invite_uses_link ON board_invite_uses(invite_link_id);
  CREATE INDEX idx_board_invite_uses_user ON board_invite_uses(user_id);
  
  COMMENT ON TABLE board_invite_uses IS 'Таблица использований ссылок-приглашений';
  ```
- Добавить триггер для обновления счетчика использований приглашений: 
  ```sql
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
  ```
- Добавить функцию для проверки валидности приглашения: 
  ```sql
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
  ```