# Упрощенный план добавления функциональности для системы досок задач

## Последовательность реализации и зависимости

### Порядок реализации:

1. **Система обработки ошибок**
   - Базовая инфраструктура для обработки ошибок
   - Перехватчики на фронтенде и бэкенде
   - Тесты обработки ошибок

2. **Базовые роли для участников**
   - Создание таблицы roles
   - Миграция данных из старой структуры в новую
   - Модификация BoardMember для использования ролей
   - API для работы с ролями
   - Компоненты UI для работы с ролями

3. **Уведомления и добавление пользователей к доскам**
   - Создание таблицы notifications
   - Реализация UserSearchService
   - Бэкенд для работы с участниками доски
   - WebSocket для уведомлений
   - UI для добавления пользователей и просмотра уведомлений

4. **Приглашение пользователей по ссылке**
   - Создание таблиц для инвайт-линков
   - Реализация InviteLinkService
   - API для работы со ссылками
   - UI для генерации и управления ссылками
   - Страница присоединения по ссылке

### Зависимости между компонентами:

1. **Зависимости ядра:**
   - `NotificationService` ← `WebSocketConfig` (для real-time уведомлений)
   - `BoardMember` ← `Role` (для связи участников с ролями)
   - `BoardInviteLink` ← `Role` (для указания роли по умолчанию)
   - `BoardInviteUse` ← `BoardInviteLink` (для отслеживания использований)

2. **Зависимости API:**
   - `/api/boards/{boardId}/members` ← Таблица `board_members` и `roles`
   - `/api/boards/{boardId}/invite-links` ← Таблица `board_invite_links` и `roles`
   - `/api/invite/{token}` ← InviteLinkService, BoardMemberService, NotificationService

3. **Зависимости UI компонентов:**
   - `BoardMembersModal.tsx` ← `RoleSelector.tsx`, `MembersList.tsx`, `InviteForm.tsx`, `UserSearch.tsx`
   - `JoinByInviteLink.tsx` ← Страница аутентификации (для неавторизованных пользователей)
   - `Notifications.tsx` ← WebSocket подключение для real-time обновлений

4. **Зависимости миграций:**
   - Миграция `board_members` (добавление role_id) ← Создание таблицы `roles`
   - Создание таблицы `board_invite_links` ← Существование таблиц `roles`, `boards`, `users`
   - Триггер `board_invite_use_count_update` ← Таблицы `board_invite_uses` и `board_invite_links`

### Критические точки реализации:

1. **Миграция данных в БД**
   - Сохранение целостности существующих данных при переходе на новую схему
   - Корректное создание и заполнение таблицы ролей

2. **Безопасность WebSocket**
   - Авторизация подключений WebSocket
   - Изоляция каналов уведомлений между пользователями

3. **Жизненный цикл приглашений**
   - Механизм проверки валидности ссылок (истечение срока, лимит использований)
   - Обработка случая, когда пользователь не авторизован при переходе по ссылке

4. **Обработка Race Conditions**
   - Одновременное добавление одного пользователя разными администраторами
   - Использование приглашения в момент его деактивации

## 0. Общая система обработки ошибок

Для упрощения диагностики проблем и улучшения пользовательского опыта необходима стандартизированная система обработки ошибок.

### Backend:
- Создать глобальный обработчик исключений `GlobalExceptionHandler`
- Определить стандартную структуру ответа об ошибке `ErrorResponse`
- Реализовать специфические исключения для разных типов ошибок

#### Модели и компоненты:
```java
// ErrorResponse.java
@Data
@Builder
public class ErrorResponse {
    private String code;
    private String message;
    private String details;
    private LocalDateTime timestamp;
}

// GlobalExceptionHandler.java
@RestControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(EntityNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleEntityNotFoundException(EntityNotFoundException ex) {
        ErrorResponse error = ErrorResponse.builder()
                .code("ENTITY_NOT_FOUND")
                .message(ex.getMessage())
                .timestamp(LocalDateTime.now())
                .build();
        return new ResponseEntity<>(error, HttpStatus.NOT_FOUND);
    }
    
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleAccessDeniedException(AccessDeniedException ex) {
        ErrorResponse error = ErrorResponse.builder()
                .code("ACCESS_DENIED")
                .message("У вас нет прав для выполнения этой операции")
                .timestamp(LocalDateTime.now())
                .build();
        return new ResponseEntity<>(error, HttpStatus.FORBIDDEN);
    }
    
    @ExceptionHandler(InvalidInviteLinkException.class)
    public ResponseEntity<ErrorResponse> handleInvalidInviteLinkException(InvalidInviteLinkException ex) {
        ErrorResponse error = ErrorResponse.builder()
                .code("INVALID_INVITE_LINK")
                .message(ex.getMessage())
                .timestamp(LocalDateTime.now())
                .build();
        return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
    }
    
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGenericException(Exception ex) {
        ErrorResponse error = ErrorResponse.builder()
                .code("SERVER_ERROR")
                .message("Произошла внутренняя ошибка сервера")
                .details(ex.getMessage())
                .timestamp(LocalDateTime.now())
                .build();
        return new ResponseEntity<>(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}

// Пользовательские исключения
public class EntityNotFoundException extends RuntimeException {
    public EntityNotFoundException(String message) {
        super(message);
    }
}

public class InvalidInviteLinkException extends RuntimeException {
    public InvalidInviteLinkException(String message) {
        super(message);
    }
}

public class BoardMemberExistsException extends RuntimeException {
    public BoardMemberExistsException(String message) {
        super(message);
    }
}
```

### Frontend:
- Реализовать перехватчик ошибок API для централизованной обработки
- Создать компоненты для отображения ошибок:
  - `ErrorBoundary.tsx` - для отлова ошибок React-компонентов
  - `ErrorAlert.tsx` - для отображения сообщений об ошибках
  - `ErrorPage.tsx` - страница с информацией о критических ошибках

#### Пример структуры:
```typescript
// api/errorHandler.ts
import { AxiosError } from 'axios';
import { toast } from 'react-toastify';

export interface ErrorResponse {
  code: string;
  message: string;
  details?: string;
  timestamp: string;
}

export const handleApiError = (error: AxiosError): void => {
  const errorResponse = error.response?.data as ErrorResponse;
  
  if (!errorResponse) {
    console.error('Network error or unexpected format:', error);
    toast.error('Не удалось выполнить запрос. Проверьте подключение к интернету.');
    return;
  }
  
  console.error('API Error:', errorResponse);
  
  // Обработка специфических ошибок
  switch (errorResponse.code) {
    case 'ENTITY_NOT_FOUND':
      toast.error(errorResponse.message || 'Запрашиваемый ресурс не найден');
      break;
    case 'ACCESS_DENIED':
      toast.error(errorResponse.message || 'Доступ запрещен');
      break;
    case 'INVALID_INVITE_LINK':
      toast.error(errorResponse.message || 'Неверная ссылка-приглашение');
      break;
    case 'BOARD_MEMBER_EXISTS':
      toast.warning(errorResponse.message || 'Пользователь уже является участником доски');
      break;
    default:
      toast.error(errorResponse.message || 'Произошла ошибка при выполнении запроса');
  }
};
```

## 1. Добавление пользователей к доскам

### Backend:
- Создать модель `BoardMember` со связями к `User` и `Board`
- API эндпоинты:
  - `POST /api/boards/{boardId}/members` - добавление пользователя
  - `GET /api/boards/{boardId}/members` - список участников
  - `DELETE /api/boards/{boardId}/members/{userId}` - удаление пользователя
  - `GET /api/users/search` - поиск пользователей для приглашения
- Реализовать сервис `UserSearchService` с методом:
  - `findByQuery(query, searchType?)` - универсальный поиск
- Создать систему уведомлений:
  - Таблица `Notification` с типами `BOARD_INVITE`, `TASK_ASSIGNED` и т.д.
  - Сервис `NotificationService` для отправки уведомлений
- WebSocket для уведомлений в реальном времени

#### Модели и DTO:
```java
// Notification.java (Entity)
@Entity
@Table(name = "notifications")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Notification {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @Column(name = "title", nullable = false)
    private String title;
    
    @Column(name = "message", nullable = false)
    private String message;
    
    @Column(name = "type", nullable = false)
    private String type;
    
    @Column(name = "related_entity_id")
    private String relatedEntityId;
    
    @Column(name = "related_entity_type")
    private String relatedEntityType;
    
    @Column(name = "is_read")
    private boolean isRead;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}

// NotificationType.java (Enum)
public enum NotificationType {
    BOARD_INVITE,
    TASK_ASSIGNED,
    TASK_DUE_SOON,
    TASK_OVERDUE,
    NEW_COMMENT_MENTION,
    TASK_STATUS_CHANGED
}

// NotificationDTO.java
@Data
@Builder
public class NotificationDTO {
    private Long id;
    private String title;
    private String message;
    private String type;
    private String relatedEntityId;
    private String relatedEntityType;
    private boolean isRead;
    private LocalDateTime createdAt;
}

// BoardMemberDTO.java
@Data
@Builder
public class BoardMemberDTO {
    private Long userId;
    private String username;
    private String email;
    private String avatarUrl;
    private String role;
    private LocalDateTime joinedAt;
}

// UserSearchRequest.java
@Data
public class UserSearchRequest {
    private String query;
    private String searchType; // username, email, any
}

// UserSearchResponse.java
@Data
@Builder
public class UserSearchResponse {
    private List<UserDTO> users;
}
```

#### API Контракты:
```json
// POST /api/boards/{boardId}/members
// Request:
{
  "userId": 123,
  "roleId": 1
}

// Response: (200 OK)
{
  "id": 456,
  "userId": 123,
  "username": "johndoe",
  "email": "john@example.com",
  "avatarUrl": "https://example.com/avatar.jpg",
  "role": "EDITOR",
  "joinedAt": "2023-06-15T10:30:45"
}

// GET /api/boards/{boardId}/members
// Response: (200 OK)
{
  "members": [
    {
      "userId": 123,
      "username": "johndoe",
      "email": "john@example.com",
      "avatarUrl": "https://example.com/avatar.jpg",
      "role": "ADMIN",
      "joinedAt": "2023-06-10T14:20:30"
    },
    ...
  ],
  "totalCount": 5
}

// GET /api/users/search?query=john&searchType=any
// Response: (200 OK)
{
  "users": [
    {
      "id": 123,
      "username": "johndoe",
      "email": "john@example.com",
      "avatarUrl": "https://example.com/avatar.jpg"
    },
    ...
  ]
}

// GET /api/notifications
// Response: (200 OK)
{
  "notifications": [
    {
      "id": 789,
      "title": "Приглашение на доску",
      "message": "Вы были приглашены на доску 'Проект X'",
      "type": "BOARD_INVITE",
      "relatedEntityId": "board-123",
      "relatedEntityType": "BOARD",
      "isRead": false,
      "createdAt": "2023-06-16T09:45:30"
    },
    ...
  ],
  "unreadCount": 3,
  "totalCount": 10
}
```

### Frontend:
- Компоненты:
  - `BoardMembersModal.tsx` - окно управления участниками
  - `InviteForm.tsx` - форма приглашения
  - `MembersList.tsx` - список участников
  - `UserSearch.tsx` - поиск пользователей с автодополнением
- Добавить кнопку "Участники" в `BoardHeader.tsx`
- Создать страницу `Notifications.tsx` для просмотра приглашений
- Обновить сервисы `BoardsService` и создать `UserService`

### БД и миграции:
- Обратить внимание на существующую таблицу `board_members` в V1__Initial_schema.sql, которая уже имеет связи с `users` и `boards`
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

#### Возможные ошибки и их обработка:
```json
// 404 Not Found - Доска не найдена
{
  "code": "ENTITY_NOT_FOUND",
  "message": "Доска с ID board-123 не найдена",
  "timestamp": "2023-06-16T12:30:45"
}

// 404 Not Found - Пользователь не найден
{
  "code": "ENTITY_NOT_FOUND",
  "message": "Пользователь с ID 123 не найден",
  "timestamp": "2023-06-16T12:30:45"
}

// 403 Forbidden - Отсутствие прав
{
  "code": "ACCESS_DENIED",
  "message": "У вас нет прав для добавления участников на эту доску",
  "timestamp": "2023-06-16T12:30:45"
}

// 409 Conflict - Пользователь уже добавлен
{
  "code": "BOARD_MEMBER_EXISTS",
  "message": "Пользователь johndoe уже является участником этой доски",
  "timestamp": "2023-06-16T12:30:45"
}

// 400 Bad Request - Неверные данные
{
  "code": "VALIDATION_ERROR",
  "message": "Ошибка валидации данных",
  "details": "userId: не должно быть пустым",
  "timestamp": "2023-06-16T12:30:45"
}
```

## 2. Базовые роли для участников

### Backend:
- Создать модель `Role` с полями:
  - `id`, `name`, `description`
- Модифицировать `BoardMember`, добавив поле `roleId`
- Создать предустановленные роли:
  - `ADMIN` - полный доступ
  - `EDITOR` - редактирование задач
  - `VIEWER` - только просмотр
- API эндпоинты:
  - `GET /api/boards/{boardId}/roles` - получение ролей
  - `PUT /api/boards/{boardId}/members/{userId}/role` - изменение роли

#### Модели и DTO:
```java
// Role.java (Entity)
@Entity
@Table(name = "roles")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Role {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "name", nullable = false)
    private String name;
    
    @Column(name = "description")
    private String description;
    
    @ManyToOne
    @JoinColumn(name = "board_id")
    private Board board;
    
    @Column(name = "is_system")
    private boolean isSystem;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}

// BoardMember.java (Entity)
@Entity
@Table(name = "board_members")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BoardMember {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @ManyToOne
    @JoinColumn(name = "board_id", nullable = false)
    private Board board;
    
    @ManyToOne
    @JoinColumn(name = "role_id", nullable = false)
    private Role role;
    
    @Column(name = "joined_at")
    private LocalDateTime joinedAt;
}

// RoleDTO.java
@Data
@Builder
public class RoleDTO {
    private Long id;
    private String name;
    private String description;
    private boolean isSystem;
}

// UpdateMemberRoleRequest.java
@Data
public class UpdateMemberRoleRequest {
    private Long roleId;
}
```

#### API Контракты:
```json
// GET /api/boards/{boardId}/roles
// Response: (200 OK)
{
  "roles": [
    {
      "id": 1,
      "name": "ADMIN",
      "description": "Полный доступ к доске",
      "isSystem": true
    },
    {
      "id": 2,
      "name": "EDITOR",
      "description": "Может редактировать задачи и колонки",
      "isSystem": true
    },
    {
      "id": 3,
      "name": "VIEWER",
      "description": "Только просмотр доски",
      "isSystem": true
    }
  ]
}

// PUT /api/boards/{boardId}/members/{userId}/role
// Request:
{
  "roleId": 2
}

// Response: (200 OK)
{
  "userId": 123,
  "username": "johndoe",
  "email": "john@example.com",
  "avatarUrl": "https://example.com/avatar.jpg",
  "role": "EDITOR",
  "joinedAt": "2023-06-15T10:30:45"
}
```

### Frontend:
- Интерфейсы типов:
  - `src/types/Role.ts`
  - Обновить `src/types/BoardMember.ts`
- Компоненты:
  - `RoleSelector.tsx` - выбор роли
  - `RoleBadge.tsx` - отображение роли
- Интегрировать выбор ролей в `BoardMembersModal.tsx`

### БД и миграции:
- Создать таблицу `roles`: 
  ```sql
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
  
  CREATE INDEX idx_roles_board_id ON roles(board_id);
  CREATE INDEX idx_roles_is_system ON roles(is_system);
  
  COMMENT ON TABLE roles IS 'Таблица ролей для доступа к доскам';
  COMMENT ON COLUMN roles.board_id IS 'Ссылка на доску для пользовательских ролей; NULL для системных ролей';
  COMMENT ON COLUMN roles.is_system IS 'Признак системной предустановленной роли';
  ```
- Модифицировать таблицу `board_members`: 
  ```sql
  INSERT INTO roles (name, description, is_system) VALUES 
  ('ADMIN', 'Полный доступ к доске', TRUE),
  ('EDITOR', 'Может редактировать задачи и колонки', TRUE),
  ('VIEWER', 'Только просмотр доски', TRUE);
  

  ALTER TABLE board_members ADD COLUMN role_id BIGINT REFERENCES roles(id);
  
  -- Обновляем данные, устанавливая правильные роли на основе текущего поля role 
  UPDATE board_members
  SET role_id = (SELECT id FROM roles WHERE name = board_members.role AND is_system = TRUE)
  WHERE role IN ('ADMIN', 'EDITOR', 'VIEWER');
  
  -- Для других ролей, которые не совпадают с системными, устанавливаем роль VIEWER
  UPDATE board_members
  SET role_id = (SELECT id FROM roles WHERE name = 'VIEWER' AND is_system = TRUE)
  WHERE role_id IS NULL;
  
  -- Делаем поле role_id NOT NULL и удаляем старое поле role 
  ALTER TABLE board_members ALTER COLUMN role_id SET NOT NULL;
  ALTER TABLE board_members DROP COLUMN role;
  
  -- Добавляем индекс для ускорения поиска 
  CREATE INDEX idx_board_members_role_id ON board_members(role_id);
  ```
- Добавить триггер для обновления поля updated_at: 
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

#### Возможные ошибки и их обработка:
```json
// 404 Not Found - Роль не найдена
{
  "code": "ENTITY_NOT_FOUND",
  "message": "Роль с ID 5 не найдена",
  "timestamp": "2023-06-16T12:30:45"
}

// 404 Not Found - Участник не найден
{
  "code": "ENTITY_NOT_FOUND",
  "message": "Пользователь не является участником этой доски",
  "timestamp": "2023-06-16T12:30:45"
}

// 403 Forbidden - Отсутствие прав
{
  "code": "ACCESS_DENIED",
  "message": "У вас нет прав для изменения ролей участников",
  "timestamp": "2023-06-16T12:30:45"
}

// 400 Bad Request - Попытка изменить роль владельца
{
  "code": "OPERATION_NOT_ALLOWED",
  "message": "Невозможно изменить роль владельца доски",
  "timestamp": "2023-06-16T12:30:45"
}
```

## 3. Приглашение пользователей по ссылке

### Backend:
- Сервис `InviteLinkService` для генерации ссылок
- Модель `BoardInviteLink` для хранения ссылок
- API эндпоинты:
  - `POST /api/boards/{boardId}/invite-links` - генерация ссылки
  - `DELETE /api/boards/{boardId}/invite-links/{linkId}` - удаление
  - `GET /api/boards/{boardId}/invite-links` - список ссылок
  - `POST /api/invite/{token}` - присоединение по ссылке
- Возможность установки срока действия ссылки

#### Модели и DTO:
```java
// BoardInviteLink.java (Entity)
@Entity
@Table(name = "board_invite_links")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BoardInviteLink {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "board_id", nullable = false)
    private Board board;
    
    @Column(name = "token", nullable = false, unique = true)
    private String token;
    
    @ManyToOne
    @JoinColumn(name = "created_by", nullable = false)
    private User createdBy;
    
    @ManyToOne
    @JoinColumn(name = "default_role_id", nullable = false)
    private Role defaultRole;
    
    @Column(name = "max_uses")
    private Integer maxUses;
    
    @Column(name = "use_count")
    private Integer useCount;
    
    @Column(name = "expires_at")
    private LocalDateTime expiresAt;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @Column(name = "is_active")
    private boolean isActive;
}

// BoardInviteUse.java (Entity)
@Entity
@Table(name = "board_invite_uses")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BoardInviteUse {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "invite_link_id", nullable = false)
    private BoardInviteLink inviteLink;
    
    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @Column(name = "ip_address")
    private String ipAddress;
    
    @Column(name = "user_agent")
    private String userAgent;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
}

// BoardInviteLinkDTO.java
@Data
@Builder
public class BoardInviteLinkDTO {
    private Long id;
    private String token;
    private String inviteUrl;
    private UserDTO createdBy;
    private String roleName;
    private Integer maxUses;
    private Integer useCount;
    private LocalDateTime expiresAt;
    private LocalDateTime createdAt;
    private boolean isActive;
}

// CreateInviteLinkRequest.java
@Data
public class CreateInviteLinkRequest {
    private Long defaultRoleId;
    private Integer maxUses;
    private LocalDateTime expiresAt;
}

// JoinBoardByInviteRequest.java
@Data
public class JoinBoardByInviteRequest {
    // Может быть пустым, если пользователь уже авторизован
}

// JoinBoardByInviteResponse.java
@Data
@Builder
public class JoinBoardByInviteResponse {
    private Long boardId;
    private String boardName;
    private UserDTO invitedBy;
    private RoleDTO assignedRole;
    private boolean requiresAuthentication;
}
```

#### API Контракты:
```json
// POST /api/boards/{boardId}/invite-links
// Request:
{
  "defaultRoleId": 3,
  "maxUses": 5,
  "expiresAt": "2023-07-15T23:59:59"
}

// Response: (201 Created)
{
  "id": 789,
  "token": "AbCdEf123456",
  "inviteUrl": "https://mytaskboard.com/invite/AbCdEf123456",
  "createdBy": {
    "id": 123,
    "username": "johndoe",
    "avatarUrl": "https://example.com/avatar.jpg"
  },
  "roleName": "VIEWER",
  "maxUses": 5,
  "useCount": 0,
  "expiresAt": "2023-07-15T23:59:59",
  "createdAt": "2023-06-15T14:30:00",
  "isActive": true
}

// GET /api/boards/{boardId}/invite-links
// Response: (200 OK)
{
  "inviteLinks": [
    {
      "id": 789,
      "token": "AbCdEf123456",
      "inviteUrl": "https://mytaskboard.com/invite/AbCdEf123456",
      "createdBy": {
        "id": 123,
        "username": "johndoe",
        "avatarUrl": "https://example.com/avatar.jpg"
      },
      "roleName": "VIEWER",
      "maxUses": 5,
      "useCount": 2,
      "expiresAt": "2023-07-15T23:59:59",
      "createdAt": "2023-06-15T14:30:00",
      "isActive": true
    },
    ...
  ]
}

// POST /api/invite/{token}
// Response: (200 OK)
{
  "boardId": "board-123",
  "boardName": "Проект X",
  "invitedBy": {
    "id": 123,
    "username": "johndoe",
    "avatarUrl": "https://example.com/avatar.jpg"
  },
  "assignedRole": {
    "id": 3,
    "name": "VIEWER",
    "description": "Только просмотр доски"
  },
  "requiresAuthentication": false
}

// Response: (401 Unauthorized) - если пользователь не авторизован
{
  "boardId": "board-123",
  "boardName": "Проект X",
  "invitedBy": {
    "id": 123,
    "username": "johndoe"
  },
  "requiresAuthentication": true
}
```

### Frontend:
- Компоненты:
  - `InviteLinkGenerator.tsx` - генерация ссылок
  - `InviteLinksList.tsx` - управление ссылками
  - `JoinByInviteLink.tsx` - страница присоединения
- Копирование ссылки в буфер обмена
- Роутинг для страницы `/invite/:token`

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
- Создать таблицу для отслеживания использования приглашений: 
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
- Добавить триггер для обновления счетчика использований: 
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
  
  CREATE TRIGGER board_invite_use_count_update
      AFTER INSERT ON board_invite_uses
      FOR EACH ROW
      EXECUTE FUNCTION update_invite_use_count();
  ```

#### Возможные ошибки и их обработка:
```json
// 404 Not Found - Ссылка не найдена
{
  "code": "ENTITY_NOT_FOUND",
  "message": "Ссылка-приглашение не найдена или удалена",
  "timestamp": "2023-06-16T12:30:45"
}

// 400 Bad Request - Ссылка неактивна/истекла
{
  "code": "INVALID_INVITE_LINK",
  "message": "Срок действия приглашения истек",
  "timestamp": "2023-06-16T12:30:45"
}

// 400 Bad Request - Превышено число использований
{
  "code": "INVALID_INVITE_LINK",
  "message": "Превышено максимальное количество использований приглашения",
  "timestamp": "2023-06-16T12:30:45"
}

// 403 Forbidden - Отсутствие прав для создания ссылки
{
  "code": "ACCESS_DENIED",
  "message": "У вас нет прав для создания приглашений на эту доску",
  "timestamp": "2023-06-16T12:30:45"
}

// 409 Conflict - Пользователь уже является участником
{
  "code": "BOARD_MEMBER_EXISTS",
  "message": "Вы уже являетесь участником этой доски",
  "timestamp": "2023-06-16T12:30:45"
}
```

### Логирование ошибок
Реализовать систему логирования ошибок для облегчения отладки:

```java
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGenericException(Exception ex, HttpServletRequest request) {
        log.error("Unhandled exception: {} in {} {}", ex.getMessage(), 
                  request.getMethod(), request.getRequestURI(), ex);
        
        ErrorResponse error = ErrorResponse.builder()
                .code("SERVER_ERROR")
                .message("Произошла внутренняя ошибка сервера")
                .timestamp(LocalDateTime.now())
                .build();
        return new ResponseEntity<>(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}
```

Для фронтенда настроить отслеживание ошибок:

```typescript
// utils/errorReporting.ts
import * as Sentry from '@sentry/react';

export const initErrorReporting = () => {
  if (process.env.NODE_ENV === 'production') {
    Sentry.init({
      dsn: process.env.REACT_APP_SENTRY_DSN,
      environment: process.env.NODE_ENV,
      release: process.env.REACT_APP_VERSION || 'unknown',
      tracesSampleRate: 0.1,
    });
  }
};

export const reportError = (error: Error, contextData?: Record<string, any>) => {
  console.error(error);
  
  if (process.env.NODE_ENV === 'production') {
    Sentry.withScope((scope) => {
      if (contextData) {
        Object.entries(contextData).forEach(([key, value]) => {
          scope.setExtra(key, value);
        });
      }
      Sentry.captureException(error);
    });
  }
};
```
