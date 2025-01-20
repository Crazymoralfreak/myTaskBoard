import { useEffect, useState } from 'react';
import { useTelegram } from '../hooks/useTelegram';
import { TelegramLogin } from '../components/TelegramLogin';
import { sendAuthData } from '../api/api';
import { useNavigate } from 'react-router-dom';

export const AuthPage = () => {
  const { user, WebApp } = useTelegram();
  const [authData, setAuthData] = useState<any>(null);
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

  return (
    <div>
      <h1>Авторизация</h1>
      {!authData && (
        <TelegramLogin
          botName={import.meta.env.VITE_BOT_NAME}
          onAuth={handleAuth}
        />
      )}
    </div>
  );
};