# MyTaskBoard API Documentation

Полная документация REST API для системы управления задачами MyTaskBoard.

## Оглавление
1. [Общая информация](#общая-информация)
2. [Аутентификация](#аутентификация)
3. [Доски (Boards)](#доски-boards)
4. [Задачи (Tasks)](#задачи-tasks)
5. [Пользователи (Users)](#пользователи-users)
6. [Уведомления (Notifications)](#уведомления-notifications)
7. [Настройки пользователей (User Settings)](#настройки-пользователей-user-settings)
8. [Роли (Roles)](#роли-roles)
9. [Участники досок (Board Members)](#участники-досок-board-members)
10. [Приглашения (Invites)](#приглашения-invites)
11. [Подзадачи (Subtasks)](#подзадачи-subtasks)
12. [Шаблоны задач (Task Templates)](#шаблоны-задач-task-templates)
13. [Telegram Integration](#telegram-integration)
14. [WebSocket API](#websocket-api)
15. [Обработка ошибок](#обработка-ошибок)

## Общая информация

### Base URL
```
http://localhost:8081/api
```

### Content-Type
Все запросы должны использовать `Content-Type: application/json`

### Аутентификация
API использует JWT токены. Токен должен передаваться в заголовке:
```
Authorization: Bearer <jwt_token>
```

### Общие HTTP статус коды
- `200 OK` - Успешный запрос
- `201 Created` - Ресурс создан
- `204 No Content` - Успешное удаление
- `400 Bad Request` - Неверный запрос
- `401 Unauthorized` - Не авторизован
- `403 Forbidden` - Доступ запрещен
- `404 Not Found` - Ресурс не найден
- `500 Internal Server Error` - Внутренняя ошибка сервера

## Аутентификация

### Регистрация пользователя
`POST /auth/register`

**Тело запроса:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Ответ (201 Created):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "USER",
    "avatar": null
  }
}
```

### Вход в систему
`POST /auth/login`

**Тело запроса:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Ответ (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "USER",
    "avatar": null
  }
}
```

### Обновление токена
`POST /auth/refresh`

**Заголовки:**
```
Authorization: Bearer <old_token>
```

**Ответ (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Telegram аутентификация
`POST /auth/telegram`

**Тело запроса:**
```json
{
  "telegramUserId": "123456789",
  "firstName": "John",
  "lastName": "Doe",
  "username": "johndoe"
}
```

**Ответ (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": null,
    "firstName": "John",
    "lastName": "Doe",
    "telegramId": "123456789",
    "role": "USER"
  }
}
```

## Доски (Boards)

### Создание доски
`POST /boards`

**Тело запроса:**
```json
{
  "name": "Development Board",
  "description": "Board for development tasks"
}
```

**Ответ (200 OK):**
```json
{
  "id": "123",
  "name": "Development Board",
  "description": "Board for development tasks",
  "owner": {
    "id": 1,
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe"
  },
  "columns": [],
  "createdAt": "2025-01-19T18:00:00Z"
}
```

### Получение досок пользователя
`GET /boards/user/{userId}`

**Ответ (200 OK):**
```json
[
  {
    "id": "123",
    "name": "Development Board",
    "description": "Board for development tasks",
    "owner": {
      "id": 1,
      "email": "user@example.com"
    },
    "createdAt": "2025-01-19T18:00:00Z"
  }
]
```

### Получение доски по ID
`GET /boards/{id}`

**Ответ (200 OK):**
```json
{
  "id": "123",
  "name": "Development Board",
  "description": "Board for development tasks",
  "owner": {
    "id": 1,
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe"
  },
  "columns": [
    {
      "id": 1,
      "name": "To Do",
      "position": 0,
      "color": "#E0E0E0"
    }
  ],
  "members": [
    {
      "id": 1,
      "user": {
        "id": 1,
        "email": "user@example.com"
      },
      "role": {
        "id": 1,
        "name": "ADMIN"
      }
    }
  ],
  "taskTypes": [],
  "taskStatuses": [],
  "createdAt": "2025-01-19T18:00:00Z"
}
```

### Обновление доски
`PUT /boards/{id}`

**Тело запроса:**
```json
{
  "name": "Updated Board Name",
  "description": "Updated description"
}
```

**Ответ (200 OK):**
```json
{
  "id": "123",
  "name": "Updated Board Name",
  "description": "Updated description",
  "createdAt": "2025-01-19T18:00:00Z"
}
```

### Частичное обновление доски
`PATCH /boards/{id}`

**Тело запроса:**
```json
{
  "name": "New Name"
}
```

### Добавление колонки к доске
`POST /boards/{boardId}/columns`

**Тело запроса:**
```json
{
  "name": "In Progress",
  "color": "#4CAF50"
}
```

**Ответ (200 OK):**
```json
{
  "id": "123",
  "name": "Development Board",
  "columns": [
    {
      "id": 2,
      "name": "In Progress",
      "position": 1,
      "color": "#4CAF50"
    }
  ]
}
```

### Обновление колонки
`PUT /boards/{boardId}/columns/{columnId}`

**Тело запроса:**
```json
{
  "name": "Updated Column Name",
  "color": "#FF9800"
}
```

### Удаление колонки из доски
`DELETE /boards/{boardId}/columns/{columnId}`

**Ответ (200 OK):**
```json
{
  "id": "123",
  "name": "Development Board",
  "columns": []
}
```

### Перемещение колонки
`PATCH /boards/{boardId}/columns/{columnId}/move/{newPosition}`

**Ответ (200 OK):**
```json
{
  "id": "123",
  "name": "Development Board",
  "columns": [
    {
      "id": 2,
      "name": "In Progress",
      "position": 0,
      "color": "#4CAF50"
    }
  ]
}
```

### Архивирование доски
`PATCH /boards/{id}/archive`

**Ответ (200 OK):**
```json
{
  "id": "123",
  "name": "Development Board",
  "archived": true
}
```

### Восстановление доски
`PATCH /boards/{id}/restore`

**Ответ (200 OK):**
```json
{
  "id": "123",
  "name": "Development Board",
  "archived": false
}
```

### Удаление доски
`DELETE /boards/{id}`

**Ответ (204 No Content)**

## Задачи (Tasks)

### Создание задачи
`POST /tasks`

**Тело запроса:**
```json
{
  "title": "Implement API documentation",
  "description": "Create comprehensive API docs",
  "priority": "HIGH",
  "column": {
    "id": "1"
  },
  "startDate": "2025-01-19T18:00:00.000Z",
  "endDate": "2025-01-31T18:00:00.000Z",
  "tags": ["documentation", "api"],
  "statusId": 1,
  "typeId": 2
}
```

**Ответ (200 OK):**
```json
{
  "id": 789,
  "title": "Implement API documentation",
  "description": "Create comprehensive API docs",
  "priority": "HIGH",
  "startDate": "2025-01-19T18:00:00",
  "endDate": "2025-01-31T18:00:00",
  "daysRemaining": 12,
  "tags": ["documentation", "api"],
  "column": {
    "id": 1,
    "name": "To Do"
  },
  "customStatus": {
    "id": 1,
    "name": "New",
    "color": "#2196F3"
  },
  "type": {
    "id": 2,
    "name": "Feature",
    "icon": "feature",
    "color": "#4CAF50"
  },
  "assignedTo": [],
  "watchers": [],
  "comments": [],
  "attachments": [],
  "subtasks": [],
  "commentCount": 0,
  "attachmentCount": 0,
  "createdBy": {
    "id": 1,
    "email": "user@example.com"
  },
  "createdAt": "2025-01-19T18:00:00Z",
  "updatedAt": "2025-01-19T18:00:00Z"
}
```

### Получение задачи по ID
`GET /tasks/{id}`

**Ответ (200 OK):**
```json
{
  "id": 789,
  "title": "Implement API documentation",
  "description": "Create comprehensive API docs",
  "priority": "HIGH",
  "startDate": "2025-01-19T18:00:00",
  "endDate": "2025-01-31T18:00:00",
  "daysRemaining": 12,
  "tags": ["documentation", "api"],
  "column": {
    "id": 1,
    "name": "To Do"
  },
  "customStatus": {
    "id": 1,
    "name": "New",
    "color": "#2196F3"
  },
  "type": {
    "id": 2,
    "name": "Feature",
    "icon": "feature",
    "color": "#4CAF50"
  },
  "assignedTo": [],
  "watchers": [],
  "comments": [],
  "attachments": [],
  "subtasks": [],
  "commentCount": 0,
  "attachmentCount": 0,
  "createdBy": {
    "id": 1,
    "email": "user@example.com"
  },
  "createdAt": "2025-01-19T18:00:00Z",
  "updatedAt": "2025-01-19T18:00:00Z"
}
```

### Получение задач по колонке
`GET /tasks/column/{columnId}`

**Ответ (200 OK):**
```json
[
  {
    "id": 789,
    "title": "Implement API documentation",
    "priority": "HIGH",
    "column": {
      "id": 1,
      "name": "To Do"
    },
    "createdAt": "2025-01-19T18:00:00Z"
  }
]
```

### Обновление задачи
`PUT /tasks/{taskId}`

**Тело запроса:**
```json
{
  "title": "Updated Task Title",
  "description": "Updated description",
  "priority": "MEDIUM"
}
```

**Ответ (200 OK):**
```json
{
  "id": 789,
  "title": "Updated Task Title",
  "description": "Updated description",
  "priority": "MEDIUM",
  "updatedAt": "2025-01-19T19:00:00Z"
}
```

### Перемещение задачи
`PATCH /tasks/{taskId}/move/{newColumnId}`

**Ответ (200 OK):**
```json
{
  "id": 789,
  "title": "Implement API documentation",
  "column": {
    "id": 2,
    "name": "In Progress"
  },
  "updatedAt": "2025-01-19T19:00:00Z"
}
```

### Перемещение задачи с позицией
`POST /tasks/move`

**Тело запроса:**
```json
{
  "taskId": 789,
  "sourceColumnId": 1,
  "destinationColumnId": 2,
  "destinationIndex": 0
}
```

### Назначение задачи пользователю
`PATCH /tasks/{taskId}/assign/{userId}`

**Ответ (200 OK):**
```json
{
  "id": 789,
  "title": "Implement API documentation",
  "assignedTo": [
    {
      "id": 1,
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe"
    }
  ],
  "updatedAt": "2025-01-19T19:00:00Z"
}
```

### Снятие назначения задачи
`PATCH /tasks/{taskId}/unassign`

**Ответ (200 OK):**
```json
{
  "id": 789,
  "title": "Implement API documentation",
  "assignedTo": [],
  "updatedAt": "2025-01-19T19:00:00Z"
}
```

### Обновление тегов задачи
`PATCH /tasks/{taskId}/tags`

**Тело запроса:**
```json
["documentation", "api", "feature"]
```

### Обновление статуса задачи
`PATCH /tasks/{taskId}/status`

**Тело запроса:**
```json
{
  "statusId": 2
}
```

### Обновление приоритета задачи
`PATCH /tasks/{taskId}/priority`

**Тело запроса:**
```json
{
  "priority": "HIGH"
}
```

### Удаление задачи
`DELETE /tasks/{id}`

**Ответ (204 No Content)**

### Комментарии к задачам

#### Добавление комментария
`POST /tasks/{taskId}/comments`

**Тело запроса:**
```json
{
  "content": "This is a comment"
}
```

**Ответ (201 Created):**
```json
{
  "id": 789,
  "comments": [
    {
      "id": 1,
      "content": "This is a comment",
      "author": {
        "id": 1,
        "email": "user@example.com"
      },
      "createdAt": "2025-01-19T19:00:00Z"
    }
  ],
  "commentCount": 1
}
```

#### Обновление комментария
`PUT /tasks/{taskId}/comments/{commentId}`

**Тело запроса:**
```json
{
  "content": "Updated comment content"
}
```

#### Удаление комментария
`DELETE /tasks/{taskId}/comments/{commentId}`

### Вложения к задачам

#### Добавление вложения
`POST /tasks/{taskId}/attachments`

**Content-Type:** `multipart/form-data`

**Параметры:**
- `file` - файл для загрузки

**Ответ (200 OK):**
```json
{
  "id": 789,
  "attachments": [
    {
      "id": 1,
      "filename": "document.pdf",
      "originalFilename": "document.pdf",
      "size": 1024,
      "mimeType": "application/pdf",
      "uploadedBy": {
        "id": 1,
        "email": "user@example.com"
      },
      "createdAt": "2025-01-19T19:00:00Z"
    }
  ],
  "attachmentCount": 1
}
```

#### Удаление вложения
`DELETE /tasks/{taskId}/attachments/{attachmentId}`

### История задач

#### Получение истории задачи
`GET /tasks/{taskId}/history`

**Ответ (200 OK):**
```json
[
  {
    "id": 1,
    "action": "CREATED",
    "field": null,
    "oldValue": null,
    "newValue": null,
    "user": {
      "id": 1,
      "email": "user@example.com"
    },
    "timestamp": "2025-01-19T18:00:00Z"
  },
  {
    "id": 2,
    "action": "UPDATED",
    "field": "title",
    "oldValue": "Old Title",
    "newValue": "New Title",
    "user": {
      "id": 1,
      "email": "user@example.com"
    },
    "timestamp": "2025-01-19T19:00:00Z"
  }
]
```

#### Добавление записи в историю
`POST /tasks/{taskId}/history`

**Тело запроса:**
```json
{
  "action": "MANUAL_ENTRY",
  "description": "Manual history entry"
}
```

### Теги

#### Получение всех тегов
`GET /tasks/tags`

**Ответ (200 OK):**
```json
["documentation", "api", "feature", "bug", "enhancement"]
```

#### Добавление нового тега
`POST /tasks/tags`

**Тело запроса:**
```json
{
  "tag": "new-tag"
}
```

## Пользователи (Users)

### Получение всех пользователей
`GET /users`

**Ответ (200 OK):**
```json
[
  {
    "id": 1,
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "avatar": null,
    "role": "USER",
    "isActive": true,
    "lastActive": "2025-01-19T18:00:00Z",
    "createdAt": "2025-01-01T00:00:00Z"
  }
]
```

### Получение пользователя по ID
`GET /users/{id}`

**Ответ (200 OK):**
```json
{
  "id": 1,
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "avatar": null,
  "role": "USER",
  "isActive": true,
  "lastActive": "2025-01-19T18:00:00Z",
  "createdAt": "2025-01-01T00:00:00Z"
}
```

### Обновление профиля пользователя
`PUT /users/{id}/profile`

**Тело запроса:**
```json
{
  "firstName": "John",
  "lastName": "Smith",
  "email": "john.smith@example.com"
}
```

**Ответ (200 OK):**
```json
{
  "id": 1,
  "email": "john.smith@example.com",
  "firstName": "John",
  "lastName": "Smith",
  "avatar": null,
  "role": "USER"
}
```

### Загрузка аватара
`POST /users/{id}/avatar`

**Content-Type:** `multipart/form-data`

**Параметры:**
- `avatar` - файл изображения

**Ответ (200 OK):**
```json
{
  "id": 1,
  "avatar": "/uploads/avatars/user1_avatar.jpg"
}
```

### Обновление аватара
`PUT /users/{id}/avatar`

**Тело запроса:**
```json
{
  "croppedImageData": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ..."
}
```

### Смена пароля
`POST /users/{id}/change-password`

**Тело запроса:**
```json
{
  "oldPassword": "oldpass123",
  "newPassword": "newpass456"
}
```

**Ответ (200 OK):**
```json
{
  "message": "Password changed successfully"
}
```

### Деактивация пользователя
`PATCH /users/{id}/deactivate`

### Активация пользователя
`PATCH /users/{id}/activate`

### Поиск пользователей
`GET /users/search`

**Параметры запроса:**
- `query` - строка поиска

**Ответ (200 OK):**
```json
[
  {
    "id": 1,
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "avatar": null
  }
]
```

## Уведомления (Notifications)

### Получение уведомлений пользователя
`GET /notifications`

**Параметры запроса:**
- `page` - номер страницы (по умолчанию 0)
- `size` - размер страницы (по умолчанию 20)
- `sort` - поле сортировки (по умолчанию createdAt)

**Ответ (200 OK):**
```json
{
  "content": [
    {
      "id": 1,
      "type": "TASK_ASSIGNED",
      "title": "Task assigned",
      "message": "You have been assigned to task 'Implement API documentation'",
      "isRead": false,
      "isArchived": false,
      "priority": "MEDIUM",
      "relatedEntityId": 789,
      "relatedEntityType": "TASK",
      "createdAt": "2025-01-19T18:00:00Z"
    }
  ],
  "pageable": {
    "pageNumber": 0,
    "pageSize": 20
  },
  "totalElements": 1,
  "totalPages": 1
}
```

### Получение непрочитанных уведомлений
`GET /notifications/unread`

**Ответ (200 OK):**
```json
[
  {
    "id": 1,
    "type": "TASK_ASSIGNED",
    "title": "Task assigned",
    "message": "You have been assigned to task 'Implement API documentation'",
    "isRead": false,
    "createdAt": "2025-01-19T18:00:00Z"
  }
]
```

### Получение количества непрочитанных уведомлений
`GET /notifications/unread/count`

**Ответ (200 OK):**
```json
{
  "count": 5
}
```

### Получение архивированных уведомлений
`GET /notifications/archived`

### Отметка уведомления как прочитанного
`PUT /notifications/{notificationId}/read`

**Ответ (200 OK)**

### Архивирование уведомления
`PUT /notifications/{notificationId}/archive`

**Ответ (200 OK)**

### Отметка всех уведомлений как прочитанных
`PUT /notifications/read-all`

**Ответ (200 OK):**
```json
{
  "updatedCount": 5
}
```

### Массовая отметка уведомлений как прочитанных
`PUT /notifications/bulk/read`

**Тело запроса:**
```json
{
  "notificationIds": [1, 2, 3]
}
```

### Удаление уведомления
`DELETE /notifications/{notificationId}`

**Ответ (200 OK)**

### Массовое удаление уведомлений
`DELETE /notifications/bulk`

**Тело запроса:**
```json
{
  "notificationIds": [1, 2, 3]
}
```

### Настройки уведомлений

#### Получение настроек уведомлений
`GET /notifications/preferences`

**Ответ (200 OK):**
```json
{
  "webEnabled": true,
  "emailEnabled": false,
  "telegramEnabled": true,
  "taskAssigned": {
    "web": true,
    "email": false,
    "telegram": true
  },
  "taskUpdated": {
    "web": true,
    "email": false,
    "telegram": false
  },
  "taskCommented": {
    "web": true,
    "email": false,
    "telegram": true
  },
  "taskMoved": {
    "web": false,
    "email": false,
    "telegram": false
  },
  "taskCompleted": {
    "web": true,
    "email": false,
    "telegram": true
  },
  "boardInvite": {
    "web": true,
    "email": true,
    "telegram": true
  },
  "mention": {
    "web": true,
    "email": false,
    "telegram": true
  },
  "deadline": {
    "web": true,
    "email": true,
    "telegram": true
  }
}
```

#### Обновление настроек уведомлений
`PUT /notifications/preferences`

**Тело запроса:**
```json
{
  "webEnabled": true,
  "emailEnabled": true,
  "telegramEnabled": true,
  "taskAssigned": {
    "web": true,
    "email": true,
    "telegram": true
  }
}
```

#### Обновление отдельной настройки
`PATCH /notifications/preferences/{settingKey}`

**Тело запроса:**
```json
{
  "value": true
}
```

## Настройки пользователей (User Settings)

### Получение настроек пользователя
`GET /user-settings`

**Ответ (200 OK):**
```json
{
  "id": 1,
  "theme": "DARK",
  "language": "ru",
  "timezone": "Europe/Moscow",
  "notifications": {
    "webEnabled": true,
    "emailEnabled": false,
    "telegramEnabled": true
  }
}
```

### Обновление настроек пользователя
`PUT /user-settings`

**Тело запроса:**
```json
{
  "theme": "LIGHT",
  "language": "en",
  "timezone": "UTC"
}
```

## Роли (Roles)

### Получение всех ролей
`GET /roles`

**Ответ (200 OK):**
```json
[
  {
    "id": 1,
    "name": "ADMIN",
    "displayName": "Administrator",
    "description": "Full access to all features",
    "permissions": ["READ", "WRITE", "DELETE", "MANAGE_USERS"]
  },
  {
    "id": 2,
    "name": "USER",
    "displayName": "User",
    "description": "Standard user access",
    "permissions": ["READ", "WRITE"]
  }
]
```

### Получение роли по ID
`GET /roles/{id}`

### Создание роли
`POST /roles`

**Тело запроса:**
```json
{
  "name": "MANAGER",
  "displayName": "Manager",
  "description": "Team management access",
  "permissions": ["READ", "WRITE", "MANAGE_TEAM"]
}
```

## Участники досок (Board Members)

### Получение участников доски
`GET /board-members/board/{boardId}`

**Ответ (200 OK):**
```json
[
  {
    "id": 1,
    "user": {
      "id": 1,
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "avatar": null
    },
    "role": {
      "id": 1,
      "name": "ADMIN"
    },
    "joinedAt": "2025-01-19T18:00:00Z"
  }
]
```

### Добавление участника к доске
`POST /board-members/add`

**Тело запроса:**
```json
{
  "boardId": "123",
  "userId": 2,
  "roleId": 2
}
```

### Обновление роли участника
`PUT /board-members/{memberId}/role`

**Тело запроса:**
```json
{
  "roleId": 1
}
```

### Удаление участника из доски
`DELETE /board-members/{memberId}`

## Приглашения (Invites)

### Создание ссылки-приглашения
`POST /invite-links`

**Тело запроса:**
```json
{
  "boardId": "123",
  "roleId": 2,
  "expiresAt": "2025-01-31T23:59:59Z",
  "maxUses": 10
}
```

**Ответ (200 OK):**
```json
{
  "id": 1,
  "inviteCode": "abc123def456",
  "boardId": "123",
  "role": {
    "id": 2,
    "name": "USER"
  },
  "expiresAt": "2025-01-31T23:59:59Z",
  "maxUses": 10,
  "currentUses": 0,
  "isActive": true,
  "createdBy": {
    "id": 1,
    "email": "user@example.com"
  },
  "createdAt": "2025-01-19T18:00:00Z"
}
```

### Получение приглашений доски
`GET /invite-links/board/{boardId}`

### Присоединение к доске по приглашению
`POST /invite-links/{inviteCode}/join`

**Ответ (200 OK):**
```json
{
  "success": true,
  "board": {
    "id": "123",
    "name": "Development Board"
  },
  "role": {
    "id": 2,
    "name": "USER"
  }
}
```

### Деактивация ссылки-приглашения
`DELETE /invite-links/{inviteLinkId}`

## Подзадачи (Subtasks)

### Получение подзадач
`GET /subtasks/task/{taskId}`

**Ответ (200 OK):**
```json
[
  {
    "id": 1,
    "title": "Research API design patterns",
    "description": "Study REST API best practices",
    "completed": false,
    "parentTaskId": 789,
    "createdBy": {
      "id": 1,
      "email": "user@example.com"
    },
    "createdAt": "2025-01-19T18:00:00Z"
  }
]
```

### Создание подзадачи
`POST /subtasks`

**Тело запроса:**
```json
{
  "title": "Research API design patterns",
  "description": "Study REST API best practices",
  "parentTaskId": 789
}
```

### Обновление подзадачи
`PUT /subtasks/{id}`

**Тело запроса:**
```json
{
  "title": "Updated subtask title",
  "completed": true
}
```

### Удаление подзадачи
`DELETE /subtasks/{id}`

## Шаблоны задач (Task Templates)

### Получение шаблонов доски
`GET /task-templates/board/{boardId}`

**Ответ (200 OK):**
```json
[
  {
    "id": 1,
    "name": "Bug Report Template",
    "description": "Template for reporting bugs",
    "titleTemplate": "Bug: [Issue Title]",
    "descriptionTemplate": "## Steps to reproduce:\n1. \n2. \n\n## Expected behavior:\n\n## Actual behavior:",
    "priority": "HIGH",
    "tags": ["bug", "urgent"],
    "boardId": "123",
    "createdBy": {
      "id": 1,
      "email": "user@example.com"
    },
    "createdAt": "2025-01-19T18:00:00Z"
  }
]
```

### Создание шаблона задачи
`POST /task-templates`

**Тело запроса:**
```json
{
  "name": "Feature Request Template",
  "description": "Template for feature requests",
  "titleTemplate": "Feature: [Feature Name]",
  "descriptionTemplate": "## Feature description:\n\n## Acceptance criteria:\n- [ ] \n- [ ] ",
  "priority": "MEDIUM",
  "tags": ["feature", "enhancement"],
  "boardId": "123"
}
```

### Обновление шаблона
`PUT /task-templates/{id}`

### Удаление шаблона
`DELETE /task-templates/{id}`

### Создание задачи из шаблона
`POST /task-templates/{id}/create-task`

**Тело запроса:**
```json
{
  "columnId": 1,
  "customTitle": "Implement user authentication",
  "customDescription": "Add JWT-based authentication system"
}
```

## Telegram Integration

### Обработка данных Web App
`POST /telegram/webapp`

**Тело запроса:**
```json
{
  "data": "webapp_data_string"
}
```

**Ответ (200 OK):**
```json
{
  "message": "WebApp data processed successfully"
}
```

### Получение ссылки для шаринга задачи
`GET /telegram/task/{taskId}/share`

**Ответ (200 OK):**
```json
{
  "link": "https://t.me/share/url?url=https://mytaskboard.com/task/789"
}
```

### Получение URL для Telegram аутентификации
`GET /telegram/auth/url`

**Ответ (200 OK):**
```json
{
  "url": "https://t.me/your_bot?start=auth_123456"
}
```

## WebSocket API

### Подключение к WebSocket

**URL:** `ws://localhost:8081/ws`

**Протокол:** STOMP over WebSocket

### Подписка на уведомления
```javascript
stompClient.subscribe('/user/queue/notifications', function(message) {
    const notification = JSON.parse(message.body);
    // Обработка уведомления
});
```

### Подписка на обновления доски
```javascript
stompClient.subscribe('/topic/board/123', function(message) {
    const update = JSON.parse(message.body);
    // Обработка обновления доски
});
```

### Подписка на обновления задачи
```javascript
stompClient.subscribe('/topic/task/789', function(message) {
    const update = JSON.parse(message.body);
    // Обработка обновления задачи
});
```

### Пример сообщения WebSocket

**Уведомление:**
```json
{
  "type": "NOTIFICATION",
  "data": {
    "id": 1,
    "type": "TASK_ASSIGNED",
    "title": "Task assigned",
    "message": "You have been assigned to task 'Implement API documentation'",
    "createdAt": "2025-01-19T18:00:00Z"
  }
}
```

**Обновление задачи:**
```json
{
  "type": "TASK_UPDATED",
  "data": {
    "taskId": 789,
    "columnId": 2,
    "changes": {
      "status": "IN_PROGRESS"
    }
  }
}
```

## Обработка ошибок

### Структура ошибки
```json
{
  "error": "error_code",
  "message": "Human readable error message",
  "timestamp": "2025-01-19T18:00:00Z",
  "path": "/api/tasks/789",
  "details": {
    "field": "validation error details"
  }
}
```

### Коды ошибок

#### 400 Bad Request
```json
{
  "error": "validation_error",
  "message": "Validation failed",
  "details": {
    "title": "Title is required",
    "email": "Invalid email format"
  }
}
```

#### 401 Unauthorized
```json
{
  "error": "authentication_error",
  "message": "Invalid credentials"
}
```

#### 403 Forbidden
```json
{
  "error": "access_denied",
  "message": "You don't have permission to access this resource"
}
```

#### 404 Not Found
```json
{
  "error": "resource_not_found",
  "message": "Task with ID 789 not found"
}
```

#### 409 Conflict
```json
{
  "error": "conflict",
  "message": "User with this email already exists"
}
```

#### 500 Internal Server Error
```json
{
  "error": "internal_error",
  "message": "An unexpected error occurred"
}
```

### Health Check

#### Проверка состояния API
`GET /health`

**Ответ (200 OK):**
```json
{
  "status": "UP",
  "timestamp": "2025-01-19T18:00:00Z",
  "version": "1.0.0",
  "services": {
    "database": "UP",
    "telegram": "UP"
  }
}
```

## Заключение

Данная документация покрывает все основные API эндпоинты системы MyTaskBoard. Для получения актуальной интерактивной документации используйте Swagger UI по адресу `http://localhost:8081/swagger-ui.html`.

**Примечания:**
- Все даты возвращаются в формате ISO 8601 UTC
- Пагинация использует стандартные параметры Spring Data
- WebSocket соединения требуют аутентификации через JWT токен
- Файлы загружаются как multipart/form-data
- API поддерживает CORS для фронтенд приложения