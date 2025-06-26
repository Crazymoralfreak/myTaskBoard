import React from 'react';
import { useLocalization } from '../../hooks/useLocalization';

interface ErrorAlertProps {
  message: string;
  details?: string;
  onClose?: () => void;
}

/**
 * Компонент для отображения ошибок в UI
 */
const ErrorAlert: React.FC<ErrorAlertProps> = ({ message, details, onClose }) => {
  const { t } = useLocalization();
  
  return (
    <div className="error-alert" role="alert">
      <div className="error-alert-content">
        <div className="error-alert-message">{message}</div>
        {details && (
          <details className="error-alert-details">
            <summary>{t('errorAlertDetails')}</summary>
            <pre>{details}</pre>
          </details>
        )}
      </div>
      {onClose && (
        <button
          type="button"
          className="error-alert-close"
                        aria-label={t('errorAlertClose')}
          onClick={onClose}
        >
          &times;
        </button>
      )}
    </div>
  );
};

export default ErrorAlert; 