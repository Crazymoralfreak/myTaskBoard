/**
 * Утилиты для отслеживания ошибок в production
 */

// В реальном проекте здесь импортировался бы Sentry
// import * as Sentry from '@sentry/react';

interface ContextData {
  [key: string]: any;
}

/**
 * Инициализация системы отслеживания ошибок
 */
export const initErrorReporting = (): void => {
  if (process.env.NODE_ENV === 'production') {
    // В реальном проекте здесь бы инициализировался Sentry
    console.log('Error reporting initialized in production mode');
    
    /* Пример инициализации Sentry
    Sentry.init({
      dsn: process.env.REACT_APP_SENTRY_DSN,
      environment: process.env.NODE_ENV,
      release: process.env.REACT_APP_VERSION || 'unknown',
      tracesSampleRate: 0.1,
    });
    */
  }
};

/**
 * Отправка ошибки в систему мониторинга с дополнительными данными
 */
export const reportError = (error: Error, contextData?: ContextData): void => {
  console.error('[Error Reporting]', error);
  
  if (contextData) {
    console.error('[Error Context]', contextData);
  }
  
  if (process.env.NODE_ENV === 'production') {
    // В реальном проекте здесь бы отправлялась ошибка в Sentry
    /* Пример отправки в Sentry
    Sentry.withScope((scope) => {
      if (contextData) {
        Object.entries(contextData).forEach(([key, value]) => {
          scope.setExtra(key, value);
        });
      }
      Sentry.captureException(error);
    });
    */
  }
};

// Утилиты для логирования ошибок
export const logError = (error: any, context?: string) => {
  console.error(`Error${context ? ` in ${context}` : ''}:`, error);
};

// Утилиты для локализации ошибок с сервера
export const localizeServerError = (errorMessage: string, t: (key: string) => string): string => {
  // Словарь распространенных ошибок сервера
  const serverErrorTranslations: Record<string, string> = {
    // Английские ошибки
    'User not found': t('errorUserNotFound'),
    'Board not found': t('errorBoardNotFound'),
    'Task not found': t('errorTaskNotFound'),
    'Access denied': t('errorAccessDenied'),
    'Invalid credentials': t('errorInvalidCredentials'),
    'Token expired': t('errorTokenExpired'),
    'Validation failed': t('errorValidationFailed'),
    'Server error': t('errorServerError'),
    'Network error': t('errorNetworkError'),
    'Member already exists': t('errorMemberExists'),
    'Permission denied': t('errorPermissionDenied'),
    'Invalid input': t('errorInvalidInput'),
    'File too large': t('errorFileTooLarge'),
    'Unsupported file type': t('errorUnsupportedFileType'),
    
    // Русские ошибки
    'Пользователь не найден': t('errorUserNotFound'),
    'Доска не найдена': t('errorBoardNotFound'),
    'Задача не найдена': t('errorTaskNotFound'),
    'Доступ запрещен': t('errorAccessDenied'),
    'Неверные учетные данные': t('errorInvalidCredentials'),
    'Токен истек': t('errorTokenExpired'),
    'Ошибка валидации': t('errorValidationFailed'),
    'Ошибка сервера': t('errorServerError'),
    'Ошибка сети': t('errorNetworkError'),
    'Участник уже существует': t('errorMemberExists'),
    'Отказано в доступе': t('errorPermissionDenied'),
    'Некорректные данные': t('errorInvalidInput'),
    'Файл слишком большой': t('errorFileTooLarge'),
    'Неподдерживаемый тип файла': t('errorUnsupportedFileType')
  };

  // Проверяем точное совпадение
  if (serverErrorTranslations[errorMessage]) {
    return serverErrorTranslations[errorMessage];
  }

  // Проверяем частичные совпадения
  for (const [serverText, localizedText] of Object.entries(serverErrorTranslations)) {
    if (errorMessage.includes(serverText)) {
      return errorMessage.replace(serverText, localizedText);
    }
  }

  // Если перевод не найден, возвращаем исходное сообщение
  return errorMessage;
}; 