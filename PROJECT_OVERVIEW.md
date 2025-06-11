# myTaskBoard - Обзор проекта

## Общее описание
myTaskBoard - это современное веб-приложение для управления задачами и проектами по методологии канбан. Система позволяет создавать доски с задачами, настраивать статусы, типы задач и организовывать рабочий процесс с интеграцией Telegram и real-time уведомлениями.

## Технологический стек

### Backend
- **Основа**: Spring Boot 3.1.0, Java 17
- **Persistence**: Spring Data JPA, Hibernate
- **База данных**: PostgreSQL 15
- **Миграции**: Flyway
- **Безопасность**: Spring Security, JWT (io.jsonwebtoken 0.12.3)
- **API документация**: SpringDoc OpenAPI 2.2.0
- **Маппинг объектов**: MapStruct 1.5.5.Final
- **Интеграция с Telegram**: TelegramBots 6.9.7.1
- **WebSockets**: Spring WebSocket + Spring Security Messaging
- **Валидация**: Hibernate Validator 8.0.0.Final, Spring Validation
- **Сборка**: Maven

### Frontend
- **Основа**: React 18, TypeScript, Vite 4.4.9
- **UI библиотеки**: 
  - Material UI (@mui/material 5.14.5, @mui/icons-material, @mui/x-date-pickers)
  - Ant Design 5.24.1
- **Управление формами**: react-hook-form 7.45.4
- **Работа с датами**: date-fns 2.30.0
- **Drag-and-Drop**: react-beautiful-dnd 13.1.1
- **Уведомления**: 
  - notistack 3.0.2
  - react-hot-toast 2.5.2
  - react-toastify 11.0.5
- **Форматирование текста**: 
  - react-quill 2.0.0
  - react-markdown 9.0.3
- **Интеграция с Telegram**: @twa-dev/sdk 6.9.1
- **Работа с изображениями**: 
  - react-image-crop 11.0.7
  - react-easy-crop 5.4.1
- **WebSockets**: 
  - @stomp/stompjs 7.1.1
  - sockjs-client 1.6.1
- **HTTP клиент**: axios 1.4.0
- **Навигация**: react-router-dom 6.15.0
- **Горячие клавиши**: react-hotkeys-hook 4.6.1
- **Слайдеры**: swiper 11.2.6
- **Утилиты**: 
  - lodash 4.17.21
  - jwt-decode 4.0.0
  - diff 7.0.0

### Инфраструктура
- **Контейнеризация**: Docker, Docker Compose
- **Веб-сервер**: Nginx (для frontend)
- **База данных**: PostgreSQL 15-alpine
- **JWT**: Для аутентификации и авторизации
- **WebSockets**: Для real-time обновлений

## Структура проекта

### Корневая директория
```
myTaskBoard/
├── backend/                # Spring Boot backend
├── frontend/              # React frontend  
├── docker-compose.yml     # Orchestration
├── .env                   # Переменные окружения
├── PROJECT_OVERVIEW.md    # Этот файл
├── README.md             # Документация развертывания
├── problems.md           # Известные проблемы
├── featureGoal.md        # Планы развития
└── API_DOCS.md           # API документация
```

### Backend (/backend)
```
backend/
├── src/main/
│   ├── java/com/yourapp/
│   │   ├── config/        # Конфигурации (Security, WebSocket, Telegram)
│   │   ├── controller/    # REST контроллеры
│   │   ├── dto/           # Data Transfer Objects
│   │   ├── exception/     # Обработка исключений
│   │   ├── mapper/        # MapStruct маппинг между DTO и моделями
│   │   ├── model/         # JPA сущности базы данных
│   │   ├── repository/    # Spring Data JPA репозитории
│   │   ├── security/      # JWT и Spring Security настройки
│   │   ├── service/       # Бизнес-логика
│   │   ├── specification/ # JPA Specification для сложных запросов
│   │   ├── util/          # Вспомогательные утилиты
│   │   ├── validation/    # Пользовательские валидаторы
│   │   └── TaskBoardApplication.java # Точка входа
│   └── resources/         # Конфигурационные файлы, миграции Flyway
├── pom.xml               # Maven зависимости
├── Dockerfile           # Docker образ для backend
└── lombok.config        # Настройки Lombok
```

### Frontend (/frontend)
```
frontend/
├── public/               # Статические файлы
├── src/
│   ├── api/              # Конфигурация API (axios)
│   ├── components/       # React компоненты
│   │   ├── auth/         # Компоненты аутентификации
│   │   ├── Board/        # Компоненты досок и канбан
│   │   ├── layout/       # Компоненты общего макета
│   │   ├── notifications/ # Система уведомлений
│   │   ├── shared/       # Переиспользуемые UI компоненты
│   │   ├── task/         # Компоненты задач (modal, comments, attachments)
│   │   ├── user/         # Управление пользователями
│   │   └── UserSearch/   # Поиск пользователей
│   ├── config/           # Конфигурационные файлы
│   ├── context/          # React Context API
│   ├── contexts/         # Специфические контексты (роли, темы)
│   ├── hooks/            # Пользовательские React хуки
│   ├── pages/            # Компоненты страниц
│   ├── services/         # Бизнес-логика frontend
│   ├── store/            # Управление состоянием
│   ├── theme/            # Material UI темы (светлая/темная)
│   ├── types/            # TypeScript типы и интерфейсы
│   ├── utils/            # Вспомогательные функции
│   ├── App.tsx           # Корневой компонент
│   ├── main.tsx          # Точка входа React
│   └── index.css         # Глобальные стили
├── package.json          # NPM зависимости
├── vite.config.ts        # Конфигурация Vite
├── tsconfig.json         # TypeScript конфигурация
├── Dockerfile           # Docker образ для frontend
├── nginx.conf           # Конфигурация Nginx
└── .env                 # Переменные окружения frontend
```

## Ключевые компоненты и функциональность

### Доски (Boards)
- Создание, редактирование, удаление досок
- Настройка колонок (BoardStatus) для каждой доски
- Настройка типов задач (TaskType) для доски
- Drag-and-drop интерфейс для перемещения задач между статусами
- Управление участниками доски

### Задачи (Tasks)
- CRUD операции для задач с полной историей изменений
- Поддержка приоритетов, статусов, типов
- Система вложений (TaskAttachments) с поддержкой множественной загрузки
- Комментарии к задачам с возможностью упоминаний (@username)
- Подзадачи (Subtasks)
- Шаблоны задач для быстрого создания
- Назначение ответственных и наблюдателей

### Ключевые компоненты задач
- **TaskModal** - универсальный компонент для создания/редактирования/просмотра задач
- **TaskComments** - система комментариев с поддержкой упоминаний
- **TaskAttachments** - управление вложениями с drag-and-drop и превью
- **TaskHistory** - полная история изменений задачи
- **SubtaskList** - управление подзадачами
- **TaskTemplateList** - работа с шаблонами задач

### Пользователи и аутентификация
- JWT-based аутентификация
- Роли пользователей (ADMIN, USER, MANAGER)
- Настройки профиля с загрузкой аватара
- Интеграция с Telegram для аутентификации
- Настройки уведомлений по каналам (веб, email, telegram)
- Настройки языка и часового пояса

### Система уведомлений
- Real-time уведомления через WebSockets (@stomp/stompjs)
- 17 типов уведомлений для различных событий
- Поддержка множественных каналов (веб, email, telegram)
- Счетчик непрочитанных уведомлений
- Настройки предпочтений уведомлений для каждого пользователя

### Интеграция с Telegram
- Telegram Bot API для уведомлений
- Telegram Web App SDK для аутентификации
- Автоматические уведомления в Telegram при важных событиях

## Ключевые типы данных

### Task
```typescript
interface Task {
  id: number;
  title: string;
  description: string;
  priority: TaskPriority; // 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE'
  startDate?: string;
  endDate?: string;
  type?: TaskType;
  customStatus?: BoardStatus;
  tags?: string[];
  commentCount?: number;
  attachmentCount?: number;
  createdBy?: User;
  assignedTo?: User[];
  watchers?: User[];
  subtasks?: Subtask[];
  history?: TaskHistory[];
}
```

### BoardStatus
```typescript
interface BoardStatus {
  id: number;
  name: string;
  color: string;
  boardId: number;
  order: number;
  isDefault?: boolean;
}
```

### User
```typescript
interface User {
  id: number;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  role: UserRole; // 'ADMIN' | 'USER' | 'MANAGER'
  telegramId?: string;
  lastActive?: string;
  settings?: UserSettings;
}
```

### Notification
```typescript
interface Notification {
  id: number;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  recipientId: number;
  relatedEntityId?: number;
  relatedEntityType?: string;
}
```

## Состояние приложения
- Управление состоянием через React Context API
- API запросы через axios с настроенными interceptors
- WebSocket соединения для real-time обновлений
- Локальное хранение настроек пользователя и JWT токенов
- Кеширование данных на уровне компонентов

## Структура базы данных

Основные сущности:
- **Users** - пользователи системы
- **UserSettings** - настройки пользователей (тема, язык, часовой пояс, уведомления)
- **Boards** - доски проектов
- **BoardMembers** - участники досок с ролями
- **BoardStatuses** - статусы (колонки) на досках
- **Tasks** - задачи
- **TaskTypes** - типы задач для досок
- **TaskAssignments** - назначения задач
- **Comments** - комментарии к задачам
- **Attachments** - вложения к задачам
- **TaskHistory** - история изменений задач
- **Subtasks** - подзадачи
- **TaskTemplates** - шаблоны задач
- **Notifications** - уведомления пользователей
- **NotificationSettings** - настройки уведомлений

## Особенности развертывания
- Docker Compose для оркестрации сервисов
- Поддержка переменных окружения через .env файл
- Nginx для статической раздачи frontend
- PostgreSQL как основная база данных
- Flyway для миграций базы данных
- Health checks для всех сервисов
- Persistent volumes для данных

## Дополнительные особенности
- **Темы**: Поддержка светлой и темной темы с автоматическим переключением
- **Адаптивность**: Полностью адаптивный интерфейс для мобильных устройств
- **Горячие клавиши**: Быстрые действия через клавиатуру
- **Drag-and-Drop**: Интуитивное перемещение задач между статусами
- **Превью файлов**: Встроенный просмотр изображений, видео и текстовых файлов
- **Автосохранение**: Настройки сохраняются автоматически без кнопки "Сохранить"
- **Множественная загрузка**: Поддержка одновременной загрузки нескольких файлов

## Интеграции и API
- REST API с полной OpenAPI документацией
- WebSocket API для real-time обновлений
- Telegram Bot API для уведомлений и аутентификации
- Поддержка файловых операций (загрузка, скачивание, превью)

## Безопасность
- JWT токены с настраиваемым временем жизни
- Роли и права доступа на уровне приложения
- Валидация всех входных данных на backend
- Защита от CSRF атак
- Санитизация пользовательского ввода
- Безопасное хранение паролей

## Интеграции
- Интеграция с Telegram Bot API
- Загрузка файлов и изображений
- Email уведомления (опционально)
- Экспорт/импорт данных

## Дополнительная информация
Проект находится в активной разработке. Основная цель - создание удобного инструмента для управления задачами в команде с интуитивно понятным интерфейсом и гибкими настройками. 