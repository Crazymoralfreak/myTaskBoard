export const SUPPORTED_LANGUAGES = [
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
  { code: 'pt', name: 'Português', flag: '🇧🇷' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
] as const;

export const SUPPORTED_TIMEZONES = [
  // Основные часовые пояса России и СНГ
  { value: 'Europe/Kaliningrad', label: 'UTC+2 Калининград', offset: '+02:00' },
  { value: 'Europe/Moscow', label: 'UTC+3 Москва', offset: '+03:00' },
  { value: 'Europe/Samara', label: 'UTC+4 Самара', offset: '+04:00' },
  { value: 'Asia/Yekaterinburg', label: 'UTC+5 Екатеринбург', offset: '+05:00' },
  { value: 'Asia/Novosibirsk', label: 'UTC+7 Новосибирск', offset: '+07:00' },
  { value: 'Asia/Irkutsk', label: 'UTC+8 Иркутск', offset: '+08:00' },
  { value: 'Asia/Yakutsk', label: 'UTC+9 Якутск', offset: '+09:00' },
  { value: 'Asia/Vladivostok', label: 'UTC+10 Владивосток', offset: '+10:00' },
  { value: 'Asia/Magadan', label: 'UTC+11 Магадан', offset: '+11:00' },
  { value: 'Asia/Kamchatka', label: 'UTC+12 Камчатка', offset: '+12:00' },
  
  // Популярные международные часовые пояса
  { value: 'UTC', label: 'UTC+0 Всемирное время', offset: '+00:00' },
  { value: 'Europe/London', label: 'UTC+0/+1 Лондон', offset: '+00:00' },
  { value: 'Europe/Berlin', label: 'UTC+1/+2 Берлин', offset: '+01:00' },
  { value: 'Europe/Kiev', label: 'UTC+2/+3 Киев', offset: '+02:00' },
  { value: 'Asia/Dubai', label: 'UTC+4 Дубай', offset: '+04:00' },
  { value: 'Asia/Karachi', label: 'UTC+5 Карачи', offset: '+05:00' },
  { value: 'Asia/Dhaka', label: 'UTC+6 Дакка', offset: '+06:00' },
  { value: 'Asia/Bangkok', label: 'UTC+7 Бангкок', offset: '+07:00' },
  { value: 'Asia/Shanghai', label: 'UTC+8 Шанхай', offset: '+08:00' },
  { value: 'Asia/Tokyo', label: 'UTC+9 Токио', offset: '+09:00' },
  { value: 'Australia/Sydney', label: 'UTC+10/+11 Сидней', offset: '+10:00' },
  { value: 'Pacific/Auckland', label: 'UTC+12/+13 Окленд', offset: '+12:00' },
  { value: 'America/New_York', label: 'UTC-5/-4 Нью-Йорк', offset: '-05:00' },
  { value: 'America/Chicago', label: 'UTC-6/-5 Чикаго', offset: '-06:00' },
  { value: 'America/Denver', label: 'UTC-7/-6 Денвер', offset: '-07:00' },
  { value: 'America/Los_Angeles', label: 'UTC-8/-7 Лос-Анджелес', offset: '-08:00' },
  { value: 'America/Sao_Paulo', label: 'UTC-3 Сан-Паулу', offset: '-03:00' },
] as const;

// Функция для получения текущей таймзоны пользователя
export const getUserTimezone = (): string => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return 'UTC'; // Fallback
  }
};

// Функция для получения предпочитаемого языка пользователя
export const getUserLanguage = (): string => {
  try {
    const lang = navigator.language.substring(0, 2);
    const supportedLanguageCodes = SUPPORTED_LANGUAGES.map(l => l.code);
    return supportedLanguageCodes.includes(lang as any) ? lang : 'en';
  } catch {
    return 'en'; // Fallback
  }
}; 