import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * Компонент для отлова ошибок React и предотвращения падения всего приложения
 */
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
    // Здесь можно добавить отправку ошибки в систему мониторинга типа Sentry
  }

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      // Простая локализация через localStorage
      const language = localStorage.getItem('language') || 'ru';
      const texts = {
        ru: {
          title: 'Что-то пошло не так',
          message: 'Произошла ошибка при отображении компонента.',
          details: 'Подробности ошибки',
          retry: 'Попробовать снова'
        },
        en: {
          title: 'Something went wrong',
          message: 'An error occurred while rendering the component.',
          details: 'Error Details',
          retry: 'Try Again'
        }
      };
      const t = texts[language as keyof typeof texts] || texts['ru'];
      
      return (
        <div className="error-boundary">
          <h2>{t.title}</h2>
          <p>{t.message}</p>
          <details>
            <summary>{t.details}</summary>
            <pre>{this.state.error?.toString()}</pre>
          </details>
          <button
            onClick={() => this.setState({ hasError: false, error: undefined })}
            className="error-retry-button"
          >
            {t.retry}
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 