import { useEffect } from 'react';

declare global {
  interface Window {
    TelegramLoginWidget: {
      dataOnauth: (user: any) => void;
    };
  }
}

export const TelegramLogin = ({ botName, onAuth }: { botName: string; onAuth: (user: any) => void }) => {
  useEffect(() => {
    window.TelegramLoginWidget = {
      dataOnauth: (user) => onAuth(user),
    };

    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.async = true;
    script.setAttribute('data-telegram-login', botName);
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-onauth', 'TelegramLoginWidget.dataOnauth(user)');
    script.setAttribute('data-request-access', 'write');
    script.setAttribute('data-userpic', 'true');

    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, [botName, onAuth]);

  return null;
};