import { useEffect, useState } from 'react';
import { WebApp } from '@twa-dev/sdk';

export const useTelegram = () => {
  const [user, setUser] = useState<WebAppUser | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    WebApp.ready();
    setUser(WebApp.initDataUnsafe.user || null);
    setTheme(WebApp.colorScheme);

    const handleThemeChange = () => setTheme(WebApp.colorScheme);
    WebApp.onEvent('themeChanged', handleThemeChange);

    return () => WebApp.offEvent('themeChanged', handleThemeChange);
  }, []);

  return { user, theme, WebApp };
};