import React from 'react';
import { useLocalization } from '../../hooks/useLocalization';
import { localizeServerError } from '../../utils/errorReporting';

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
  
  // Локализуем сообщение об ошибке
  const localizedMessage = localizeServerError(message, t);
  
  return (
    <div className="error-alert" role="alert">
      <div className="error-alert-content">
        <div className="error-alert-message">{localizedMessage}</div>
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