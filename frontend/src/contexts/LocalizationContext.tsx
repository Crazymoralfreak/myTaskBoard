import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { userService } from '../services/userService';

// Импорты переводов
import ruTranslations from '../locales/ru';
import enTranslations from '../locales/en';

// Типы
export type SupportedLanguage = 'ru' | 'en';

interface LocalizationContextType {
  language: SupportedLanguage;
  setLanguage: (language: SupportedLanguage) => void;
  t: (key: string) => string;
}

// Все переводы
const translations = {
  ru: ruTranslations,
  en: enTranslations,
};

// Контекст
const LocalizationContext = createContext<LocalizationContextType | undefined>(undefined);

// Провайдер
interface LocalizationProviderProps {
  children: ReactNode;
  userSettings?: { language?: string };
}

export const AppLocalizationProvider: React.FC<LocalizationProviderProps> = ({ 
  children, 
  userSettings 
}) => {
  const [language, setLanguageState] = useState<SupportedLanguage>('ru');

  // Инициализация языка при монтировании
  useEffect(() => {
    const initLanguage = () => {
      // Приоритет: настройки пользователя -> localStorage -> браузер -> по умолчанию
      let initialLanguage: SupportedLanguage = 'ru';

      if (userSettings?.language) {
        // Из настроек пользователя
        initialLanguage = userSettings.language as SupportedLanguage;
      } else {
        // Из localStorage
        const savedLanguage = localStorage.getItem('language');
        if (savedLanguage && (savedLanguage === 'ru' || savedLanguage === 'en')) {
          initialLanguage = savedLanguage as SupportedLanguage;
        } else {
          // Из настроек браузера
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
    };

    initLanguage();
  }, [userSettings]);

  // Функция для поиска ключа без учета регистра
  const findKeyIgnoreCase = (obj: any, targetKey: string): string | undefined => {
    const keys = targetKey.split('.');
    let current = obj;

    for (const key of keys) {
      if (current && typeof current === 'object') {
        // Поиск точного совпадения
        if (current[key] !== undefined) {
          current = current[key];
          continue;
        }

        // Поиск без учета регистра
        const foundKey = Object.keys(current).find(k => 
          k.toLowerCase() === key.toLowerCase()
        );

        if (foundKey && current[foundKey] !== undefined) {
          current = current[foundKey];
          continue;
        }

        // Ключ не найден
        return undefined;
      }
      return undefined;
    }

    return typeof current === 'string' ? current : undefined;
  };

  // Функция перевода
  const t = (key: string): string => {
    const translation = findKeyIgnoreCase(translations[language], key);
    
    if (translation) {
      return translation;
    }

    // Fallback на английский
    if (language !== 'en') {
      const fallback = findKeyIgnoreCase(translations.en, key);
      if (fallback) {
        console.warn(`Translation missing for key "${key}" in language "${language}", using English fallback`);
        return fallback;
      }
    }

    console.warn(`Translation missing for key "${key}" in language "${language}"`);
    return `[${key}]`; // Показываем ключ в квадратных скобках
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

  return (
    <LocalizationContext.Provider value={{ language, setLanguage, t }}>
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