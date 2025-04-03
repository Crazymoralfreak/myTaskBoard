import axios from 'axios';
import { refreshToken } from '../services/authService';

export const api = axios.create({
  baseURL: 'http://localhost:8081',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  timeout: 10000
});

// Add request interceptor for JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // Гарантируем, что для всех не-GET запросов будет установлен Content-Type: application/json
  if (config.method?.toLowerCase() !== 'get' && !config.headers['Content-Type']) {
    if (config.data instanceof FormData) {
      // Для FormData не устанавливаем Content-Type, браузер сделает это с правильной boundary
      delete config.headers['Content-Type'];
    } else {
      config.headers['Content-Type'] = 'application/json';
    }
  }
  
  // Преобразуем объект в JSON, если это не FormData, Blob, File и др.
  if (config.data && 
      typeof config.data === 'object' &&
      !(config.data instanceof FormData) &&
      !(config.data instanceof Blob) &&
      !(config.data instanceof File) &&
      !(config.data instanceof ArrayBuffer)) {
    // Проверяем, не был ли объект уже преобразован в JSON-строку
    if (typeof config.data !== 'string') {
      // Проверяем, не пытаемся ли мы отправить пустой объект
      const isEmpty = Object.keys(config.data).length === 0;
      if (!isEmpty) {
        console.log('Преобразуем объект в JSON-строку:', config.data);
      }
    }
  }
  
  // Добавляем логирование для отладки
  console.log('Request config:', {
    url: config.url,
    method: config.method,
    headers: config.headers,
    data: config.data
  });

  return config;
}, (error) => {
  console.error('Ошибка в запросе:', error);
  return Promise.reject(error);
});

// Add response interceptor for logging and token refresh
api.interceptors.response.use((response) => {
  console.log('Успешный ответ:', {
    url: response.config.url,
    status: response.status,
    data: response.data
  });
  return response;
}, async (error) => {
  console.error('Ошибка ответа:', {
    url: error.config?.url,
    status: error.response?.status,
    data: error.response?.data,
    headers: error.config?.headers,
    message: error.message
  });
  
  // Если 401 Unauthorized - возможно проблема с токеном
  if (error.response && error.response.status === 401) {
    try {
      const newToken = await refreshToken();
      if (newToken) {
        // Если удалось обновить токен, повторяем запрос
        const originalRequest = error.config;
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      }
    } catch (refreshError) {
      console.error('Не удалось обновить токен:', refreshError);
      // Перенаправляем на страницу логина при ошибке обновления токена
      window.location.href = '/login';
    }
  }
  
  return Promise.reject(error);
});

// Авторизация через Telegram
export const sendAuthData = async (authData: any) => {
  try {
    const response = await api.post('/auth', authData);
    return response.data;
  } catch (error) {
    console.error('Error sending auth data:', error);
    throw error;
  }
};

// Получение списка досок пользователя
export const fetchBoards = async (userId: string) => {
  try {
    const response = await api.get('/boards', {
      params: { userId },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching boards:', error);
    throw error;
  }
};

// Создание новой доски
export const createBoard = async (boardData: { title: string; userId: string }) => {
  try {
    const response = await api.post('/boards', boardData);
    return response.data;
  } catch (error) {
    console.error('Error creating board:', error);
    throw error;
  }
};

// Получение данных пользователя
export const fetchUserProfile = async () => {
  try {
    const response = await api.get('/api/users/profile');
    return response.data;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
};

// Обновление профиля пользователя
export const updateUserProfile = async (profileData: any) => {
  try {
    // Создаем новый объект, содержащий только поля из UserProfileUpdateDto
    const profileUpdateDto = {
      username: profileData.username,
      email: profileData.email,
      phoneNumber: profileData.phone, // Обратите внимание на маппинг phone -> phoneNumber
      position: profileData.position,
      bio: profileData.bio
      // Удаляем avatarUrl отсюда, так как теперь мы обновляем его отдельно
    };
    
    const response = await api.put('/api/users/profile', profileUpdateDto);
    
    // После успешного обновления профиля, получаем новый JWT токен
    try {
      await refreshTokenAfterProfileUpdate(response.data.id);
    } catch (tokenError) {
      console.warn('Не удалось обновить токен после изменения профиля:', tokenError);
    }
    
    return response.data;
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

// Обновление только аватара пользователя (принимает как URL, так и base64)
export const updateUserAvatar = async (avatarUrl: string) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('Токен отсутствует при попытке обновления аватара');
      throw new Error('Ошибка авторизации: отсутствует токен');
    }
    
    // Если это base64 изображение, конвертируем в FormData и отправляем на отдельный endpoint
    if (avatarUrl.startsWith('data:image')) {
      return await uploadBase64Avatar(avatarUrl);
    }
    
    // Если это URL, отправляем как обычно
    const response = await api.put('/api/users/profile/avatar', { avatarUrl });
    
    // Обновляем данные пользователя в localStorage
    if (response.data) {
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      userData.avatarUrl = avatarUrl;
      localStorage.setItem('user', JSON.stringify(userData));
    }
    
    return response.data;
  } catch (error: any) {
    console.error('Error updating user avatar:', error);
    if (error.response && error.response.status === 401) {
      // Если 401 Unauthorized, перенаправляем на страницу логина
      console.warn('Перенаправление на страницу логина из-за ошибки авторизации');
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    throw error;
  }
};

// Загрузка аватара в формате base64
export const uploadBase64Avatar = async (base64Image: string) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Ошибка авторизации: отсутствует токен');
    }
    
    // Конвертируем base64 в blob
    const blob = await fetch(base64Image).then(res => res.blob());
    
    // Создаем FormData
    const formData = new FormData();
    formData.append('file', blob, 'avatar.jpg');
    
    // Отправляем запрос
    const response = await api.post('/api/users/profile/avatar/upload', formData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
      }
    });
    
    // Обновляем данные пользователя в localStorage
    if (response.data && response.data.avatarUrl) {
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      userData.avatarUrl = response.data.avatarUrl;
      localStorage.setItem('user', JSON.stringify(userData));
    }
    
    return response.data;
  } catch (error) {
    console.error('Error uploading avatar:', error);
    throw error;
  }
};

// Обновление токена после изменения профиля
export const refreshTokenAfterProfileUpdate = async (userId: number) => {
  try {
    const response = await api.post(`/api/auth/refresh-after-update/${userId}`);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    return response.data;
  } catch (error) {
    console.error('Error refreshing token after profile update:', error);
    throw error;
  }
};

// Отправка уведомления через Telegram Bot API
export const sendTelegramNotification = async (userId: string, message: string) => {
  try {
    const response = await api.post('/notify', { userId, message });
    return response.data;
  } catch (error) {
    console.error('Error sending notification:', error);
    throw error;
  }
};

// Получение истории изменений задачи
export const fetchTask = async (taskId: string) => {
  try {
    const response = await api.get(`/tasks/${taskId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching task:', error);
    throw error;
  }
};

export const updateTaskPosition = async (taskData: {
  taskId: string;
  sourceColumnId: string;
  destinationColumnId: string;
  sourceIndex: number;
  destinationIndex: number;
}) => {
  try {
    const response = await api.post('/tasks/update-position', taskData);
    return response.data;
  } catch (error) {
    console.error('Error updating task position:', error);
    throw error;
  }
};

export const fetchTaskHistory = async (taskId: string) => {
  try {
    const response = await api.get(`/tasks/${taskId}/history`);
    return response.data;
  } catch (error) {
    console.error('Error fetching task history:', error);
    throw error;
  }
};

// Смена пароля пользователя
export const changePassword = async (passwordData: { currentPassword: string; newPassword: string }) => {
  try {
    const response = await api.post('/api/users/change-password', passwordData);
    return response.data;
  } catch (error) {
    console.error('Error changing password:', error);
    throw error;
  }
};