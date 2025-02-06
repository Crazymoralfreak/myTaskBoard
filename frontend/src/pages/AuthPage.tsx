import { useEffect, useState } from 'react';
import { useTelegram } from '../hooks/useTelegram';
import { TelegramLogin } from '../components/TelegramLogin';
import { sendAuthData } from '../api/api';
import { useNavigate } from 'react-router-dom';
import './AuthPage.css'; // Добавим стили для вкладок

export const AuthPage = () => {
  const { user, WebApp } = useTelegram();
  const [authData, setAuthData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [registerData, setRegisterData] = useState({ email: '', password: '', name: '' });
  const navigate = useNavigate();

  useEffect(() => {
    WebApp.ready();
    if (user) {
      // Если пользователь уже авторизован через Telegram, перенаправляем на главную страницу
      navigate('/');
    }
  }, [user, WebApp, navigate]);

  const handleAuth = async (userData: any) => {
    try {
      const response = await sendAuthData(userData);
      setAuthData(response);
      navigate('/');
    } catch (error) {
      console.error('Auth failed:', error);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Отправляем данные для входа
      const response = await sendAuthData(loginData);
      setAuthData(response);
      navigate('/');
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Отправляем данные для регистрации
      const response = await sendAuthData(registerData);
      setAuthData(response);
      navigate('/');
    } catch (error) {
      console.error('Registration failed:', error);
    }
  };

  return (
    <div className="auth-page">
      <h1>Авторизация</h1>
      <div className="tabs">
        <button
          className={activeTab === 'login' ? 'active' : ''}
          onClick={() => setActiveTab('login')}
        >
          Вход
        </button>
        <button
          className={activeTab === 'register' ? 'active' : ''}
          onClick={() => setActiveTab('register')}
        >
          Регистрация
        </button>
      </div>
      {activeTab === 'login' && (
        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Email"
            value={loginData.email}
            onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
            required
          />
          <input
            type="password"
            placeholder="Пароль"
            value={loginData.password}
            onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
            required
          />
          <button type="submit">Войти</button>
        </form>
      )}
      {activeTab === 'register' && (
        <form onSubmit={handleRegister}>
          <input
            type="text"
            placeholder="Имя"
            value={registerData.name}
            onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={registerData.email}
            onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
            required
          />
          <input
            type="password"
            placeholder="Пароль"
            value={registerData.password}
            onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
            required
          />
          <button type="submit">Зарегистрироваться</button>
        </form>
      )}
      <div className="telegram-login">
        <p>Или войдите через Telegram:</p>
        <TelegramLogin
          botName={import.meta.env.VITE_BOT_NAME}
          onAuth={handleAuth}
        />
      </div>
    </div>
  );
};