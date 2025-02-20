# MyTaskBoard - Система управления задачами с интеграцией Telegram

## Описание проекта

MyTaskBoard - это современная система управления задачами, которая сочетает в себе функциональность канбан-доски с интеграцией Telegram. Система позволяет эффективно организовывать и отслеживать задачи, обеспечивая удобное взаимодействие через веб-интерфейс и Telegram.

### Основные возможности

- **Управление досками:**
  - Создание и редактирование досок
  - Настройка колонок
  - Архивация досок
  
- **Управление задачами:**
  - Создание и редактирование задач
  - Drag-and-drop перемещение между колонками
  - Прикрепление файлов и комментариев
  - Отслеживание истории изменений
  
- **Интеграция с Telegram:**
  - Аутентификация через Telegram
  - Уведомления о важных событиях
  - Управление задачами через бота
  
- **Real-time обновления:**
  - WebSocket для мгновенной синхронизации
  - Уведомления в реальном времени

## Технический стек

### Бэкенд
- Java 17
- Spring Boot 3.x
- Spring Security
- Spring Data JPA
- PostgreSQL
- WebSocket
- Telegram Bot API

### Фронтенд
- React 18
- TypeScript
- Vite
- Material UI
- Redux Toolkit
- React Beautiful DnD
- Telegram Web App SDK

## Требования для развертывания

- Docker и Docker Compose
- Git
- Telegram Bot Token (получить у @BotFather)
- Домен с SSL-сертификатом (для Telegram Web App)

## Развертывание

### 1. Клонирование репозитория

```bash
git clone https://github.com/your-username/mytaskboard.git
cd mytaskboard
```

### 2. Настройка переменных окружения

Создайте файл `.env` в корневой директории:

```env
# Backend
POSTGRES_USER=mytaskboard
POSTGRES_PASSWORD=your_secure_password
POSTGRES_DB=mytaskboard_db
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_BOT_USERNAME=your_bot_username

# Frontend
VITE_API_URL=https://your-domain.com/api
VITE_BOT_NAME=your_bot_username
```

### 3. Настройка SSL

Поместите ваши SSL-сертификаты в директорию `./nginx/certs/`:
- `server.crt` - сертификат
- `server.key` - приватный ключ

### 4. Запуск с помощью Docker Compose

```bash
# Сборка и запуск контейнеров
docker-compose up -d --build

# Проверка логов
docker-compose logs -f
```

### 5. Настройка Telegram бота

1. Получите токен у @BotFather
2. Настройте webhook:
```bash
curl -F "url=https://your-domain.com/api/telegram/webhook" \
     https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook
```
3. Добавьте веб-приложение в настройках бота через @BotFather

## Структура проекта

```
mytaskboard/
├── backend/                # Java Spring Boot backend
│   ├── src/               # Исходный код
│   ├── Dockerfile        # Dockerfile для бэкенда
│   └── pom.xml           # Maven конфигурация
├── frontend/              # React frontend
│   ├── src/              # Исходный код
│   ├── Dockerfile       # Dockerfile для фронтенда
│   └── package.json     # NPM конфигурация
├── nginx/                 # Nginx конфигурация
│   ├── certs/           # SSL сертификаты
│   └── nginx.conf       # Nginx конфигурация
├── docker-compose.yml    # Docker Compose конфигурация
└── .env                  # Переменные окружения
```

## Мониторинг и обслуживание

### Просмотр логов

```bash
# Все сервисы
docker-compose logs -f

# Конкретный сервис
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Обновление приложения

```bash
# Получение последних изменений
git pull

# Пересборка и перезапуск контейнеров
docker-compose up -d --build
```

### Резервное копирование базы данных

```bash
# Создание бэкапа
docker-compose exec db pg_dump -U mytaskboard mytaskboard_db > backup.sql

# Восстановление из бэкапа
cat backup.sql | docker-compose exec -T db psql -U mytaskboard mytaskboard_db
```

## Безопасность

- Все API-эндпоинты защищены аутентификацией
- Поддержка HTTPS
- Безопасное хранение паролей
- Валидация входных данных
- Rate limiting для API

## Поддержка

При возникновении проблем:
1. Проверьте логи контейнеров
2. Убедитесь в правильности настроек окружения
3. Создайте issue в репозитории проекта

## Лицензия

MIT License. См. файл LICENSE для подробностей.