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