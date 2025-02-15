import axios from 'axios';

export const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/auth';
    }
    return Promise.reject(error);
  }
);

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
export const fetchUserProfile = async (userId: string) => {
  try {
    const response = await api.get(`/users/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching user profile:', error);
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