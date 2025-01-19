# Task Board Application

## Backend Functionality

The backend provides the following core features:

### Kanban Board Management
- Create, update and delete Kanban columns
- Drag-and-drop task movement between columns
- Column ordering and customization

### Task Management
- Create tasks with title, description, due date, priority and labels
- Assign tasks to users
- Task filtering by status, priority and assignee
- Task history tracking (who changed what and when)

### Notifications
- Real-time updates via WebSocket
- Telegram bot integration for task updates
- Email notifications for important changes

### Security
- JWT-based authentication
- Role-based access control
- Password encryption
- Rate limiting

### API Documentation
- Swagger UI at `/swagger-ui.html`
- OpenAPI 3.0 specification at `/v3/api-docs`

## Getting Started with Docker

### Prerequisites
- Docker 20.10+
- Docker Compose 2.0+
- Java 17+

### Running the Application

1. Clone the repository:
```bash
git clone https://github.com/Crazymoralfreak/myTaskBoard.git
cd myTaskBoard
```

2. Create environment file:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Build and start containers:
```bash
docker-compose up -d
```

4. Access the application:
- API: http://localhost:8080
- Database: localhost:5432
- Swagger UI: http://localhost:8080/swagger-ui.html

5. Check logs:
```bash
docker-compose logs -f
```

6. Stop the application:
```bash
docker-compose down
```

### Environment Variables

| Variable                     | Description                          | Default Value          |
|------------------------------|--------------------------------------|------------------------|
| `SPRING_DATASOURCE_URL`       | Database connection URL              | jdbc:postgresql://db:5432/taskboard |
| `SPRING_DATASOURCE_USERNAME`  | Database username                    | taskboard              |
| `SPRING_DATASOURCE_PASSWORD`  | Database password                    | taskboard              |
| `TELEGRAM_BOT_TOKEN`          | Telegram bot token                   |                        |
| `TELEGRAM_BOT_USERNAME`       | Telegram bot username                |                        |
| `JWT_SECRET`                  | JWT signing key                      | changeme               |
| `JWT_EXPIRATION_MS`           | JWT expiration time in milliseconds  | 86400000 (24 hours)    |

## Development

### Running Tests
```bash
./mvnw test
```

### Building the Application
```bash
./mvnw clean package
```

### Running Locally
```bash
./mvnw spring-boot:run
```
## Notification Preferences API

### Get User Notification Preferences
`GET /api/notifications/preferences?userId={userId}`

**Rate Limit:** 100 requests per hour per user

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

**Error Responses:**
- `401 Unauthorized`: Invalid or missing authentication token
- `403 Forbidden`: User not authorized to access these preferences
- `404 Not Found`: User not found

**Example Request:**
```bash
curl -X GET "https://api.taskboard.com/api/notifications/preferences?userId=123" \
  -H "Authorization: Bearer {token}"
```

### Update Notification Preferences
`PUT /api/notifications/preferences?userId={userId}`

**Rate Limit:** 10 requests per minute per user

**Request Body:**
```json
{
  "globalNotificationsEnabled": true,
  "taskAssignedNotifications": true,
  "taskUpdatedNotifications": true,
  "taskMovedNotifications": true,
  "mentionNotifications": true
}
```

**Success Response (200 OK):**
```json
{
  "message": "Preferences updated successfully",
  "preferences": {
    "globalNotificationsEnabled": true,
    "taskAssignedNotifications": true,
    "taskUpdatedNotifications": true,
    "taskMovedNotifications": true,
    "mentionNotifications": true
  }
}
```

**Error Responses:**
- `400 Bad Request`: Invalid request body
- `401 Unauthorized`: Invalid or missing authentication token
- `403 Forbidden`: User not authorized to update these preferences
- `404 Not Found`: User not found

**Example Request:**
```bash
curl -X PUT "https://api.taskboard.com/api/notifications/preferences?userId=123" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "globalNotificationsEnabled": true,
    "taskAssignedNotifications": true,
    "taskUpdatedNotifications": true,
    "taskMovedNotifications": true,
    "mentionNotifications": true
  }'
```

### Toggle Global Notifications
`PATCH /api/notifications/global?userId={userId}&enabled={true|false}`

**Rate Limit:** 10 requests per minute per user

**Success Response (200 OK):**
```json
{
  "message": "Global notifications updated successfully",
  "preferences": {
    "globalNotificationsEnabled": false,
    "taskAssignedNotifications": true,
    "taskUpdatedNotifications": true,
    "taskMovedNotifications": true,
    "mentionNotifications": true
  }
}
```

**Error Responses:**
- `400 Bad Request`: Invalid enabled parameter
- `401 Unauthorized`: Invalid or missing authentication token
- `403 Forbidden`: User not authorized to update these preferences
- `404 Not Found`: User not found

**Example Request:**
```bash
curl -X PATCH "https://api.taskboard.com/api/notifications/global?userId=123&enabled=false" \
  -H "Authorization: Bearer {token}"
```

### Rate Limiting
- All notification endpoints are rate limited
- Exceeding limits will result in `429 Too Many Requests` response
- Rate limit headers are included in all responses:
  - `X-RateLimit-Limit`: Total allowed requests
  - `X-RateLimit-Remaining`: Remaining requests
  - `X-RateLimit-Reset`: Time when limit resets (UTC timestamp)