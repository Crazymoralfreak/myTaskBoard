import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { Notification } from '../types/Notification';

/**
 * Тип обработчика событий сокета
 */
type WebSocketEventHandler = () => void;

/**
 * Тип обработчика сообщений
 */
type MessageHandler = (notification: Notification) => void;

/**
 * Тип обработчика обновлений счетчика
 */
type CountUpdateHandler = (count: number) => void;

/**
 * Сервис для работы с WebSocket
 */
class WebSocketService {
  private client: Client | null = null;
  private messageHandlers: MessageHandler[] = [];
  private countUpdateHandlers: CountUpdateHandler[] = [];
  private connectHandlers: WebSocketEventHandler[] = [];
  private disconnectHandlers: WebSocketEventHandler[] = [];
  private errorHandlers: ((error: any) => void)[] = [];
  
  /**
   * Инициализирует WebSocket-соединение
   * @param token JWT токен для аутентификации
   */
  public initialize(token: string): void {
    if (this.client) {
      this.disconnect();
    }
    
    const apiUrl = import.meta.env.VITE_API_URL || '';
    const wsUrl = apiUrl.replace(/^http/, 'ws');
    const socketEndpoint = `${wsUrl}/ws`;
    
    this.client = new Client({
      webSocketFactory: () => new SockJS(socketEndpoint),
      connectHeaders: {
        Authorization: `Bearer ${token}`
      },
      debug: function(str: string) {
        if (process.env.NODE_ENV !== 'production') {
          console.log('STOMP:', str);
        }
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000
    });
    
    this.client.onConnect = this.onConnect.bind(this);
    this.client.onDisconnect = this.onDisconnect.bind(this);
    this.client.onStompError = this.onError.bind(this);
    
    this.client.activate();
  }
  
  /**
   * Отключает WebSocket-соединение
   */
  public disconnect(): void {
    if (this.client) {
      this.client.deactivate();
      this.client = null;
    }
  }
  
  /**
   * Добавляет обработчик сообщений
   * @param handler функция-обработчик сообщений
   */
  public addMessageHandler(handler: MessageHandler): void {
    this.messageHandlers.push(handler);
  }
  
  /**
   * Удаляет обработчик сообщений
   * @param handler функция-обработчик сообщений
   */
  public removeMessageHandler(handler: MessageHandler): void {
    this.messageHandlers = this.messageHandlers.filter(h => h !== handler);
  }
  
  /**
   * Добавляет обработчик обновлений счетчика
   * @param handler функция-обработчик обновлений счетчика
   */
  public addCountUpdateHandler(handler: CountUpdateHandler): void {
    this.countUpdateHandlers.push(handler);
  }
  
  /**
   * Удаляет обработчик обновлений счетчика
   * @param handler функция-обработчик обновлений счетчика
   */
  public removeCountUpdateHandler(handler: CountUpdateHandler): void {
    this.countUpdateHandlers = this.countUpdateHandlers.filter(h => h !== handler);
  }
  
  /**
   * Добавляет обработчик подключения
   * @param handler функция-обработчик подключения
   */
  public addConnectHandler(handler: WebSocketEventHandler): void {
    this.connectHandlers.push(handler);
  }
  
  /**
   * Удаляет обработчик подключения
   * @param handler функция-обработчик подключения
   */
  public removeConnectHandler(handler: WebSocketEventHandler): void {
    this.connectHandlers = this.connectHandlers.filter(h => h !== handler);
  }
  
  /**
   * Добавляет обработчик отключения
   * @param handler функция-обработчик отключения
   */
  public addDisconnectHandler(handler: WebSocketEventHandler): void {
    this.disconnectHandlers.push(handler);
  }
  
  /**
   * Удаляет обработчик отключения
   * @param handler функция-обработчик отключения
   */
  public removeDisconnectHandler(handler: WebSocketEventHandler): void {
    this.disconnectHandlers = this.disconnectHandlers.filter(h => h !== handler);
  }
  
  /**
   * Добавляет обработчик ошибок
   * @param handler функция-обработчик ошибок
   */
  public addErrorHandler(handler: (error: any) => void): void {
    this.errorHandlers.push(handler);
  }
  
  /**
   * Удаляет обработчик ошибок
   * @param handler функция-обработчик ошибок
   */
  public removeErrorHandler(handler: (error: any) => void): void {
    this.errorHandlers = this.errorHandlers.filter(h => h !== handler);
  }
  
  /**
   * Обработчик подключения к WebSocket
   * @param frame фрейм подключения
   */
  private onConnect(frame: any): void {
    console.log('Connected to WebSocket');
    
    if (this.client) {
      // Подписываемся на получение уведомлений
      this.client.subscribe('/user/queue/notifications', this.onMessage.bind(this));
      
      // Подписываемся на обновления счетчика
      this.client.subscribe('/user/queue/unread-count', this.onCountUpdate.bind(this));
    }
    
    // Вызываем все обработчики подключения
    this.connectHandlers.forEach(handler => handler());
  }
  
  /**
   * Обработчик отключения от WebSocket
   * @param frame фрейм отключения
   */
  private onDisconnect(frame: any): void {
    console.log('Disconnected from WebSocket');
    
    // Вызываем все обработчики отключения
    this.disconnectHandlers.forEach(handler => handler());
  }
  
  /**
   * Обработчик ошибок WebSocket
   * @param frame фрейм ошибки
   */
  private onError(frame: any): void {
    console.error('WebSocket error:', frame);
    
    // Вызываем все обработчики ошибок
    this.errorHandlers.forEach(handler => handler(frame));
  }
  
  /**
   * Обработчик сообщений WebSocket
   * @param message полученное сообщение
   */
  private onMessage(message: IMessage): void {
    try {
      const notification = JSON.parse(message.body) as Notification;
      
      // Вызываем все обработчики сообщений
      this.messageHandlers.forEach(handler => handler(notification));
    } catch (error) {
      console.error('Error parsing notification message:', error);
    }
  }
  
  /**
   * Обработчик обновлений счетчика
   * @param message сообщение с обновлением счетчика
   */
  private onCountUpdate(message: IMessage): void {
    try {
      const count = parseInt(message.body);
      
      // Вызываем все обработчики обновлений счетчика
      this.countUpdateHandlers.forEach(handler => handler(count));
    } catch (error) {
      console.error('Error parsing count update message:', error);
    }
  }
}

// Экспортируем синглтон сервиса
export default new WebSocketService(); 