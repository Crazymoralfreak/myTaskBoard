import React, { useEffect, useState } from 'react';
import { Role } from '../../types/Role';
import { RolesService } from '../../services/RolesService';
import { MenuItem, Select, FormControl, InputLabel, SelectChangeEvent } from '@mui/material';

interface RoleSelectorProps {
  boardId: string;
  value: number;
  onChange: (roleId: number) => void;
  disabled?: boolean;
}

/**
 * Компонент для выбора роли пользователя
 */
const RoleSelector: React.FC<RoleSelectorProps> = ({ boardId, value, onChange, disabled = false }) => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
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
        setError('Не удалось загрузить роли. Пожалуйста, попробуйте еще раз.');
      } finally {
        setLoading(false);
      }
    };
    
    loadRoles();
  }, [boardId]);
  
  const handleChange = (event: SelectChangeEvent<number>) => {
    onChange(event.target.value as number);
  };
  
  return (
    <FormControl fullWidth disabled={disabled || loading}>
      <InputLabel id="role-select-label">Роль</InputLabel>
      <Select
        labelId="role-select-label"
        id="role-select"
        value={value}
        label="Роль"
        onChange={handleChange}
      >
        {roles.map((role) => (
          <MenuItem key={role.id} value={role.id}>
            {role.name} - {role.description}
          </MenuItem>
        ))}
      </Select>
      {error && <div className="error-message">{error}</div>}
    </FormControl>
  );
};

export default RoleSelector; 