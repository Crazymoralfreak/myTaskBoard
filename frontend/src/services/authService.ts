import { AuthResponse, TelegramAuthRequest } from '../types/auth';
import { JwtService } from './jwtService';
import { api } from '../api/api';

const jwtService = JwtService.getInstance();
const axiosInstance = jwtService.getAxiosInstance();

export const authService = {
    async register(email: string, password: string, username: string): Promise<AuthResponse> {
        const response = await axiosInstance.post('/api/auth/register', {
            email,
            password,
            username
        });
        if (response.data.token) {
            localStorage.setItem('token', response.data.token);
        }
        return response.data;
    },

    async login(email: string, password: string): Promise<AuthResponse> {
        const response = await api.post('/api/auth/login', { email, password });
        
        if (response.data.token) {
            localStorage.setItem('token', response.data.token);
            // Сохраняем данные пользователя в localStorage
            if (response.data.user) {
                localStorage.setItem('user', JSON.stringify(response.data.user));
            }
        }
        
        return response.data;
    },

    async telegramAuth(data: TelegramAuthRequest): Promise<AuthResponse> {
        const response = await api.post('/api/auth/telegram', data);
        if (response.data.token) {
            localStorage.setItem('token', response.data.token);
            
            // Если есть пользовательские данные, сохраняем их
            if (response.data.user) {
                // Если доступен аватар из Telegram, добавляем его в данные пользователя
                if (data.photo_url) {
                    response.data.user.avatarUrl = data.photo_url;
                }
                localStorage.setItem('user', JSON.stringify(response.data.user));
            }
        }
        return response.data;
    },

    logout() {
        localStorage.removeItem('token');
        window.location.href = '/login';
    },

    isAuthenticated(): boolean {
        return !!localStorage.getItem('token');
    },

    getToken(): string | null {
        return localStorage.getItem('token');
    }
};

export const refreshToken = async (): Promise<string> => {
    try {
        const response = await axiosInstance.post('/api/auth/refresh', {}, {
            withCredentials: true
        });
        
        const newToken = response.data.token;
        localStorage.setItem('token', newToken);
        return newToken;
    } catch (error) {
        console.error('Failed to refresh token:', error);
        localStorage.removeItem('token');
        window.location.href = '/login';
        throw error;
    }
};

export const changePassword = async (currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('Ошибка авторизации: отсутствует токен');
      throw new Error('Не авторизован');
    }

    console.log('Отправка запроса на смену пароля');
    const response = await api.post(
      '/api/users/change-password',
      { currentPassword, newPassword },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('Ответ от сервера:', { status: response.status, data: response.data });

    // После смены пароля инвалидируем текущий токен и перенаправляем на страницу логина
    if (response.status === 200) {
      // Сохраняем данные пользователя перед выходом
      const userData = localStorage.getItem('user');
      // Очищаем токен
      localStorage.removeItem('token');
      
      // Для безопасности перенаправляем на страницу логина, так как токен теперь недействителен
      return { 
        success: true, 
        message: 'Пароль успешно изменен. Пожалуйста, войдите снова с новым паролем.' 
      };
    }

    return { success: true, message: 'Пароль успешно изменен' };
  } catch (error: any) {
    console.error('Ошибка при смене пароля:', error);
    
    if (error.response) {
      console.error('Детали ошибки:', {
        status: error.response.status,
        headers: error.response.headers,
        data: error.response.data
      });
      
      // Получаем сообщение об ошибке с сервера
      const errorMessage = error.response.data.error || 'Произошла ошибка при смене пароля';
      return { success: false, message: errorMessage };
    }
    
    return { success: false, message: error.message || 'Произошла ошибка при смене пароля' };
  }
}; 