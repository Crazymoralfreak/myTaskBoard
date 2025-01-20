import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

// Авторизация через Telegram
export const sendAuthData = async (authData: any) => {
  try {
    const response = await axios.post(`${API_URL}/auth`, authData);
    return response.data;
  } catch (error) {
    console.error('Error sending auth data:', error);
    throw error;
  }
};

// Получение списка досок пользователя
export const fetchBoards = async (userId: string) => {
  try {
    const response = await axios.get(`${API_URL}/boards`, {
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
    const response = await axios.post(`${API_URL}/boards`, boardData);
    return response.data;
  } catch (error) {
    console.error('Error creating board:', error);
    throw error;
  }
};

// Получение данных пользователя
export const fetchUserProfile = async (userId: string) => {
  try {
    const response = await axios.get(`${API_URL}/users/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
};

// Отправка уведомления через Telegram Bot API
export const sendTelegramNotification = async (userId: string, message: string) => {
  try {
    const response = await axios.post(`${API_URL}/notify`, { userId, message });
    return response.data;
  } catch (error) {
    console.error('Error sending notification:', error);
    throw error;
  }
};

// Получение истории изменений задачи
export const fetchTaskHistory = async (taskId: string) => {
  try {
    const response = await axios.get(`${API_URL}/tasks/${taskId}/history`);
    return response.data;
  } catch (error) {
    console.error('Error fetching task history:', error);
    throw error;
  }
};