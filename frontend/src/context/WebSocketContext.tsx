import React, { createContext, useContext, useEffect, useState } from 'react';
import WebSocketService from '../services/WebSocketService';
import { authService } from '../services/authService';
import { Notification } from '../types/Notification';

interface WebSocketContextType {
  isConnected: boolean;
  unreadCount: number;
  setUnreadCount: (count: number) => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
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

  useEffect(() => {
    const token = authService.getToken();
    
    if (token && authService.isAuthenticated()) {
      // Инициализируем WebSocket
      WebSocketService.initialize(token);
      
      // Обработчики подключения/отключения
      const handleConnect = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
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
      const handleNewNotification = (notification: Notification) => {
        console.log('New notification received:', notification);
        // Обновления счетчика будет обрабатываться через handleCountUpdate
      };
      
      // Обработчик обновления счетчика
      const handleCountUpdate = (count: number) => {
        console.log('Unread count updated:', count);
        setUnreadCount(count);
        
        // Также отправляем событие для совместимости с существующим кодом
        const countUpdateEvent = new CustomEvent('notification-count-update', {
          detail: { count }
        });
        window.dispatchEvent(countUpdateEvent);
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

  // Также слушаем события обновления счетчика для обратной совместимости
  useEffect(() => {
    const handleCountUpdateEvent = (event: Event) => {
      const customEvent = event as CustomEvent;
      setUnreadCount(customEvent.detail.count);
    };

    window.addEventListener('notification-count-update', handleCountUpdateEvent);
    
    return () => {
      window.removeEventListener('notification-count-update', handleCountUpdateEvent);
    };
  }, []);

  const value = {
    isConnected,
    unreadCount,
    setUnreadCount
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}; 