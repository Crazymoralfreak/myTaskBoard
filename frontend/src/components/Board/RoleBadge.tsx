import React from 'react';
import { Chip, Tooltip } from '@mui/material';
import { Role, SystemRoles } from '../../types/Role';

interface RoleBadgeProps {
  role: Role;
  size?: 'small' | 'medium';
}

/**
 * Возвращает цвет для роли
 * @param roleName имя роли
 * @returns цвет для отображения
 */
const getRoleColor = (roleName: string): string => {
  switch (roleName) {
    case SystemRoles.ADMIN:
      return '#d32f2f'; // Красный
    case SystemRoles.EDITOR:
      return '#1976d2'; // Синий
    case SystemRoles.VIEWER:
      return '#388e3c'; // Зеленый
    default:
      return '#757575'; // Серый
  }
};

/**
 * Компонент для отображения бейджа роли
 */
const RoleBadge: React.FC<RoleBadgeProps> = ({ role, size = 'medium' }) => {
  const color = getRoleColor(role.name);
  
  return (
    <Tooltip title={role.description || role.name} arrow>
      <Chip
        label={role.name}
        size={size}
        sx={{
          backgroundColor: color,
          color: 'white',
          fontWeight: 'bold',
          '&:hover': {
            backgroundColor: color,
            opacity: 0.9
          }
        }}
      />
    </Tooltip>
  );
};

export default RoleBadge; 