import React from 'react';
import { MenuItem, Select, FormControl, InputLabel } from '@mui/material';
import { useLocalization } from '../../../hooks/useLocalization';
import { SUPPORTED_TIMEZONES } from '../../../utils/constants';

interface Props {
  value: string;
  onChange: (tz: string) => void;
  disabled?: boolean;
}

const TimezoneSelector: React.FC<Props> = ({ value, onChange, disabled }) => {
  const { t } = useLocalization();

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
            {`${tz.label} — ${tz.value.replace('_', ' ')}`}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default TimezoneSelector; 