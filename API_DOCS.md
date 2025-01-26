# Task Board API Documentation

## Table of Contents
1. [Boards](#boards)
2. [Tasks](#tasks)
3. [Users](#users)
4. [Notifications](#notifications)
5. [Files](#files)
6. [Notes](#notes)
7. [Telegram Integration](#telegram-integration)

## Boards

### Create Board
`POST /api/boards`

**Request:**
```json
{
  "name": "Development Board",
  "description": "Board for tracking development tasks"
}
```

**Success Response (201 Created):**
```json
{
  "id": 123,
  "name": "Development Board",
  "createdAt": "2025-01-19T18:00:00Z"
}
```

### Get User Boards
`GET /api/boards/user/{userId}`

**Success Response (200 OK):**
```json
[
  {
    "id": 123,
    "name": "Development Board",
    "createdAt": "2025-01-19T18:00:00Z"
  }
]
```

### Update Board
`PUT /api/boards/{id}`

**Request:**
```json
{
  "name": "Updated Board Name",
  "description": "Updated description"
}
```

**Success Response (200 OK):**
```json
{
  "id": 123,
  "name": "Updated Board Name",
  "description": "Updated description",
  "createdAt": "2025-01-19T18:00:00Z"
}
```

### Add Column to Board
`POST /api/boards/{boardId}/columns`

**Request:**
```json
{
  "name": "In Progress",
  "order": 2
}
```

**Success Response (200 OK):**
```json
{
  "id": 123,
  "name": "Development Board",
  "columns": [
    {
      "id": 456,
      "name": "In Progress",
      "order": 2
    }
  ]
}
```

### Remove Column from Board
`DELETE /api/boards/{boardId}/columns/{columnId}`

**Success Response (200 OK):**
```json
{
  "id": 123,
  "name": "Development Board",
  "columns": []
}
```

### Move Column in Board
`PATCH /api/boards/{boardId}/columns/{columnId}/move/{newPosition}`

**Success Response (200 OK):**
```json
{
  "id": 123,
  "name": "Development Board",
  "columns": [
    {
      "id": 456,
      "name": "In Progress",
      "order": 1
    }
  ]
}
```

### Archive Board
`PATCH /api/boards/{id}/archive`

**Success Response (200 OK):**
```json
{
  "id": 123,
  "name": "Development Board",
  "archived": true
}
```

### Restore Board
`PATCH /api/boards/{id}/restore`

**Success Response (200 OK):**
```json
{
  "id": 123,
  "name": "Development Board",
  "archived": false
}
```

### Delete Board
`DELETE /api/boards/{id}`

**Success Response (204 No Content):**
```json
{}
```

## Tasks

### Create Task
`POST /api/tasks`

**Request:**
```json
{
  "title": "Implement API documentation",
  "description": "Create comprehensive API docs",
  "dueDate": "2025-01-31",
  "priority": "HIGH",
  "assigneeId": 123,
  "columnId": 456
}
```

**Success Response (201 Created):**
```json
{
  "id": 789,
  "title": "Implement API documentation",
  "status": "TODO",
  "createdAt": "2025-01-19T18:00:00Z"
}
```

### Update Task
`PUT /api/tasks/{id}`

**Request:**
```json
{
  "title": "Updated Task Title",
  "description": "Updated description"
}
```

**Success Response (200 OK):**
```json
{
  "id": 789,
  "title": "Updated Task Title",
  "description": "Updated description",
  "createdAt": "2025-01-19T18:00:00Z"
}
```

### Move Task
`PATCH /api/tasks/{taskId}/move/{newColumnId}`

**Success Response (200 OK):**
```json
{
  "id": 789,
  "title": "Implement API documentation",
  "columnId": 789,
  "createdAt": "2025-01-19T18:00:00Z"
}
```

### Delete Task
`DELETE /api/tasks/{id}`

**Success Response (204 No Content):**
```json
{}
```

## Users

### Get All Users
`GET /api/users`

**Success Response (200 OK):**
```json
[
  {
    "id": 123,
    "username": "user@example.com",
    "name": "John Doe",
    "role": "USER"
  }
]
```

### Get User by ID
`GET /api/users/{id}`

**Success Response (200 OK):**
```json
{
  "id": 123,
  "username": "user@example.com",
  "name": "John Doe",
  "role": "USER"
}
```

### Create User
`POST /api/users`

**Request:**
```json
{
  "username": "user@example.com",
  "name": "John Doe",
  "role": "USER"
}
```

**Success Response (201 Created):**
```json
{
  "id": 123,
  "username": "user@example.com",
  "name": "John Doe",
  "role": "USER"
}
```

### Update User
`PUT /api/users/{id}`

**Request:**
```json
{
  "username": "updated@example.com",
  "name": "John Smith"
}
```

**Success Response (200 OK):**
```json
{
  "id": 123,
  "username": "updated@example.com",
  "name": "John Smith",
  "role": "USER"
}
```

### Delete User
`DELETE /api/users/{id}`

**Success Response (204 No Content):**
```json
{}
```

## Notifications

### Get User Notification Preferences
`GET /api/notifications/preferences?userId=123`

**Success Response (200 OK):**
```json
{
  "globalNotificationsEnabled": true,
  "taskAssignedNotifications": true,
  "taskUpdatedNotifications": true,
  "taskMovedNotifications": true,
  "mentionNotifications": true
}
```

### Update Notification Preferences
`PUT /api/notifications/preferences?userId=123`

**Request:**
```json
{
  "globalNotificationsEnabled": false,
  "taskAssignedNotifications": true
}
```

**Success Response (200 OK):**
```json
{
  "globalNotificationsEnabled": false,
  "taskAssignedNotifications": true,
  "taskUpdatedNotifications": true,
  "taskMovedNotifications": true,
  "mentionNotifications": true
}
```

### Toggle Global Notifications
`PATCH /api/notifications/global?userId=123&enabled=false`

**Success Response (200 OK):**
```json
{
  "globalNotificationsEnabled": false,
  "taskAssignedNotifications": true,
  "taskUpdatedNotifications": true,
  "taskMovedNotifications": true,
  "mentionNotifications": true
}
```

## Files

### Get All Files
`GET /api/files`

**Success Response (200 OK):**
```json
[
  {
    "id": 222,
    "filename": "spec.pdf",
    "size": 123456,
    "uploadedAt": "2025-01-19T18:10:00Z"
  }
]
```

### Get File by ID
`GET /api/files/{id}`

**Success Response (200 OK):**
```json
{
  "id": 222,
  "filename": "spec.pdf",
  "size": 123456,
  "uploadedAt": "2025-01-19T18:10:00Z"
}
```

### Create File
`POST /api/files`

**Request:**
```json
{
  "filename": "spec.pdf",
  "size": 123456
}
```

**Success Response (201 Created):**
```json
{
  "id": 222,
  "filename": "spec.pdf",
  "size": 123456,
  "uploadedAt": "2025-01-19T18:10:00Z"
}
```

### Update File
`PUT /api/files/{id}`

**Request:**
```json
{
  "filename": "updated.pdf",
  "size": 654321
}
```

**Success Response (200 OK):**
```json
{
  "id": 222,
  "filename": "updated.pdf",
  "size": 654321,
  "uploadedAt": "2025-01-19T18:10:00Z"
}
```

### Delete File
`DELETE /api/files/{id}`

**Success Response (204 No Content):**
```json
{}
```

## Notes

### Get All Notes
`GET /api/notes`

**Success Response (200 OK):**
```json
[
  {
    "id": 111,
    "text": "This is a note",
    "createdAt": "2025-01-19T18:05:00Z"
  }
]
```

### Get Note by ID
`GET /api/notes/{id}`

**Success Response (200 OK):**
```json
{
  "id": 111,
  "text": "This is a note",
  "createdAt": "2025-01-19T18:05:00Z"
}
```

### Create Note
`POST /api/notes`

**Request:**
```json
{
  "text": "This is a note",
  "taskId": 789
}
```

**Success Response (201 Created):**
```json
{
  "id": 111,
  "text": "This is a note",
  "createdAt": "2025-01-19T18:05:00Z"
}
```

### Update Note
`PUT /api/notes/{id}`

**Request:**
```json
{
  "text": "Updated note text"
}
```

**Success Response (200 OK):**
```json
{
  "id": 111,
  "text": "Updated note text",
  "createdAt": "2025-01-19T18:05:00Z"
}
```

### Delete Note
`DELETE /api/notes/{id}`

**Success Response (204 No Content):**
```json
{}
```

## Telegram Integration

### Handle Web App Data
`POST /api/telegram/webapp`

**Request:**
```json
{
  "data": "example_data"
}
```

**Success Response (200 OK):**
```json
{
  "message": "WebApp data processed successfully"
}
```

### Get Task Share Link
`GET /api/telegram/task/{taskId}/share`

**Success Response (200 OK):**
```json
{
  "link": "https://t.me/share/url?url=task/789"
}
```

### Get Telegram Auth URL
`GET /api/telegram/auth/url`

**Success Response (200 OK):**
```json
{
  "url": "https://t.me/your_bot?start=123456"
}
```