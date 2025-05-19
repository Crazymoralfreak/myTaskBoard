import React from 'react';
import { Chip, Tooltip, useTheme } from '@mui/material';
import { Role, SystemRoles } from '../../types/Role';

interface RoleBadgeProps {
  role: Role;
  size?: 'small' | 'medium';
}

/**
 * Возвращает цвет для роли с учетом текущей темы
 * @param roleName имя роли
 * @param isDarkMode флаг темной темы
 * @returns цвет для отображения
 */
const getRoleColor = (roleName: string, isDarkMode: boolean): { bg: string, text: string } => {
  switch (roleName) {
    case SystemRoles.ADMIN:
      return isDarkMode 
        ? { bg: '#d32f2f33', text: '#ff6b6b' } // Более светлый красный для темной темы
        : { bg: '#d32f2f', text: '#ffffff' };  // Стандартный красный для светлой темы
    case SystemRoles.EDITOR:
      return isDarkMode 
        ? { bg: '#1976d233', text: '#64b5f6' } // Более светлый синий для темной темы
        : { bg: '#1976d2', text: '#ffffff' };  // Стандартный синий для светлой темы
    case SystemRoles.VIEWER:
      return isDarkMode 
        ? { bg: '#388e3c33', text: '#81c784' } // Более светлый зеленый для темной темы
        : { bg: '#388e3c', text: '#ffffff' };  // Стандартный зеленый для светлой темы
    default:
      return isDarkMode 
        ? { bg: '#75757533', text: '#bdbdbd' } // Более светлый серый для темной темы
        : { bg: '#757575', text: '#ffffff' };  // Стандартный серый для светлой темы
  }
};

/**
 * Компонент для отображения бейджа роли
 */
const RoleBadge: React.FC<RoleBadgeProps> = ({ role, size = 'medium' }) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const { bg, text } = getRoleColor(role.name, isDarkMode);
  
  return (
    <Tooltip title={role.description || role.name} arrow>
      <Chip
        label={role.name}
        size={size}
        sx={{
          backgroundColor: bg,
          color: text,
          fontWeight: 'bold',
          '&:hover': {
            backgroundColor: bg,
            opacity: 0.9
          }
        }}
      />
    </Tooltip>
  );
};

export default RoleBadge; 