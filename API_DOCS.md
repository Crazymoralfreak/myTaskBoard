# Task Board API Documentation

## Table of Contents
1. [Authentication](#authentication)
2. [Users](#users)
3. [Tasks](#tasks)
4. [Boards](#boards)
5. [Columns](#columns)
6. [Comments](#comments)
7. [Attachments](#attachments)
8. [Notifications](#notifications)
9. [Search](#search)
10. [Rate Limiting](#rate-limiting)
11. [Error Handling](#error-handling)

## Authentication

### Login
`POST /api/auth/login`

**Request:**
```json
{
  "username": "user@example.com",
  "password": "password123"
}
```

**Success Response (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 86400
}
```

**Error Responses:**
- `400 Bad Request`: Invalid request format
- `401 Unauthorized`: Invalid credentials
- `429 Too Many Requests`: Too many login attempts

## Users

### Get Current User
`GET /api/users/me`

**Success Response (200 OK):**
```json
{
  "id": 123,
  "username": "user@example.com",
  "name": "John Doe",
  "role": "USER",
  "notificationPreferences": {
    "globalNotificationsEnabled": true,
    "taskAssignedNotifications": true,
    "taskUpdatedNotifications": true,
    "taskMovedNotifications": true,
    "mentionNotifications": true
  }
}
```

### Update User Profile
`PUT /api/users/me`

**Request:**
```json
{
  "name": "John Smith",
  "email": "john.smith@example.com"
}
```

**Success Response (200 OK):**
```json
{
  "message": "Profile updated successfully"
}
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

### Get Task Details
`GET /api/tasks/{id}`

**Success Response (200 OK):**
```json
{
  "id": 789,
  "title": "Implement API documentation",
  "description": "Create comprehensive API docs",
  "status": "TODO",
  "priority": "HIGH",
  "dueDate": "2025-01-31",
  "createdAt": "2025-01-19T18:00:00Z",
  "updatedAt": "2025-01-19T18:00:00Z",
  "assignee": {
    "id": 123,
    "name": "John Doe"
  },
  "comments": [
    {
      "id": 111,
      "text": "Please add examples",
      "author": {
        "id": 123,
        "name": "John Doe"
      },
      "createdAt": "2025-01-19T18:05:00Z"
    }
  ],
  "attachments": [
    {
      "id": 222,
      "filename": "spec.pdf",
      "size": 123456,
      "uploadedAt": "2025-01-19T18:10:00Z"
    }
  ]
}
```

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

### Get Board Details
`GET /api/boards/{id}`

**Success Response (200 OK):**
```json
{
  "id": 123,
  "name": "Development Board",
  "description": "Board for tracking development tasks",
  "columns": [
    {
      "id": 456,
      "name": "TODO",
      "tasks": [
        {
          "id": 789,
          "title": "Implement API documentation",
          "status": "TODO"
        }
      ]
    }
  ]
}
```

## Columns

### Create Column
`POST /api/boards/{boardId}/columns`

**Request:**
```json
{
  "name": "In Progress",
  "order": 2
}
```

**Success Response (201 Created):**
```json
{
  "id": 789,
  "name": "In Progress",
  "order": 2
}
```

## Comments

### Add Comment to Task
`POST /api/tasks/{taskId}/comments`

**Request:**
```json
{
  "text": "Please add more details to the description"
}
```

**Success Response (201 Created):**
```json
{
  "id": 111,
  "text": "Please add more details to the description",
  "author": {
    "id": 123,
    "name": "John Doe"
  },
  "createdAt": "2025-01-19T18:05:00Z"
}
```

## Attachments

### Upload Attachment
`POST /api/tasks/{taskId}/attachments`

**Request:**
```bash
curl -X POST "https://api.taskboard.com/api/tasks/789/attachments" \
  -H "Authorization: Bearer {token}" \
  -F "file=@spec.pdf"
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

## Notifications

### Get Notification Preferences
`GET /api/notifications/preferences`

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

## Search

### Search Tasks
`GET /api/search/tasks?query=api&status=TODO`

**Success Response (200 OK):**
```json
{
  "results": [
    {
      "id": 789,
      "title": "Implement API documentation",
      "status": "TODO",
      "board": {
        "id": 123,
        "name": "Development Board"
      }
    }
  ],
  "total": 1
}
```

## Rate Limiting

- Default rate limits:
  - Authentication: 10 requests/minute
  - API endpoints: 100 requests/hour
- Response headers:
  - `X-RateLimit-Limit`: Total allowed requests
  - `X-RateLimit-Remaining`: Remaining requests
  - `X-RateLimit-Reset`: Time when limit resets (UTC timestamp)

## Error Handling

### Common Error Responses
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Missing or invalid authentication
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error

**Error Response Format:**
```json
{
  "timestamp": "2025-01-19T18:00:00Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Invalid request data",
  "path": "/api/tasks"
}
```

## Authentication

### Login
`POST /api/auth/login`

**Request:**
```json
{
  "username": "user@example.com",
  "password": "password123"
}
```

**Success Response (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 86400
}
```

**Error Responses:**
- `400 Bad Request`: Invalid request format
- `401 Unauthorized`: Invalid credentials
- `429 Too Many Requests`: Too many login attempts

## Users

### Get Current User
`GET /api/users/me`

**Success Response (200 OK):**
```json
{
  "id": 123,
  "username": "user@example.com",
  "name": "John Doe",
  "role": "USER",
  "notificationPreferences": {
    "globalNotificationsEnabled": true,
    "taskAssignedNotifications": true,
    "taskUpdatedNotifications": true,
    "taskMovedNotifications": true,
    "mentionNotifications": true
  }
}
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

## Boards

### Get Board
`GET /api/boards/{id}`

**Success Response (200 OK):**
```json
{
  "id": 123,
  "name": "Development Board",
  "columns": [
    {
      "id": 456,
      "name": "TODO",
      "tasks": [
        {
          "id": 789,
          "title": "Implement API documentation",
          "status": "TODO"
        }
      ]
    }
  ]
}
```

## Notifications

### Get Notification Preferences
`GET /api/notifications/preferences`

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

## Rate Limiting

- Default rate limits:
  - Authentication: 10 requests/minute
  - API endpoints: 100 requests/hour
- Response headers:
  - `X-RateLimit-Limit`: Total allowed requests
  - `X-RateLimit-Remaining`: Remaining requests
  - `X-RateLimit-Reset`: Time when limit resets (UTC timestamp)

## Error Handling

### Common Error Responses
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Missing or invalid authentication
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error

**Error Response Format:**
```json
{
  "timestamp": "2025-01-19T18:00:00Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Invalid request data",
  "path": "/api/tasks"
}
```