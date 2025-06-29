import React from 'react';
import { MenuItem, Select, FormControl, InputLabel } from '@mui/material';
import { useLocalization } from '../../../hooks/useLocalization';
import { SUPPORTED_TIMEZONES } from '../../../utils/constants';
import ruCities from '../../../locales/ru/city.json';
import enCities from '../../../locales/en/city.json';

interface Props {
  value: string;
  onChange: (tz: string) => void;
  disabled?: boolean;
}

// Утилита для получения перевода города
const tCity = (timezone: string, language: string) => {
  if (language === 'ru') return (ruCities as Record<string, string>)[timezone] || timezone;
  return (enCities as Record<string, string>)[timezone] || timezone;
};

const TimezoneSelector: React.FC<Props> = ({ value, onChange, disabled }) => {
  const { t, language } = useLocalization();

  return (
    <FormControl fullWidth>
      <InputLabel>{t('selectTimezone')}</InputLabel>
      <Select
        value={value}
        label={t('selectTimezone')}
        onChange={e => onChange(e.target.value as string)}
        disabled={disabled}
      >
        {SUPPORTED_TIMEZONES.map(tz => (
          <MenuItem key={tz.value} value={tz.value}>
            {`${tz.label} — ${tCity(tz.value, language)} (${tz.value})`}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default TimezoneSelector; 