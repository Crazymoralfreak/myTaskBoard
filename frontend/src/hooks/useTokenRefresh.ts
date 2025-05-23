import { useEffect, useState } from 'react';
import { JwtService } from '../services/jwtService';
import { refreshToken } from '../services/authService';

/**
 * Хук для обновления токена авторизации в компонентах, 
 * которые могут быть открыты долгое время (например, модальные окна)
 */
export const useTokenRefresh = (isOpen: boolean) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval>;
    
    // Если модальное окно открыто, установим интервал для проверки
    // и обновления токена каждые 10 минут
    if (isOpen) {
      intervalId = setInterval(async () => {
        const token = localStorage.getItem('token');
        if (!token) return;
        
        try {
          setIsRefreshing(true);
          setError(null);
          await refreshToken();
          console.log('Токен авторизации обновлен');
        } catch (err) {
          console.error('Ошибка при обновлении токена:', err);
          setError('Ошибка при обновлении токена авторизации');
        } finally {
          setIsRefreshing(false);
        }
      }, 10 * 60 * 1000); // 10 минут
    }
    
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isOpen]);
  
  return { isRefreshing, error };
}; 