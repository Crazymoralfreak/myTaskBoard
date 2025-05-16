import React, { useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  CircularProgress,
  Alert,
  Stack,
  Typography,
  Paper,
  Divider,
  Tooltip,
  Chip,
  Fade,
  SelectChangeEvent,
  Avatar,
  IconButton
} from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Close';
import { Role } from '../../types/Role';
import { AddBoardMemberRequest } from '../../types/BoardMember';
import UserSearch from './UserSearch';
import { User } from '../../types/user';

interface InviteFormProps {
  boardId: string;
  roles: Role[];
  onInvite: (request: AddBoardMemberRequest) => Promise<boolean>;
}

/**
 * Форма для приглашения пользователей на доску
 */
const InviteForm: React.FC<InviteFormProps> = ({ boardId, roles, onInvite }) => {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedRoleId, setSelectedRoleId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [addedUser, setAddedUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedUser || !selectedRoleId) {
      setError('Пожалуйста, заполните все поля');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const request: AddBoardMemberRequest = {
        userId: Number(selectedUser.id),
        roleId: Number(selectedRoleId)
      };
      
      // Сохраняем выбранного пользователя и роль перед сбросом формы
      setAddedUser({...selectedUser});
      
      // Находим выбранную роль по ID
      const role = roles.find(r => r.id.toString() === selectedRoleId);
      setSelectedRole(role || null);
      
      const success = await onInvite(request);
      
      if (success) {
        setSuccess(true);
        setSelectedUser(null);
        setSelectedRoleId('');
        
        // Сбрасываем сообщение об успехе через 5 секунд
        setTimeout(() => {
          setSuccess(false);
          setAddedUser(null);
          setSelectedRole(null);
        }, 5000);
      }
    } catch (err) {
      console.error('Ошибка при приглашении пользователя:', err);
      setError('Не удалось пригласить пользователя. Пожалуйста, попробуйте еще раз.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleRoleChange = (event: SelectChangeEvent) => {
    setSelectedRoleId(event.target.value);
  };
  
  return (
    <Paper elevation={0} variant="outlined" sx={{ p: 3 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} variant="filled">
          {error}
        </Alert>
      )}
      
      {success && addedUser && (
        <Fade in={success}>
          <Alert 
            icon={<CheckCircleIcon fontSize="inherit" />}
            severity="success" 
            sx={{ mb: 3 }} 
            variant="filled"
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography fontWeight="medium">
                Пользователь успешно добавлен на доску
              </Typography>
            </Box>
            <Box sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
              <Avatar
                src={addedUser.avatarUrl}
                alt={addedUser.username}
                sx={{ width: 24, height: 24, mr: 1 }}
              >
                {addedUser.username?.charAt(0)?.toUpperCase() || 'U'}
              </Avatar>
              <Typography variant="body2">
                {addedUser.displayName || addedUser.username} 
                {selectedRole && <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                  с ролью "{selectedRole.name}"
                </Typography>}
              </Typography>
            </Box>
          </Alert>
        </Fade>
      )}
      
      <Box mb={3}>
        <Box display="flex" alignItems="center" mb={1}>
          <Typography variant="h6" component="h2">
            Добавление нового участника
          </Typography>
          <Tooltip title="Добавленные пользователи получат доступ к доске в соответствии с выбранной ролью">
            <InfoOutlinedIcon fontSize="small" color="action" sx={{ ml: 1 }} />
          </Tooltip>
        </Box>
        <Typography variant="body2" color="text.secondary">
          Поиск пользователя по имени или email и назначение ему соответствующей роли на доске
        </Typography>
      </Box>
      
      <Divider sx={{ mb: 3 }} />
      
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Stack spacing={3}>
          <UserSearch
            label="Найти пользователя"
            placeholder="Введите имя пользователя или email"
            value={selectedUser}
            onChange={setSelectedUser}
            disabled={loading}
          />
          
          {selectedUser && (
            <Paper variant="outlined" sx={{ p: 2, bgcolor: 'action.hover' }}>
              <Typography variant="subtitle2" gutterBottom>
                Выбранный пользователь:
              </Typography>
              <Box display="flex" alignItems="center">
                <Avatar
                  src={selectedUser.avatarUrl}
                  alt={selectedUser.username}
                  sx={{ width: 32, height: 32, mr: 1.5 }}
                >
                  {selectedUser.username?.charAt(0)?.toUpperCase() || 'U'}
                </Avatar>
                <Box>
                  <Typography variant="body1">
                    {selectedUser.displayName || selectedUser.username}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedUser.email}
                  </Typography>
                </Box>
                <IconButton 
                  size="small" 
                  color="error" 
                  onClick={() => setSelectedUser(null)}
                  sx={{ ml: 'auto' }}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Box>
            </Paper>
          )}
          
          <FormControl fullWidth required disabled={loading}>
            <InputLabel id="role-select-label">Роль на доске</InputLabel>
            <Select
              labelId="role-select-label"
              id="role-select"
              value={selectedRoleId}
              label="Роль на доске"
              onChange={handleRoleChange}
            >
              {roles.map((role) => (
                <MenuItem key={role.id} value={role.id.toString()}>
                  <Box>
                    <Typography variant="body1">
                      {role.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {role.description}
                    </Typography>
                  </Box>
                </MenuItem>
              ))}
            </Select>
            <FormHelperText>
              Роль определяет, какие действия участник может выполнять на доске
            </FormHelperText>
          </FormControl>
          
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={loading || !selectedUser || !selectedRoleId}
            startIcon={loading ? <CircularProgress size={20} /> : <PersonAddIcon />}
            size="large"
            sx={{ mt: 2 }}
          >
            {loading ? 'Добавление...' : 'Добавить участника'}
          </Button>
        </Stack>
      </Box>
    </Paper>
  );
};

export default InviteForm; 