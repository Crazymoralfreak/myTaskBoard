# MyTaskBoard - Система управления задачами с интеграцией Telegram

## Описание проекта

MyTaskBoard - это современная система управления задачами по методологии канбан с интеграцией Telegram. Система обеспечивает эффективную организацию проектов через веб-интерфейс с поддержкой real-time уведомлений и интуитивным drag-and-drop интерфейсом.

### Основные возможности

- **Управление досками:**
  - Создание и редактирование досок с настраиваемыми колонками
  - Настройка статусов и типов задач для каждой доски
  - Управление участниками досок с различными ролями
  
- **Управление задачами:**
  - Создание и редактирование задач с расширенными возможностями
  - Drag-and-drop перемещение между колонками
  - Система приоритетов, тегов и назначений
  - Поддержка подзадач и шаблонов задач
  - Прикрепление файлов с drag-and-drop загрузкой
  - Система комментариев с возможностью упоминаний (@username)
  - Полная история изменений
  
- **Интеграция с Telegram:**
  - Аутентификация через Telegram Web App
  - Автоматические уведомления о важных событиях
  - Настройка предпочтений уведомлений по каналам
  
- **Real-time функциональность:**
  - WebSocket соединения для мгновенной синхронизации
  - Счетчик непрочитанных уведомлений
  - Автоматическое обновление данных

- **Пользовательский опыт:**
  - Поддержка светлой и темной тем
  - Адаптивный дизайн для мобильных устройств
  - Горячие клавиши для быстрого доступа
  - Автосохранение настроек
  - Превью файлов (изображения, видео, текст)

## Технический стек

### Бэкенд
- Java 17 + Spring Boot 3.1.0
- Spring Security + JWT (io.jsonwebtoken 0.12.3)
- Spring Data JPA + Hibernate
- PostgreSQL 15
- Flyway для миграций
- MapStruct 1.5.5.Final для маппинга
- SpringDoc OpenAPI 2.2.0 для документации
- Telegram Bot API (TelegramBots 6.9.7.1)
- WebSocket + STOMP для real-time

### Фронтенд
- React 18 + TypeScript + Vite 4.4.9
- Material UI 5.14.5 + Ant Design 5.24.1
- React Hook Form 7.45.4 для работы с формами
- React Beautiful DnD 13.1.1 для drag-and-drop
- STOMP.js 7.1.1 для WebSocket
- Axios 1.4.0 для HTTP запросов
- React Router DOM 6.15.0 для навигации
- Множественные библиотеки уведомлений (notistack, react-hot-toast)
- Telegram Web App SDK 6.9.1

### Инфраструктура
- Docker + Docker Compose
- Nginx (статическая раздача frontend)
- PostgreSQL 15-alpine
- Persistent volumes для данных

## Требования для развертывания

- Docker и Docker Compose
- Git
- Telegram Bot Token (получить у @BotFather) - опционально
- Минимум 2GB RAM
- Минимум 5GB свободного места

## Развертывание

### 1. Клонирование репозитория

```bash
git clone https://github.com/your-username/mytaskboard.git
cd mytaskboard
```

### 2. Настройка переменных окружения

Создайте или отредактируйте файл `.env` в корневой директории:

```env
# Application Configuration
APP_PORT=8081
FRONTEND_PORT=5173
SERVER_PORT=8081
SPRING_PROFILES_ACTIVE=prod
JAVA_OPTS=-Xmx512m -Xms256m

# API URL Configuration  
VITE_API_URL=http://localhost:8081

# Database Configuration
DB_HOST=db
DB_PORT=5432
DB_NAME=taskboard
DB_USER=postgres
DB_PASSWORD=postgres

# Spring DataSource Configuration
SPRING_DATASOURCE_URL=jdbc:postgresql://${DB_HOST}:${DB_PORT}/${DB_NAME}
SPRING_DATASOURCE_USERNAME=${DB_USER}
SPRING_DATASOURCE_PASSWORD=${DB_PASSWORD}
SPRING_JPA_HIBERNATE_DDL_AUTO=validate
SPRING_JPA_SHOW_SQL=true

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_change_this_in_production
JWT_EXPIRATION=86400000

# Telegram Configuration (опционально)
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_BOT_USERNAME=your_bot_name
TELEGRAM_WEBAPP_URL=http://localhost:5173
TELEGRAM_AUTH_REDIRECT_URL=http://localhost:5173/auth/telegram/callback

# Flyway Configuration
SPRING_FLYWAY_ENABLED=true
SPRING_FLYWAY_BASELINE_ON_MIGRATE=true
SPRING_FLYWAY_VALIDATE_ON_MIGRATE=true
SPRING_FLYWAY_CLEAN_ON_VALIDATION_ERROR=true

# Health Check Configuration
HEALTHCHECK_INTERVAL=30s
HEALTHCHECK_TIMEOUT=10s
HEALTHCHECK_RETRIES=5

# Logging Configuration
LOGGING_LEVEL_ORG_SPRINGFRAMEWORK=INFO
LOGGING_LEVEL_COM_YOURAPP=WARN
```

⚠️ **Важно:** Обязательно смените `JWT_SECRET` на собственный сложный ключ в продакшене!

### 3. Запуск с помощью Docker Compose

```bash
# Сборка и запуск всех сервисов
docker-compose up -d --build

# Проверка статуса сервисов
docker-compose ps

# Просмотр логов
docker-compose logs -f
```

### 4. Доступ к приложению

- **Веб-приложение**: http://localhost:5173
- **API**: http://localhost:8081
- **API документация**: http://localhost:8081/swagger-ui.html
- **База данных**: localhost:5432 (логин: postgres, пароль: postgres)

### 5. Настройка Telegram (опционально)

1. Создайте бота у @BotFather и получите токен
2. Обновите переменные `TELEGRAM_BOT_TOKEN` и `TELEGRAM_BOT_USERNAME` в .env
3. Перезапустите контейнеры: `docker-compose restart`

## Структура проекта

```
mytaskboard/
├── backend/               # Spring Boot backend
│   ├── src/main/java/com/yourapp/
│   │   ├── config/        # Конфигурации
│   │   ├── controller/    # REST контроллеры
│   │   ├── dto/           # Data Transfer Objects
│   │   ├── model/         # JPA сущности
│   │   ├── repository/    # Spring Data репозитории
│   │   ├── service/       # Бизнес-логика
│   │   ├── security/      # JWT и Security настройки
│   │   └── ...
│   ├── pom.xml           # Maven dependencies
│   └── Dockerfile       # Docker образ backend
├── frontend/              # React frontend
│   ├── src/
│   │   ├── components/   # React компоненты
│   │   ├── pages/        # Страницы приложения
│   │   ├── services/     # API сервисы
│   │   ├── hooks/        # React хуки
│   │   ├── types/        # TypeScript типы
│   │   └── ...
│   ├── package.json     # NPM dependencies
│   ├── Dockerfile      # Docker образ frontend
│   └── nginx.conf      # Nginx конфигурация
├── docker-compose.yml   # Оркестрация сервисов
├── .env                # Переменные окружения
└── README.md           # Этот файл
```

## Мониторинг и обслуживание

### Просмотр логов

```bash
# Все сервисы
docker-compose logs -f

# Конкретный сервис
docker-compose logs -f app        # Backend
docker-compose logs -f frontend  # Frontend  
docker-compose logs -f db        # База данных
```

### Health checks

```bash
# Проверка состояния backend
curl http://localhost:8081/api/health

# Статус всех контейнеров
docker-compose ps
```

### Обновление приложения

```bash
# Получение последних изменений
git pull

# Пересборка и перезапуск
docker-compose up -d --build

# Просмотр логов после обновления
docker-compose logs -f
```

### Резервное копирование базы данных

```bash
# Создание бэкапа
docker-compose exec db pg_dump -U postgres taskboard > backup_$(date +%Y%m%d_%H%M%S).sql

# Восстановление из бэкапа
cat backup_20231201_120000.sql | docker-compose exec -T db psql -U postgres taskboard
```

### Очистка Docker ресурсов

```bash
# Остановка и удаление контейнеров
docker-compose down

# Удаление неиспользуемых образов
docker image prune -f

# Полная очистка (осторожно - удалит все данные!)
docker-compose down -v
docker system prune -a -f
```

## Основные функции

### Доски и задачи
- Канбан-доски с настраиваемыми колонками
- Drag-and-drop перемещение задач
- Приоритеты, типы задач, теги
- Назначение ответственных и наблюдателей
- Подзадачи и шаблоны

### Файлы и вложения
- Drag-and-drop загрузка множественных файлов
- Превью изображений, видео и текстовых файлов
- Безопасное скачивание файлов

### Уведомления
- 17 типов уведомлений для различных событий
- Real-time уведомления через WebSocket
- Настраиваемые каналы (веб, email, telegram)
- Счетчик непрочитанных уведомлений

### Пользователи
- Роли: Администратор, Менеджер, Пользователь
- Настройки профиля с загрузкой аватара
- Языковые и временные настройки
- Интеграция с Telegram

## Безопасность

- JWT токены для аутентификации
- Роли и права доступа
- Валидация всех входных данных
- Безопасное хранение паролей
- CORS настройки
- Health checks и мониторинг

## Производительность

- Оптимизированные SQL запросы с JPA Specification
- Кеширование на уровне приложения
- Ленивая загрузка данных
- Сжатие статических ресурсов в Nginx
- Connection pooling для базы данных


## Поддержка

При возникновении проблем:
1. Проверьте логи контейнеров: `docker-compose logs -f`
2. Убедитесь в правильности настроек в `.env`
3. Проверьте доступность портов 5173 и 8081
4. Создайте issue в репозитории проекта

## API документация

Полная документация API доступна по адресу: `http://localhost:8081/swagger-ui.html`

Дополнительная документация API находится в файле `API_DOCS.md`.

## Лицензия

MIT License. См. файл LICENSE для подробностей.