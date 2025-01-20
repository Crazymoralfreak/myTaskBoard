import { useTelegram } from './hooks/useTelegram';
import { useEffect, useState } from 'react';
import { TelegramLogin } from './components/TelegramLogin';
import { sendAuthData } from './api/api';

function App() {
  const { user, theme, WebApp } = useTelegram();
  const [authData, setAuthData] = useState<any>(null);

  useEffect(() => {
    WebApp.ready();
  }, [WebApp]);

  const handleAuth = async (user: any) => {
    try {
      const response = await sendAuthData(user);
      setAuthData(response);
      console.log('Auth successful:', response);
    } catch (error) {
      console.error('Auth failed:', error);
    }
  };

  return (
    <div className={`app ${theme}`}>
      <h1>Hello, {user?.username || 'User'}!</h1>
      <p>Welcome to the Telegram Mini App.</p>
      {!authData && (
        <TelegramLogin
          botName={import.meta.env.VITE_BOT_NAME}
          onAuth={handleAuth}
        />
      )}
      {authData && <p>Вы авторизованы как {authData.username}!</p>}
    </div>
  );
}

export default App;