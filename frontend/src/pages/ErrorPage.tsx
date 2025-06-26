import React from 'react';
import { Link, useRouteError } from 'react-router-dom';
import { useLocalization } from '../hooks/useLocalization';

interface ErrorDetails {
  statusText?: string;
  message?: string;
  status?: number;
}

/**
 * Страница отображения критических ошибок
 */
const ErrorPage: React.FC = () => {
  const { t } = useLocalization();
  const error = useRouteError() as ErrorDetails;
  console.error('Error caught by error page:', error);

  return (
    <div className="error-page">
      <div className="error-page-container">
        <h1>{t('errorOccurred')}</h1>
        <p>{t('unexpectedError')}</p>
        
        <div className="error-details">
          <p>
            <strong>{t('status')}:</strong> {error.status || t('unknown')}
          </p>
          <p>
            <strong>{t('message')}:</strong>{' '}
            {error.statusText || error.message || t('noAdditionalInfo')}
          </p>
        </div>
        
        <div className="error-actions">
          <button onClick={() => window.location.reload()}>
            {t('refreshPage')}
          </button>
          <Link to="/" className="button">
            {t('goHome')}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ErrorPage; 