import React, { createContext, useContext, useEffect, useState } from 'react';
import WebSocketService from '../services/WebSocketService';
import { authService } from '../services/authService';
import { Notification as AppNotification } from '../types/Notification';
import { NotificationsService } from '../services/NotificationsService';

interface WebSocketContextType {
  isConnected: boolean;
  unreadCount: number;
  setUnreadCount: (count: number) => void;
  newNotifications: AppNotification[];
  clearNewNotifications: () => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export const useWebSocket = (): WebSocketContextType => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

interface WebSocketProviderProps {
  children: React.ReactNode;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [newNotifications, setNewNotifications] = useState<AppNotification[]>([]);

  const clearNewNotifications = () => {
    setNewNotifications([]);
  };

  useEffect(() => {
    const token = authService.getToken();
    
    if (token && authService.isAuthenticated()) {
      console.log('Инициализация WebSocket с токеном:', token.substring(0, 10) + '...');
      
      // Инициализируем WebSocket
      WebSocketService.initialize(token);
      
      // Обработчики подключения/отключения
      const handleConnect = async () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        
        // Загружаем начальный счетчик уведомлений при подключении
        try {
          const count = await NotificationsService.getUnreadCount();
          setUnreadCount(count);
          console.log('Загружен начальный счетчик уведомлений:', count);
        } catch (error) {
          console.error('Ошибка загрузки счетчика уведомлений:', error);
        }
      };
      
      const handleDisconnect = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
      };
      
      const handleError = (error: any) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
      };
      
      // Обработчик новых уведомлений
      const handleNewNotification = (notification: AppNotification) => {
        console.log('New notification received:', notification);
        
        // Добавляем новое уведомление в список
        setNewNotifications(prev => [notification, ...prev]);
        
        // Показываем браузерное уведомление, если разрешены
        if ('Notification' in window && window.Notification.permission === 'granted') {
          new window.Notification(notification.title, {
            body: notification.message,
            icon: '/logo.svg',
            badge: '/logo.svg'
          });
        }
      };
      
      // Обработчик обновления счетчика
      const handleCountUpdate = (count: number) => {
        console.log('Unread count updated via WebSocket:', count);
        setUnreadCount(count);
      };
      
      // Регистрируем обработчики
      WebSocketService.addConnectHandler(handleConnect);
      WebSocketService.addDisconnectHandler(handleDisconnect);
      WebSocketService.addErrorHandler(handleError);
      WebSocketService.addMessageHandler(handleNewNotification);
      WebSocketService.addCountUpdateHandler(handleCountUpdate);
      
      // Очистка при размонтировании
      return () => {
        WebSocketService.removeConnectHandler(handleConnect);
        WebSocketService.removeDisconnectHandler(handleDisconnect);
        WebSocketService.removeErrorHandler(handleError);
        WebSocketService.removeMessageHandler(handleNewNotification);
        WebSocketService.removeCountUpdateHandler(handleCountUpdate);
        WebSocketService.disconnect();
      };
    }
  }, []);

  // Слушаем события обновления счетчика для обратной совместимости
  useEffect(() => {
    const handleCountUpdateEvent = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { count } = customEvent.detail;
      if (typeof count === 'number') {
        setUnreadCount(count);
        console.log('Count updated via custom event:', count);
      }
    };

    window.addEventListener('notification-count-update', handleCountUpdateEvent);
    
    return () => {
      window.removeEventListener('notification-count-update', handleCountUpdateEvent);
    };
  }, []);

  const value = {
    isConnected,
    unreadCount,
    setUnreadCount,
    newNotifications,
    clearNewNotifications
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}; 