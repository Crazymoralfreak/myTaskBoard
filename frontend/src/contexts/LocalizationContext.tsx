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