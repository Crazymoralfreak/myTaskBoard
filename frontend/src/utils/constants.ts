export const SUPPORTED_LANGUAGES = [
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
] as const;

export const SUPPORTED_TIMEZONES = [
  { value: 'Europe/Kaliningrad', label: 'UTC+2', offset: '+02:00' },
  { value: 'Europe/Moscow', label: 'UTC+3', offset: '+03:00' },
  { value: 'Europe/Samara', label: 'UTC+4', offset: '+04:00' },
  { value: 'Asia/Yekaterinburg', label: 'UTC+5', offset: '+05:00' },
  { value: 'Asia/Novosibirsk', label: 'UTC+7', offset: '+07:00' },
  { value: 'Asia/Irkutsk', label: 'UTC+8', offset: '+08:00' },
  { value: 'Asia/Yakutsk', label: 'UTC+9', offset: '+09:00' },
  { value: 'Asia/Vladivostok', label: 'UTC+10', offset: '+10:00' },
  { value: 'Asia/Magadan', label: 'UTC+11', offset: '+11:00' },
  { value: 'Asia/Kamchatka', label: 'UTC+12', offset: '+12:00' },
  { value: 'UTC', label: 'UTC+0', offset: '+00:00' },
  { value: 'Europe/London', label: 'UTC+0/+1', offset: '+00:00' },
  { value: 'Europe/Berlin', label: 'UTC+1/+2', offset: '+01:00' },
  { value: 'Europe/Kiev', label: 'UTC+2/+3', offset: '+02:00' },
  { value: 'Asia/Dubai', label: 'UTC+4', offset: '+04:00' },
  { value: 'Asia/Karachi', label: 'UTC+5', offset: '+05:00' },
  { value: 'Asia/Dhaka', label: 'UTC+6', offset: '+06:00' },
  { value: 'Asia/Bangkok', label: 'UTC+7', offset: '+07:00' },
  { value: 'Asia/Shanghai', label: 'UTC+8', offset: '+08:00' },
  { value: 'Asia/Tokyo', label: 'UTC+9', offset: '+09:00' },
  { value: 'Australia/Sydney', label: 'UTC+10/+11', offset: '+10:00' },
  { value: 'Pacific/Auckland', label: 'UTC+12/+13', offset: '+12:00' },
  { value: 'America/New_York', label: 'UTC-5/-4', offset: '-05:00' },
  { value: 'America/Chicago', label: 'UTC-6/-5', offset: '-06:00' },
  { value: 'America/Denver', label: 'UTC-7/-6', offset: '-07:00' },
  { value: 'America/Los_Angeles', label: 'UTC-8/-7', offset: '-08:00' },
  { value: 'America/Sao_Paulo', label: 'UTC-3', offset: '-03:00' },
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