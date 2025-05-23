# myTaskBoard - Обзор проекта

## Общее описание
myTaskBoard - это современное веб-приложение для управления задачами и проектами по методологии канбан. Система позволяет создавать доски с задачами, настраивать статусы, типы задач и организовывать рабочий процесс.

## Технологический стек
### Frontend
- **Основа**: React, TypeScript, Vite
- **UI библиотеки**: Material UI, Ant Design
- **Управление формами**: react-hook-form
- **Работа с датами**: date-fns, @mui/x-date-pickers
- **Drag-and-Drop**: react-beautiful-dnd
- **Уведомления**: react-toastify, notistack, react-hot-toast
- **Форматирование текста**: react-quill, react-markdown
- **Интеграция с Telegram**: @twa-dev/sdk
- **Работа с изображениями**: react-image-crop, react-easy-crop

### Backend
- **Основа**: Spring Boot 3.1.0, Java 17
- **Persistence**: Spring Data JPA, Hibernate
- **Безопасность**: Spring Security, JWT
- **Миграции базы данных**: Flyway
- **API документация**: SpringDoc OpenAPI
- **Маппинг объектов**: MapStruct
- **Интеграция с Telegram**: TelegramBots
- **WebSockets**: Spring WebSocket
- **Валидация**: Hibernate Validator, Spring Validation

### База данных
- PostgreSQL

### Дополнительные технологии
- Docker для контейнеризации
- JWT для аутентификации
- WebSockets для real-time уведомлений

## Структура проекта

### Frontend (/frontend)
```
frontend/
├── public/           # Статические файлы
├── src/
│   ├── api/          # Конфигурация API и запросы
│   ├── components/   # React компоненты
│   │   ├── auth/     # Компоненты аутентификации
│   │   ├── Board/    # Компоненты досок
│   │   ├── layout/   # Компоненты для общего макета
│   │   ├── notifications/ # Компоненты уведомлений
│   │   ├── shared/   # Переиспользуемые компоненты
│   │   ├── task/     # Компоненты для работы с задачами
│   │   └── user/     # Компоненты управления пользователями
│   ├── context/      # Context API для общего состояния
│   ├── contexts/     # Специфические контексты (роли)
│   ├── hooks/        # Пользовательские хуки
│   ├── pages/        # Страницы приложения
│   ├── services/     # Сервисы для бизнес-логики
│   ├── store/        # Управление состоянием
│   ├── theme/        # Настройки темы
│   ├── types/        # TypeScript типы/интерфейсы
│   ├── utils/        # Вспомогательные функции
│   ├── App.tsx       # Корневой компонент
│   └── main.tsx      # Точка входа
```

### Backend (/backend)
```
backend/
├── src/main/
│   ├── java/
│   │   └── com/yourapp/
│   │       ├── config/        # Конфигурации
│   │       ├── controller/    # REST контроллеры
│   │       ├── dto/           # Data Transfer Objects
│   │       ├── exception/     # Обработка исключений
│   │       ├── mapper/        # Маппинг между DTO и моделями
│   │       ├── model/         # Сущности базы данных
│   │       ├── repository/    # JPA репозитории
│   │       ├── security/      # Настройки безопасности
│   │       ├── service/       # Бизнес-логика
│   │       ├── specification/ # Спецификации для запросов
│   │       ├── validation/    # Валидаторы
│   │       └── TaskBoardApplication.java # Точка входа
│   └── resources/             # Конфигурационные файлы
```

## Ключевые компоненты и функциональность

### Доски (Boards)
- Создание, редактирование, удаление досок
- Настройка колонок (статусов) для каждой доски
- Настройка типов задач для доски
- Настройка прав доступа
- Drag-and-drop интерфейс для перемещения задач

### Задачи (Tasks)
- CRUD операции для задач
- Поддержка приоритетов, статусов, типов
- Прикрепление файлов к задачам
- Комментарии к задачам
- История изменений задачи
- Подзадачи
- Шаблоны задач

### Компоненты задач
- **TaskModal** - основной компонент для создания/редактирования/просмотра задачи
- **TaskTemplateList** - компонент для работы с шаблонами задач
- **SubtaskList** - управление подзадачами
- **TaskComments** - система комментариев
- **TaskHistory** - история изменений
- **TaskAttachments** - прикрепленные файлы

### Пользователи и аутентификация
- Регистрация и вход
- Роли пользователей и права доступа
- Настройка профиля
- Загрузка аватара с возможностью обрезки
- Интеграция с Telegram

### Уведомления
- Real-time уведомления через WebSockets
- Email уведомления (опционально)
- Уведомления в Telegram

## Дополнительные особенности
- Поддержка тем (светлая/темная)
- Адаптивный интерфейс для мобильных устройств
- Горячие клавиши для быстрого доступа
- История действий для аудита
- Экспорт/импорт данных

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

### TaskType
```typescript
interface TaskType {
  id: number;
  name: string;
  icon?: string;
  color?: string;
  boardId: number;
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
  role: UserRole;
  telegramId?: string;
  lastActive?: string;
}
```

## Состояние приложения
- Управление состоянием через Context API
- API запросы через axios и сервисные слои
- Кеширование часто используемых данных
- Локальное хранение настроек пользователя
- WebSocket для получения обновлений в реальном времени

## Структура базы данных

Основные сущности:
- Users (пользователи)
- Boards (доски)
- BoardStatuses (статусы на досках)
- Tasks (задачи)
- TaskTypes (типы задач)
- Comments (комментарии)
- Attachments (вложения)
- TaskHistory (история задач)
- Subtasks (подзадачи)
- UserSettings (настройки пользователей)
- Notifications (уведомления)

## Интеграции
- Интеграция с Telegram Bot API
- Загрузка файлов и изображений
- Email уведомления (опционально)
- Экспорт/импорт данных

## Дополнительная информация
Проект находится в активной разработке. Основная цель - создание удобного инструмента для управления задачами в команде с интуитивно понятным интерфейсом и гибкими настройками. 