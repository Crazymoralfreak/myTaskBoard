import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { userService } from '../services/userService';

// Импорты переводов
import ruTranslations from '../locales/ru';
import enTranslations from '../locales/en';

// Типы
export type SupportedLanguage = 'ru' | 'en';

// Тип для объекта переводов - разрешаем любые объекты
type TranslationsObject = Record<string, any>;

interface LocalizationContextType {
  language: SupportedLanguage;
  setLanguage: (language: SupportedLanguage) => void;
  t: (key: string) => string;
  timezone: string;
  updateUserSettings: (settings: any) => void;
}

// Все переводы
const translations: Record<SupportedLanguage, TranslationsObject> = {
  ru: ruTranslations as TranslationsObject,
  en: enTranslations as TranslationsObject,
};

// Контекст
const LocalizationContext = createContext<LocalizationContextType | undefined>(undefined);

// Провайдер
interface LocalizationProviderProps {
  children: ReactNode;
  userSettings?: { language?: string; timezone?: string };
}

export const AppLocalizationProvider: React.FC<LocalizationProviderProps> = ({ 
  children, 
  userSettings 
}) => {
  const [language, setLanguageState] = useState<SupportedLanguage>('ru');
  const [timezone, setTimezone] = useState<string>('Europe/Moscow');

  // Инициализация языка и таймзоны при монтировании
  useEffect(() => {
    const initLanguageAndTimezone = () => {
      // Язык
      let initialLanguage: SupportedLanguage = 'ru';
      if (userSettings?.language) {
        initialLanguage = userSettings.language as SupportedLanguage;
      } else {
        const savedLanguage = localStorage.getItem('language');
        if (savedLanguage && (savedLanguage === 'ru' || savedLanguage === 'en')) {
          initialLanguage = savedLanguage as SupportedLanguage;
        } else {
          const browserLanguage = navigator.language.toLowerCase();
          if (browserLanguage.startsWith('ru')) {
            initialLanguage = 'ru';
          } else {
            initialLanguage = 'en';
          }
        }
      }
      setLanguageState(initialLanguage);
      localStorage.setItem('language', initialLanguage);

      // Таймзона
      let initialTimezone = 'Europe/Moscow';
      if (userSettings?.timezone) {
        initialTimezone = userSettings.timezone;
      } else {
        const savedTimezone = localStorage.getItem('timezone');
        if (savedTimezone) {
          initialTimezone = savedTimezone;
        } else {
          try {
            initialTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Moscow';
          } catch {
            initialTimezone = 'Europe/Moscow';
          }
        }
      }
      setTimezone(initialTimezone);
      localStorage.setItem('timezone', initialTimezone);
    };
    initLanguageAndTimezone();
  }, [userSettings]);

  // Функция перевода для плоской структуры
  const t = (key: string): string => {
    const currentTranslations = translations[language];
    
    // Прямой доступ к переводу в плоской структуре
    if (currentTranslations[key] && typeof currentTranslations[key] === 'string') {
      return currentTranslations[key];
    }

    // Fallback на английский если текущий язык не английский
    if (language !== 'en' && translations.en[key] && typeof translations.en[key] === 'string') {
      console.warn(`Translation missing for key "${key}" in language "${language}", using English fallback`);
      return translations.en[key];
    }

    // Если перевод не найден нигде, возвращаем ключ в квадратных скобках
    console.warn(`Translation missing for key "${key}" in all languages`);
    return `[${key}]`;
  };

  // Функция смены языка с сохранением в настройках
  const setLanguage = async (newLanguage: SupportedLanguage) => {
    setLanguageState(newLanguage);
    localStorage.setItem('language', newLanguage);

    // Сохраняем в настройках пользователя, если авторизован
    try {
      const token = localStorage.getItem('token');
      if (token) {
        await userService.updateUserSetting('language', newLanguage);
      }
    } catch (error) {
      console.error('Failed to save language setting:', error);
    }
  };

  // Функция для обновления настроек пользователя
  const updateUserSettings = (settings: any) => {
    if (settings) {
      if (settings.language && (settings.language === 'ru' || settings.language === 'en')) {
        setLanguageState(settings.language as SupportedLanguage);
        localStorage.setItem('language', settings.language);
      }
      
      if (settings.timezone) {
        setTimezone(settings.timezone);
        localStorage.setItem('timezone', settings.timezone);
      }
    }
  };

  return (
    <LocalizationContext.Provider value={{ language, setLanguage, t, timezone, updateUserSettings }}>
      {children}
    </LocalizationContext.Provider>
  );
};

// Хук для использования локализации
export const useLocalization = () => {
  const context = useContext(LocalizationContext);
  if (context === undefined) {
    throw new Error('useLocalization must be used within a LocalizationProvider');
  }
  return context;
}; 