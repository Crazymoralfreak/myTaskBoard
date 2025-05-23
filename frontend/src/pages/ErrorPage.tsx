import React from 'react';
import { Link, useRouteError } from 'react-router-dom';

interface ErrorDetails {
  statusText?: string;
  message?: string;
  status?: number;
}

/**
 * Страница отображения критических ошибок
 */
const ErrorPage: React.FC = () => {
  const error = useRouteError() as ErrorDetails;
  console.error('Error caught by error page:', error);

  return (
    <div className="error-page">
      <div className="error-page-container">
        <h1>Произошла ошибка</h1>
        <p>Извините, произошла непредвиденная ошибка.</p>
        
        <div className="error-details">
          <p>
            <strong>Статус:</strong> {error.status || 'Неизвестно'}
          </p>
          <p>
            <strong>Сообщение:</strong>{' '}
            {error.statusText || error.message || 'Нет дополнительной информации'}
          </p>
        </div>
        
        <div className="error-actions">
          <button onClick={() => window.location.reload()}>
            Обновить страницу
          </button>
          <Link to="/" className="button">
            На главную
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ErrorPage; 