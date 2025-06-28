import React from 'react';
import TimezoneSelect from 'react-timezone-select';

interface Props {
  value: string;
  onChange: (tz: string) => void;
  disabled?: boolean;
}

const TimezoneSelector: React.FC<Props> = ({ value, onChange, disabled }) => {
  return (
    <TimezoneSelect
      value={value}
      onChange={(tz) => {
        if (typeof tz === 'string') {
          onChange(tz);
        } else if (tz && typeof tz === 'object' && 'value' in tz) {
          onChange(tz.value);
        }
      }}
      labelStyle="original"
      displayValue="GMT"
      isDisabled={disabled}
    />
  );
};

export default TimezoneSelector; 