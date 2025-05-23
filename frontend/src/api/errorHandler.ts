import { AxiosError } from 'axios';
import { toast } from 'react-toastify';

export interface ErrorResponse {
  code: string;
  message: string;
  details?: string;
  timestamp: string;
}

/**
 * Централизованная обработка API ошибок
 */
export const handleApiError = (error: AxiosError): void => {
  // Проверяем, имеем ли мы дело с ответом от сервера в нашем формате
  const errorResponse = error.response?.data as ErrorResponse;
  
  if (!errorResponse?.code) {
    // Если это не структурированный ответ (сетевая ошибка или неожиданный формат)
    console.error('Network error or unexpected format:', error);
    toast.error('Не удалось выполнить запрос. Проверьте подключение к интернету.');
    return;
  }
  
  console.error('API Error:', errorResponse);
  
  // Обработка специфических кодов ошибок
  switch (errorResponse.code) {
    case 'ENTITY_NOT_FOUND':
    case 'RESOURCE_NOT_FOUND':
      toast.error(errorResponse.message || 'Запрашиваемый ресурс не найден');
      break;
      
    case 'ACCESS_DENIED':
      toast.error(errorResponse.message || 'Доступ запрещен');
      break;
      
    case 'INVALID_INVITE_LINK':
      toast.error(errorResponse.message || 'Неверная ссылка-приглашение');
      break;
      
    case 'BOARD_MEMBER_EXISTS':
      toast.warning(errorResponse.message || 'Пользователь уже является участником доски');
      break;
      
    case 'VALIDATION_ERROR':
      toast.error(
        errorResponse.details
          ? `${errorResponse.message}: ${errorResponse.details}`
          : errorResponse.message || 'Ошибка валидации данных'
      );
      break;
      
    case 'SERVER_ERROR':
      toast.error('Произошла внутренняя ошибка сервера. Пожалуйста, попробуйте позже.');
      // Здесь можно добавить отправку ошибки в систему мониторинга типа Sentry
      break;
      
    default:
      toast.error(errorResponse.message || 'Произошла ошибка при выполнении запроса');
  }
}; 