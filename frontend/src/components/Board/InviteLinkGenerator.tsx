import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  CircularProgress,
  Stack,
  Typography,
  Grid,
  Checkbox,
  FormControlLabel,
  Alert
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { ru } from 'date-fns/locale';
import { format, addDays } from 'date-fns';
import { Role } from '../../types/Role';
import { CreateInviteLinkRequest } from '../../types/inviteLink';
import { InviteLinkService } from '../../services/InviteLinkService';
import { useLocalization } from '../../hooks/useLocalization';
import { getRoleDisplayName, getRoleDescription } from '../../utils/roleUtils';

interface InviteLinkGeneratorProps {
  boardId: string;
  roles: Role[];
  onSuccess: () => void;
}

/**
 * Компонент для генерации ссылок-приглашений
 */
const InviteLinkGenerator: React.FC<InviteLinkGeneratorProps> = ({ 
  boardId, 
  roles,
  onSuccess
}) => {
  const [defaultRoleId, setDefaultRoleId] = useState<number | ''>('');
  const [maxUses, setMaxUses] = useState<number | null>(null);
  const [useMaxUses, setUseMaxUses] = useState<boolean>(false);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [useExpiration, setUseExpiration] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const { t } = useLocalization();
  
  // Устанавливаем роль VIEWER по умолчанию при монтировании компонента
  useEffect(() => {
    const viewerRole = roles.find(role => role.name === 'VIEWER');
    if (viewerRole) {
      setDefaultRoleId(viewerRole.id);
    } else if (roles.length > 0) {
      setDefaultRoleId(roles[0].id);
    }
  }, [roles]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!defaultRoleId) {
      setError('Выберите роль для приглашаемых пользователей');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const request: CreateInviteLinkRequest = {
        defaultRoleId: defaultRoleId as number
      };
      
      if (useMaxUses && maxUses) {
        request.maxUses = maxUses;
      }
      
      if (useExpiration && expiresAt) {
        request.expiresAt = expiresAt.toISOString();
      }
      
      await InviteLinkService.createInviteLink(boardId, request);
      
      // Сбрасываем форму
      setMaxUses(null);
      setUseMaxUses(false);
      setExpiresAt(null);
      setUseExpiration(false);
      
      // Вызываем callback для обновления списка ссылок
      onSuccess();
    } catch (err) {
      console.error('Error creating invite link:', err);
      setError('Не удалось создать ссылку-приглашение. Пожалуйста, попробуйте еще раз.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
      <Typography variant="h6" gutterBottom>
        Создать новую ссылку-приглашение
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <FormControl fullWidth required size="small">
            <InputLabel id="default-role-label">Роль по умолчанию</InputLabel>
            <Select
              labelId="default-role-label"
              id="default-role"
              value={defaultRoleId}
              label="Роль по умолчанию"
              onChange={(e) => setDefaultRoleId(e.target.value as number)}
              disabled={loading}
            >
              {roles.map((role) => (
                <MenuItem key={role.id} value={role.id}>
                  {getRoleDisplayName(role.name, t)} - {getRoleDescription(role.name, t)}
                </MenuItem>
              ))}
            </Select>
            <FormHelperText>
              Роль, которая будет назначена приглашенным пользователям
            </FormHelperText>
          </FormControl>
        </Grid>
        
        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Checkbox
                checked={useMaxUses}
                onChange={(e) => setUseMaxUses(e.target.checked)}
                disabled={loading}
              />
            }
            label="Ограничить количество использований"
          />
          
          {useMaxUses && (
            <TextField
              type="number"
              label="Максимальное количество использований"
              value={maxUses === null ? '' : maxUses}
              onChange={(e) => setMaxUses(parseInt(e.target.value) || null)}
              fullWidth
              size="small"
              disabled={loading}
              inputProps={{ min: 1 }}
              sx={{ mt: 1 }}
            />
          )}
        </Grid>
        
        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Checkbox
                checked={useExpiration}
                onChange={(e) => {
                  setUseExpiration(e.target.checked);
                  if (e.target.checked && !expiresAt) {
                    // Устанавливаем срок действия по умолчанию: 7 дней
                    setExpiresAt(addDays(new Date(), 7));
                  }
                }}
                disabled={loading}
              />
            }
            label="Установить срок действия"
          />
          
          {useExpiration && (
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ru}>
              <DateTimePicker
                label="Срок действия"
                value={expiresAt}
                onChange={(newValue) => setExpiresAt(newValue)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: "small",
                    sx: { mt: 1 },
                    disabled: loading
                  }
                }}
                minDateTime={new Date()}
              />
            </LocalizationProvider>
          )}
        </Grid>
      </Grid>
      
      <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 3 }}>
        <Button
          type="submit"
          variant="contained"
          color="primary"
          disabled={loading || !defaultRoleId}
          startIcon={loading && <CircularProgress size={20} />}
        >
          Создать ссылку
        </Button>
      </Stack>
    </Box>
  );
};

export default InviteLinkGenerator; 