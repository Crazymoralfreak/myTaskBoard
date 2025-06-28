import React, { useEffect, useState } from 'react';
import { Role, SystemRoles } from '../../types/Role';
import { RolesService } from '../../services/RolesService';
import { useLocalization } from '../../hooks/useLocalization';
import { getRoleDisplayName, getRoleDescription } from '../../utils/roleUtils';
import { 
  MenuItem, 
  Select, 
  FormControl, 
  InputLabel, 
  SelectChangeEvent, 
  useTheme,
  Box,
  Typography,
  CircularProgress,
  Alert
} from '@mui/material';

interface RoleSelectorProps {
  boardId: string;
  value: number;
  onChange: (roleId: number) => void;
  disabled?: boolean;
}

/**
 * Возвращает цвет для роли с учетом текущей темы
 * @param roleName имя роли
 * @param isDarkMode флаг темной темы
 * @returns цвет для отображения
 */
const getRoleColor = (roleName: string, isDarkMode: boolean): string => {
  switch (roleName) {
    case SystemRoles.ADMIN:
      return isDarkMode ? '#ff6b6b' : '#d32f2f'; // Красный
    case SystemRoles.EDITOR:
      return isDarkMode ? '#64b5f6' : '#1976d2'; // Синий
    case SystemRoles.VIEWER:
      return isDarkMode ? '#81c784' : '#388e3c'; // Зеленый
    default:
      return isDarkMode ? '#bdbdbd' : '#757575'; // Серый
  }
};

/**
 * Компонент для выбора роли пользователя
 */
const RoleSelector: React.FC<RoleSelectorProps> = ({ boardId, value, onChange, disabled = false }) => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const theme = useTheme();
  const { t } = useLocalization();
  const isDarkMode = theme.palette.mode === 'dark';
  
  useEffect(() => {
    const loadRoles = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Загружаем роли для доски
        const boardRoles = await RolesService.getBoardRoles(boardId);
        setRoles(boardRoles);
      } catch (err) {
        console.error('Ошибка при загрузке ролей:', err);
        setError(t('errorLoadData'));
      } finally {
        setLoading(false);
      }
    };
    
    loadRoles();
  }, [boardId, t]);
  
  const handleChange = (event: SelectChangeEvent<number>) => {
    onChange(event.target.value as number);
  };
  
  if (loading) {
    return <CircularProgress size={24} />;
  }
  
  if (error) {
    return <Alert severity="error" sx={{ mt: 1 }}>{error}</Alert>;
  }
  
  return (
    <FormControl fullWidth disabled={disabled}>
      <InputLabel id="role-select-label">{t('role')}</InputLabel>
      <Select
        labelId="role-select-label"
        id="role-select"
        value={value}
        label={t('role')}
        onChange={handleChange}
      >
        {roles.map((role) => {
          const roleColor = getRoleColor(role.name, isDarkMode);
          const roleDescription = getRoleDescription(role.name, t);
          const roleDisplayName = getRoleDisplayName(role.name, t);
          return (
            <MenuItem key={role.id} value={role.id}>
              <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                <Typography sx={{ fontWeight: 'bold', color: roleColor }}>
                  {roleDisplayName}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {roleDescription}
                </Typography>
              </Box>
            </MenuItem>
          );
        })}
      </Select>
    </FormControl>
  );
};

export default RoleSelector; 