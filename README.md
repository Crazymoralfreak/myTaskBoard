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

**Response:**
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
`PUT /api/notifications/preferences?userId={userId}`

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

### Toggle Global Notifications
`PATCH /api/notifications/global?userId={userId}&enabled={true|false}`

**Response:**
```json
{
  "globalNotificationsEnabled": false,
  "taskAssignedNotifications": true,
  "taskUpdatedNotifications": true,
  "taskMovedNotifications": true,
  "mentionNotifications": true
}
```