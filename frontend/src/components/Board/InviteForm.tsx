import React, { useState, useEffect, useCallback } from 'react';
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
  IconButton,
  Tabs,
  Tab,
  TextField,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Collapse,
  InputAdornment,
  Zoom
} from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Close';
import EmailIcon from '@mui/icons-material/Email';
import LinkIcon from '@mui/icons-material/Link';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import SearchIcon from '@mui/icons-material/Search';
import HistoryIcon from '@mui/icons-material/History';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import PersonIcon from '@mui/icons-material/Person';
import { Role, SystemRoles } from '../../types/Role';
import { AddBoardMemberRequest } from '../../types/BoardMember';
import UserSearch from './UserSearch';
import { User } from '../../types/user';
import { debounce } from 'lodash';

// Внешний URL сайта из переменных окружения
const OUTER_URL = process.env.OUTER_URL || 'mytaskboard.online';

// Вспомогательные функции для формирования URL
const getBaseUrl = () => {
  return `https://${OUTER_URL}`;
};

const getInviteUrl = (token: string) => {
  return `${getBaseUrl()}/invite/${token}`;
};

interface InviteFormProps {
  boardId: string;
  roles: Role[];
  onInvite: (request: AddBoardMemberRequest) => Promise<boolean>;
}

// Максимальное количество сохраняемых недавно приглашенных пользователей
const MAX_RECENT_USERS = 3;

// Локальное хранилище для недавно приглашенных пользователей
const STORAGE_KEY = 'recentInvitedUsers';

// Тип приглашения
enum InviteMethod {
  USER_SEARCH = 0,
  LINK = 1
}

// Иконки для методов приглашения
const inviteMethodIcons = [
  <PersonIcon />,
  <LinkIcon />
];

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
  const [inviteMethod, setInviteMethod] = useState<InviteMethod>(InviteMethod.USER_SEARCH);
  const [showRecentUsers, setShowRecentUsers] = useState<boolean>(false);
  const [recentUsers, setRecentUsers] = useState<User[]>([]);
  
  // Загружаем недавно приглашенных пользователей при монтировании
  useEffect(() => {
    try {
      const storedUsers = localStorage.getItem(STORAGE_KEY);
      if (storedUsers) {
        setRecentUsers(JSON.parse(storedUsers));
      }
    } catch (err) {
      console.error('Ошибка при загрузке недавно приглашенных пользователей:', err);
    }
  }, []);
  
  // Сохраняем недавно приглашенного пользователя
  const saveRecentUser = (user: User) => {
    const updatedRecentUsers = [user, ...recentUsers.filter(u => u.id !== user.id)].slice(0, MAX_RECENT_USERS);
    setRecentUsers(updatedRecentUsers);
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedRecentUsers));
    } catch (err) {
      console.error('Ошибка при сохранении недавно приглашенных пользователей:', err);
    }
  };
  
  // Устанавливаем роль по умолчанию (VIEWER)
  useEffect(() => {
    if (roles && roles.length > 0) {
      const viewerRole = roles.find(role => role.name.toUpperCase() === SystemRoles.VIEWER);
      if (viewerRole) {
        setSelectedRoleId(viewerRole.id.toString());
      } else if (roles[0]) {
        setSelectedRoleId(roles[0].id.toString());
      }
    }
  }, [roles]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Проверка в зависимости от метода приглашения
    if (inviteMethod === InviteMethod.USER_SEARCH && !selectedUser) {
      setError('Пожалуйста, выберите пользователя для приглашения');
      return;
    }
    
    if (!selectedRoleId) {
      setError('Пожалуйста, выберите роль для пользователя');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      if (inviteMethod === InviteMethod.USER_SEARCH && selectedUser) {
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
          saveRecentUser(selectedUser); // Сохраняем в недавно приглашенных
          setSelectedUser(null);
          
          // Сбрасываем сообщение об успехе через 5 секунд
          setTimeout(() => {
            setSuccess(false);
            setAddedUser(null);
            setSelectedRole(null);
          }, 5000);
        }
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
  
  const handleSelectRecentUser = (user: User) => {
    setSelectedUser(user);
    setShowRecentUsers(false);
  };
  
  // Получаем цвет для роли
  const getRoleColor = (role: Role): string => {
    switch (role.name.toUpperCase()) {
      case SystemRoles.ADMIN:
        return '#ffebee'; // Светло-красный
      case SystemRoles.EDITOR:
        return '#e3f2fd'; // Светло-синий
      case SystemRoles.VIEWER:
        return '#e8f5e9'; // Светло-зеленый
      default:
        return '#f5f5f5'; // Светло-серый
    }
  };
  
  // Получаем иконку для роли
  const getRoleIcon = (role: Role) => {
    switch (role.name.toUpperCase()) {
      case SystemRoles.ADMIN:
        return <AdminPanelSettingsIcon />;
      case SystemRoles.EDITOR:
        return <EditIcon />;
      case SystemRoles.VIEWER:
        return <VisibilityIcon />;
      default:
        return <InfoOutlinedIcon />;
    }
  };
  
  // Получаем список прав для роли
  const getRolePermissions = (role: Role): { can: string[], cannot: string[] } => {
    const permissions: { can: string[], cannot: string[] } = {
      can: [],
      cannot: []
    };
    
    switch (role.name.toUpperCase()) {
      case SystemRoles.ADMIN:
        permissions.can = [
          'Просматривать доску',
          'Редактировать задачи',
          'Добавлять/удалять участников',
          'Управлять настройками доски',
          'Удалять доску'
        ];
        permissions.cannot = [];
        break;
      case SystemRoles.EDITOR:
        permissions.can = [
          'Просматривать доску',
          'Редактировать задачи',
          'Добавлять комментарии'
        ];
        permissions.cannot = [
          'Добавлять/удалять участников',
          'Создавать и редактировать колонки',
          'Изменять настройки доски',
          'Удалять доску'
        ];
        break;
      case SystemRoles.VIEWER:
        permissions.can = [
          'Просматривать доску',
          'Просматривать задачи',
          'Читать комментарии'
        ];
        permissions.cannot = [
          'Редактировать задачи',
          'Добавлять комментарии',
          'Добавлять/удалять участников',
          'Изменять настройки доски'
        ];
        break;
      default:
        permissions.can = ['Просматривать доску'];
        permissions.cannot = ['Редактировать доску', 'Управлять участниками'];
    }
    
    return permissions;
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
          Выберите пользователя и назначьте ему соответствующую роль на доске
        </Typography>
      </Box>
      
      <Divider sx={{ mb: 3 }} />
      
      {/* Убираем вкладки для выбора способа приглашения */}
      {/* <Tabs 
        value={inviteMethod} 
        onChange={handleMethodChange} 
        variant="fullWidth"
        textColor="primary"
        indicatorColor="primary"
        sx={{ mb: 3 }}
      >
        <Tab 
          label="Найти пользователя" 
          icon={inviteMethodIcons[InviteMethod.USER_SEARCH]} 
          iconPosition="start"
        />
        <Tab 
          label="Создать ссылку" 
          icon={inviteMethodIcons[InviteMethod.LINK]} 
          iconPosition="start"
        />
      </Tabs> */}
      
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Stack spacing={3}>
          {/* Панель поиска пользователя */}
          {/* {inviteMethod === InviteMethod.USER_SEARCH && ( */}
            <>
              <Box sx={{ position: 'relative' }}>
                <UserSearch
                  label="Найти пользователя"
                  placeholder="Введите имя пользователя или email"
                  value={selectedUser}
                  onChange={setSelectedUser}
                  disabled={loading}
                />
                
                {recentUsers.length > 0 && (
                  <Box sx={{ mt: 1 }}>
                    <Button
                      size="small"
                      startIcon={<HistoryIcon />}
                      onClick={() => setShowRecentUsers(!showRecentUsers)}
                      color="inherit"
                    >
                      Недавно приглашенные
                    </Button>
                    
                    <Collapse in={showRecentUsers}>
                      <Paper variant="outlined" sx={{ mt: 1, maxHeight: 200, overflow: 'auto' }}>
                        <List dense disablePadding>
                          {recentUsers.map(user => (
                            <ListItem 
                              button 
                              key={user.id}
                              onClick={() => handleSelectRecentUser(user)}
                              divider
                            >
                              <ListItemAvatar>
                                <Avatar 
                                  src={user.avatarUrl} 
                                  alt={user.username}
                                  sx={{ width: 30, height: 30 }}
                                >
                                  {user.username?.charAt(0)?.toUpperCase() || 'U'}
                                </Avatar>
                              </ListItemAvatar>
                              <ListItemText 
                                primary={user.displayName || user.username}
                                secondary={user.email}
                                primaryTypographyProps={{ variant: 'body2' }}
                                secondaryTypographyProps={{ variant: 'caption' }}
                              />
                            </ListItem>
                          ))}
                        </List>
                      </Paper>
                    </Collapse>
                  </Box>
                )}
              </Box>
              
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
            </>
          {/* )} */}
          
          {/* Убираем форму создания ссылки-приглашения */}
          {/* {inviteMethod === InviteMethod.LINK && (
            <Box>
              {!generatedLink ? (
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Создайте ссылку-приглашение, которой можно поделиться с другими пользователями
                  </Typography>
                  <Button
                    variant="outlined"
                    startIcon={<LinkIcon />}
                    onClick={generateInviteLink}
                    disabled={loading || !selectedRoleId}
                    sx={{ minWidth: 200 }}
                  >
                    {loading ? 'Создание...' : 'Создать ссылку'}
                  </Button>
                </Box>
              ) : (
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Ссылка-приглашение создана:
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <TextField
                      fullWidth
                      value={generatedLink}
                      variant="outlined"
                      size="small"
                      InputProps={{
                        readOnly: true,
                        endAdornment: (
                          <InputAdornment position="end">
                            <Tooltip title={linkCopied ? "Скопировано!" : "Копировать ссылку"}>
                              <IconButton onClick={copyLinkToClipboard} edge="end" color={linkCopied ? "success" : "default"}>
                                <ContentCopyIcon />
                              </IconButton>
                            </Tooltip>
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    Срок действия ссылки: 7 дней или до 10 использований
                  </Typography>
                  <Button
                    variant="text"
                    size="small"
                    startIcon={<LinkIcon />}
                    onClick={generateInviteLink}
                    sx={{ mt: 1 }}
                  >
                    Создать новую ссылку
                  </Button>
                </Paper>
              )}
            </Box>
          )} */}
          
          {/* Выбор роли (общий для всех способов приглашения) */}
          <Typography variant="subtitle2" sx={{ mt: 2 }}>
            Выберите роль для приглашаемого участника:
          </Typography>
          
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            {roles.map(role => (
              <Paper
                key={role.id}
                variant="outlined"
                sx={{
                  p: 2,
                  flexGrow: 1,
                  flexBasis: { xs: '100%', sm: '45%', md: '30%' },
                  cursor: 'pointer',
                  borderColor: selectedRoleId === role.id.toString() ? 'primary.main' : 'divider',
                  borderWidth: selectedRoleId === role.id.toString() ? 2 : 1,
                  bgcolor: selectedRoleId === role.id.toString() ? getRoleColor(role) : 'background.paper',
                  transition: 'all 0.2s'
                }}
                onClick={() => setSelectedRoleId(role.id.toString())}
              >
                <Box sx={{ display: 'flex', mb: 1 }}>
                  <Box sx={{ color: 'primary.main', mr: 1 }}>
                    {getRoleIcon(role)}
                  </Box>
                  <Typography variant="subtitle1" fontWeight="medium">
                    {role.name}
                  </Typography>
                </Box>
                
                <Typography variant="body2" color="text.secondary" paragraph>
                  {role.description}
                </Typography>
                
                {selectedRoleId === role.id.toString() && (
                  <Fade in={true}>
                    <Box>
                      <Divider sx={{ my: 1 }} />
                      
                      {/* Права роли */}
                      <Box sx={{ mt: 1 }}>
                        {getRolePermissions(role).can.length > 0 && (
                          <Box sx={{ mb: 1 }}>
                            <Typography variant="caption" color="success.main" fontWeight="medium">
                              Может:
                            </Typography>
                            <Box component="ul" sx={{ mt: 0.5, pl: 2, mb: 0 }}>
                              {getRolePermissions(role).can.map((perm, i) => (
                                <Typography 
                                  key={i} 
                                  component="li" 
                                  variant="caption" 
                                  color="text.secondary"
                                >
                                  {perm}
                                </Typography>
                              ))}
                            </Box>
                          </Box>
                        )}
                        
                        {getRolePermissions(role).cannot.length > 0 && (
                          <Box>
                            <Typography variant="caption" color="error.main" fontWeight="medium">
                              Не может:
                            </Typography>
                            <Box component="ul" sx={{ mt: 0.5, pl: 2, mb: 0 }}>
                              {getRolePermissions(role).cannot.map((perm, i) => (
                                <Typography 
                                  key={i} 
                                  component="li" 
                                  variant="caption" 
                                  color="text.secondary"
                                >
                                  {perm}
                                </Typography>
                              ))}
                            </Box>
                          </Box>
                        )}
                      </Box>
                    </Box>
                  </Fade>
                )}
              </Paper>
            ))}
          </Box>
          
          {/* Кнопка отправки формы (только для поиска пользователя) */}
          {/* {inviteMethod === InviteMethod.USER_SEARCH && ( */}
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
          {/* )} */}
        </Stack>
      </Box>
    </Paper>
  );
};

export default InviteForm; 