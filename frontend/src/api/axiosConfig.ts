import axios, { InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { handleApiError } from './errorHandler';
import { refreshToken } from '../services/authService';

/**
 * Конфигурация для axios
 * 
 * Важно: Для запросов используем относительные пути, начинающиеся с /api
 * Это будет работать с проксированием через Vite (см. vite.config.ts)
 */

// Создаем экземпляр axios без baseURL
const axiosInstance = axios.create({
    // Не устанавливаем baseURL, чтобы использовать относительные пути
});

// Переменная для отслеживания происходящего обновления токена
let isRefreshingToken = false;
// Очередь запросов, ожидающих обновления токена
let refreshSubscribers: ((token: string) => void)[] = [];

// Функция для добавления запросов в очередь
const addRefreshSubscriber = (callback: (token: string) => void) => {
    refreshSubscribers.push(callback);
};

// Функция для выполнения всех запросов из очереди
const onRefreshed = (token: string) => {
    refreshSubscribers.forEach(callback => callback(token));
    refreshSubscribers = [];
};

axiosInstance.interceptors.request.use(
    (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
        const token = localStorage.getItem('token');
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        
        // Проверяем URL на дублирование /api
        if (config.url && config.url.startsWith('/api/api/')) {
            config.url = config.url.replace('/api/api/', '/api/');
            console.log('Исправлено дублирование /api в URL:', config.url);
        }
        
        console.log(`Отправка ${config.method?.toUpperCase()} запроса:`, config.url);
        return config;
    },
    (error: AxiosError) => {
        return Promise.reject(error);
    }
);

axiosInstance.interceptors.response.use(
    (response: AxiosResponse) => response,
    async (error: AxiosError) => {
        console.error('Ошибка запроса:', error);
        
        const originalRequest = error.config;
        
        // Проверяем, что это ошибка авторизации и у нас есть конфигурация запроса
        if (error.response?.status === 401 && originalRequest) {
            // Если уже идет обновление токена, добавляем запрос в очередь
            if (isRefreshingToken) {
                return new Promise((resolve) => {
                    addRefreshSubscriber((token: string) => {
                        // Заменяем токен в заголовке и повторяем запрос
                        if (originalRequest.headers) {
                            originalRequest.headers.Authorization = `Bearer ${token}`;
                        }
                        resolve(axiosInstance(originalRequest));
                    });
                });
            }

            isRefreshingToken = true;
            
            try {
                console.log('Попытка обновления токена...');
                const newToken = await refreshToken();
                console.log('Токен успешно обновлен');
                
                if (originalRequest.headers) {
                    originalRequest.headers.Authorization = `Bearer ${newToken}`;
                }
                
                // Сообщаем всем ожидающим запросам, что токен обновлен
                onRefreshed(newToken);
                
                // Повторяем изначальный запрос с новым токеном
                return axiosInstance(originalRequest);
            } catch (refreshError) {
                console.error('Не удалось обновить токен:', refreshError);
                localStorage.removeItem('token');
                window.location.href = '/login';
                return Promise.reject(refreshError);
            } finally {
                isRefreshingToken = false;
            }
        } else {
            handleApiError(error);
            return Promise.reject(error);
        }
    }
);

export default axiosInstance; 