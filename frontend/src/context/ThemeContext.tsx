import React, { createContext, useState, useMemo, useContext, useEffect } from 'react';
import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { lightTheme, darkTheme } from '../theme/theme';
import { fetchUserProfile, updateUserSettings } from '../api/api'; // Для загрузки/сохранения настроек

// Создаем контекст
interface ThemeContextType {
  toggleTheme: () => void;
  mode: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Провайдер темы
export const CustomThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<'light' | 'dark'>('light');
  const [loading, setLoading] = useState(true);

  // Загрузка настроек при монтировании
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedMode = localStorage.getItem('darkMode') === 'true' ? 'dark' : 'light';
        setMode(savedMode);
        
        // Пытаемся загрузить с сервера для синхронизации между устройствами
        const token = localStorage.getItem('token');
        if (token) {
          const profile = await fetchUserProfile();
          if (profile?.userSettings?.darkMode !== undefined) {
            const serverMode = profile.userSettings.darkMode ? 'dark' : 'light';
            setMode(serverMode);
            localStorage.setItem('darkMode', serverMode === 'dark' ? 'true' : 'false');
          }
        }
      } catch (error) {
        console.error("Не удалось загрузить настройки темы:", error);
        // Используем значение из localStorage, если оно есть
        const localMode = localStorage.getItem('darkMode') === 'true' ? 'dark' : 'light';
        setMode(localMode);
      } finally {
        setLoading(false);
      }
    };
    loadSettings();

    // Слушаем событие смены темы из ProfilePage
    const handleThemeChange = (event: CustomEvent) => {
      setMode(event.detail.darkMode ? 'dark' : 'light');
    };
    window.addEventListener('themeChange', handleThemeChange as EventListener);
    return () => {
      window.removeEventListener('themeChange', handleThemeChange as EventListener);
    };
  }, []);

  // Функция для переключения темы
  const toggleTheme = async () => {
    const newMode = mode === 'light' ? 'dark' : 'light';
    setMode(newMode);
    localStorage.setItem('darkMode', newMode === 'dark' ? 'true' : 'false');
    
    // Сохраняем на сервере, если пользователь авторизован
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const profile = await fetchUserProfile();
        const updatedSettings = { 
          ...(profile.userSettings || {}), 
          darkMode: newMode === 'dark' 
        };
        await updateUserSettings(token, updatedSettings);
        console.log('Настройки темы сохранены на сервере');
      } catch (error) {
        console.error('Не удалось сохранить настройки темы на сервере:', error);
      }
    }
  };

  // Создаем тему на основе текущего режима
  const theme = useMemo(() => (mode === 'light' ? lightTheme : darkTheme), [mode]);

  // Не рендерим ничего, пока грузятся настройки
  if (loading) {
    return null; // Или можно показать спиннер загрузки
  }

  return (
    <ThemeContext.Provider value={{ toggleTheme, mode }}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline /> {/* Сбрасывает стили браузера и применяет базовые стили темы */}
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};

// Хук для использования контекста темы
export const useThemeContext = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useThemeContext must be used within a CustomThemeProvider');
  }
  return context;
}; 