import React, { useState, useEffect } from 'react';
import { Autocomplete, TextField, CircularProgress, Avatar, Box, Typography } from '@mui/material';
import { User } from '../../types/user';
import { UserSearchService } from '../../services/UserSearchService';
import { useLocalization } from '../../hooks/useLocalization';
import debounce from 'lodash/debounce';

interface UserSearchProps {
  label?: string;
  placeholder?: string;
  onChange: (user: User | null) => void;
  value: User | null;
  disabled?: boolean;
}

/**
 * Компонент для поиска пользователей с автодополнением
 */
const UserSearch: React.FC<UserSearchProps> = ({
  label,
  placeholder,
  onChange,
  value,
  disabled = false
}) => {
  const { t } = useLocalization();
  const [inputValue, setInputValue] = useState<string>('');
  const [options, setOptions] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  
  // Функция поиска с debounce для уменьшения количества запросов
  const searchUsers = debounce(async (query: string) => {
    if (!query || query.length < 2) {
      setOptions([]);
      return;
    }
    
    try {
      setLoading(true);
      const results = await UserSearchService.searchUsers(query);
      setOptions(results);
    } catch (error) {
      console.error('Ошибка при поиске пользователей:', error);
      setOptions([]);
    } finally {
      setLoading(false);
    }
  }, 500);
  
  useEffect(() => {
    searchUsers(inputValue);
    
    // Очистка debounce при размонтировании
    return () => {
      searchUsers.cancel();
    };
  }, [inputValue]);
  
  return (
    <Autocomplete
      id="user-search"
      options={options}
      getOptionLabel={(option) => `${option.username} (${option.email})`}
      value={value}
      onChange={(_, newValue) => {
        onChange(newValue);
      }}
      inputValue={inputValue}
      onInputChange={(_, newInputValue) => {
        setInputValue(newInputValue);
      }}
      isOptionEqualToValue={(option, value) => option.id === value.id}
      disabled={disabled}
      loading={loading}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label || t('userSearchLabel')}
          placeholder={placeholder || t('userSearchPlaceholder')}
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {loading ? <CircularProgress color="inherit" size={20} /> : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
      renderOption={(props, option) => (
        <Box component="li" {...props} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar src={option.avatarUrl} alt={option.username} sx={{ width: 32, height: 32 }} />
          <Box>
            <Typography variant="body1">{option.username}</Typography>
            <Typography variant="body2" color="text.secondary">{option.email}</Typography>
          </Box>
        </Box>
      )}
      noOptionsText={t('userSearchNoResults')}
      loadingText={t('userSearchLoading')}
    />
  );
};

export default UserSearch; 