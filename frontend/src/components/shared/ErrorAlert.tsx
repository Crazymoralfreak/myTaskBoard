import React from 'react';

interface ErrorAlertProps {
  message: string;
  details?: string;
  onClose?: () => void;
}

/**
 * Компонент для отображения ошибок в UI
 */
const ErrorAlert: React.FC<ErrorAlertProps> = ({ message, details, onClose }) => {
  return (
    <div className="error-alert" role="alert">
      <div className="error-alert-content">
        <div className="error-alert-message">{message}</div>
        {details && (
          <details className="error-alert-details">
            <summary>Подробности</summary>
            <pre>{details}</pre>
          </details>
        )}
      </div>
      {onClose && (
        <button
          type="button"
          className="error-alert-close"
          aria-label="Закрыть"
          onClick={onClose}
        >
          &times;
        </button>
      )}
    </div>
  );
};

export default ErrorAlert; 