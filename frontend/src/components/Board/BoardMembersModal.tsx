import React, { useState, useEffect } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Tab,
  Tabs,
  Box,
  Typography,
  Divider,
  CircularProgress,
  Alert,
  IconButton,
  TextField,
  InputAdornment,
  FormControl,
  Select,
  MenuItem,
  SelectChangeEvent,
  Tooltip,
  Chip,
  Badge,
  Skeleton,
  Fade,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  List,
  ListItemSecondaryAction,
} from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import CloseIcon from '@mui/icons-material/Close';
import InfoIcon from '@mui/icons-material/Info';
import EditIcon from '@mui/icons-material/Edit';
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { BoardMembersService } from '../../services/BoardMembersService';
import { BoardMember, AddBoardMemberRequest } from '../../types/BoardMember';
import { RolesService } from '../../services/RolesService';
import { Role, SystemRoles } from '../../types/Role';
import MembersList from './MembersList';
import InviteForm from './InviteForm';
import { useTokenRefresh } from '../../hooks/useTokenRefresh';
import { boardService } from '../../services/boardService';
import { useUserRole, Permission } from '../../hooks/useUserRole';
import { getAvatarUrl } from '../../utils/avatarUtils';

interface BoardMembersModalProps {
  open: boolean;
  onClose: () => void;
  boardId: string;
  currentUserId: number;
  ownerId?: number;
  isAdmin: boolean;
  currentUserRole?: string;
  currentUserRoleId?: number;
}

/**
 * Модальное окно для управления участниками доски
 */
const BoardMembersModal: React.FC<BoardMembersModalProps> = ({
  open,
  onClose,
  boardId,
  currentUserId,
  ownerId,
  isAdmin,
  currentUserRole,
  currentUserRoleId
}) => {
  const [activeTab, setActiveTab] = useState<number>(0);
  const [members, setMembers] = useState<BoardMember[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<BoardMember[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [boardName, setBoardName] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedMember, setSelectedMember] = useState<BoardMember | null>(null);
  const [showRoleSelector, setShowRoleSelector] = useState<boolean>(false);
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [changingRole, setChangingRole] = useState<boolean>(false);
  
  // Используем хук для обновления токена
  const { isRefreshing, error: tokenError } = useTokenRefresh(open);
  
  // Получаем доску для проверки ролей через хук
  const [boardData, setBoardData] = useState<any>(null);
  
  // Используем хук для проверки ролей
  const userRoles = useUserRole(boardData, currentUserId);
  
  // Обновляем состояние ошибки, если есть ошибка обновления токена
  useEffect(() => {
    if (tokenError) {
      setError(prev => prev || tokenError);
    }
  }, [tokenError]);
  
  useEffect(() => {
    if (open) {
      loadData();
      // Загружаем имя доски для отображения в заголовке
      loadBoardDetails();
    }
  }, [open, boardId]);
  
  const loadBoardDetails = async () => {
    try {
      const boardDetails = await boardService.getBoard(boardId);
      setBoardName(boardDetails.name);
      setBoardData(boardDetails);
    } catch (err) {
      console.error('Ошибка при загрузке информации о доске:', err);
      setError('Не удалось загрузить информацию о доске');
    }
  };
  
  // Получаем цвет для роли
  const getRoleColor = (roleName?: string): string => {
    if (!roleName) return '#E0E0E0';
    
    switch (roleName.toUpperCase()) {
      case SystemRoles.ADMIN:
        return '#ffe0e0'; // Светло-красный
      case SystemRoles.EDITOR:
        return '#e0f4ff'; // Светло-синий
      case SystemRoles.VIEWER:
        return '#e8f5e9'; // Светло-зеленый
      default:
        return '#f5f5f5'; // Светло-серый
    }
  };
  
  // Получаем иконку для роли
  const getRoleIcon = (roleName?: string) => {
    if (!roleName) return <InfoIcon fontSize="small" />;
    
    switch (roleName.toUpperCase()) {
      case SystemRoles.ADMIN:
        return <AdminPanelSettingsIcon fontSize="small" />;
      case SystemRoles.EDITOR:
        return <SupervisorAccountIcon fontSize="small" />;
      case SystemRoles.VIEWER:
        return <VisibilityIcon fontSize="small" />;
      default:
        return <InfoIcon fontSize="small" />;
    }
  };
  
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Загружаем данные для доски:', boardId);
      console.log('Текущий пользователь ID:', currentUserId);
      console.log('Владелец доски ID:', ownerId);
      
      // Загружаем участников доски
      const membersData = await BoardMembersService.getBoardMembers(boardId);
      console.log('Полученные участники доски:', membersData);
      setMembers(membersData);
      setFilteredMembers(membersData);
      
      // Загружаем роли для доски
      const rolesData = await RolesService.getBoardRoles(boardId);
      console.log('Полученные роли доски:', rolesData);
      setRoles(rolesData);
    } catch (err) {
      console.error('Ошибка при загрузке данных:', err);
      setError('Не удалось загрузить данные. Пожалуйста, попробуйте еще раз.');
    } finally {
      setLoading(false);
    }
  };
  
  // Обработчик начала изменения роли
  const handleStartChangeRole = (member: BoardMember) => {
    setSelectedMember(member);
    setSelectedRoleId(member.role?.id || null);
    setShowRoleSelector(true);
  };
  
  // Обработчик изменения роли
  const handleRoleChange = async () => {
    if (!selectedMember || !selectedRoleId) return;
    
    try {
      setChangingRole(true);
      console.log('Изменение роли для пользователя:', selectedMember.userId, 'на роль:', selectedRoleId);
      
      const request = {
        roleId: selectedRoleId
      };
      
      console.log('Отправляем запрос:', request);
      const updatedMember = await BoardMembersService.updateMemberRole(
        boardId, 
        selectedMember.userId, 
        request
      );
      
      console.log('Получен ответ от сервера:', updatedMember);
      
      // Если нужно, исправляем роль вручную
      if (!updatedMember.role || updatedMember.role.id !== selectedRoleId) {
        const selectedRole = roles.find(r => r.id === selectedRoleId);
        if (selectedRole) {
          updatedMember.role = selectedRole;
        }
      }
      
      // Обновляем список участников
      handleMemberRoleChanged(updatedMember);
      
      // Показываем уведомление и скрываем селектор ролей
      const roleName = updatedMember.role?.name || 'новая роль';
      const userName = updatedMember.displayName || updatedMember.username;
      setSuccessMessage(`Роль пользователя ${userName} успешно изменена на "${roleName}"`);
      setShowRoleSelector(false);
      
      // Очищаем сообщение через 5 секунд
      setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
    } catch (err) {
      console.error('Ошибка при обновлении роли участника:', err);
      setError(`Не удалось обновить роль: ${err instanceof Error ? err.message : 'неизвестная ошибка'}`);
    } finally {
      setChangingRole(false);
    }
  };
  
  // Фильтрация участников при изменении поискового запроса или фильтра по роли
  useEffect(() => {
    if (!members.length) return;
    
    let filtered = [...members];
    
    // Фильтр по поисковому запросу
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(member => 
        member.username.toLowerCase().includes(query) || 
        member.email.toLowerCase().includes(query) ||
        (member.displayName && member.displayName.toLowerCase().includes(query))
      );
    }
    
    // Фильтр по роли
    if (roleFilter) {
      filtered = filtered.filter(member => 
        member.role && member.role.id.toString() === roleFilter
      );
    }
    
    setFilteredMembers(filtered);
  }, [searchQuery, roleFilter, members]);
  
  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    // Сбрасываем фильтры при переключении вкладок
    if (newValue === 1) {
      setSearchQuery('');
      setRoleFilter('');
    }
  };
  
  const handleAddMember = async (request: AddBoardMemberRequest) => {
    try {
      setLoading(true);
      const newMember = await BoardMembersService.addMemberToBoard(boardId, request);
      setMembers((prev) => [...prev, newMember]);
      setFilteredMembers((prev) => [...prev, newMember]);
      
      // Переключаемся на вкладку со списком участников
      setActiveTab(0);
      return true;
    } catch (err) {
      console.error('Ошибка при добавлении участника:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };
  
  const handleMemberRemoved = (userId: number) => {
    setMembers((prev) => prev.filter(member => member.userId !== userId));
    setFilteredMembers((prev) => prev.filter(member => member.userId !== userId));
  };
  
  const handleMemberRoleChanged = (updatedMember: BoardMember) => {
    setMembers((prev) => 
      prev.map(member => 
        member.userId === updatedMember.userId ? updatedMember : member
      )
    );
    setFilteredMembers((prev) => 
      prev.map(member => 
        member.userId === updatedMember.userId ? updatedMember : member
      )
    );
    
    // Показываем уведомление об успешном изменении роли
    const roleName = updatedMember.role?.name || 'новая роль';
    const userName = updatedMember.displayName || updatedMember.username;
    
    // Добавляем явное уведомление об успехе с инструкцией
    const message = `Роль пользователя ${userName} успешно изменена на "${roleName}"`;
    setSuccessMessage(message);
    
    // Очищаем сообщение через 5 секунд
    setTimeout(() => {
      setSuccessMessage(null);
    }, 5000);
  };
  
  const handleRoleFilterChange = (event: SelectChangeEvent) => {
    setRoleFilter(event.target.value);
  };
  
  const handleSearchQueryChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };
  
  const clearFilters = () => {
    setSearchQuery('');
    setRoleFilter('');
    setFilteredMembers(members);
  };
  
  const getRoleName = (roleId: number): string => {
    const role = roles.find(r => r.id === roleId);
    return role ? role.name : 'Неизвестная роль';
  };
  
  // Проверяем, может ли текущий пользователь изменять роли участников
  const canManageRoles = (): boolean => {
    // Используем хук если доска загружена
    if (boardData) {
      return userRoles.hasPermission(Permission.EDIT_MEMBERS_ROLES);
    }
    
    // Запасной вариант, если доска еще не загружена
    // Владелец всегда может изменять роли
    if (currentUserId === ownerId) return true;
    
    // Админы могут изменять роли
    if (isAdmin) return true;
    
    // Проверяем роль пользователя, если доступна
    return currentUserRole === SystemRoles.ADMIN;
  };
  
  // Проверка права на управление участниками
  const canManageMembers = (): boolean => {
    if (boardData) {
      return userRoles.hasPermission(Permission.MANAGE_MEMBERS);
    }
    
    return isAdmin || currentUserId === ownerId || currentUserRole === SystemRoles.ADMIN;
  };
  
  // Рендер элемента одного участника в списке
  const renderMemberItem = (member: BoardMember) => {
    return (
      <ListItem
        key={member.userId}
        divider
        sx={{ 
          display: 'flex',
          alignItems: 'center',
          p: 2,
          '&:hover': { bgcolor: 'rgba(0,0,0,0.02)' }
        }}
      >
        {/* Аватар пользователя */}
        <Avatar 
          src={getAvatarUrl(member.avatarUrl)} 
          alt={member.username || 'Пользователь'}
          sx={{ width: 40, height: 40 }}
        >
          {member.username ? member.username.charAt(0).toUpperCase() : 'U'}
        </Avatar>
        
        {/* Информация об участнике */}
        <Box sx={{ display: 'flex', flexDirection: 'column', ml: 2, flexGrow: 1 }}>
          <Typography variant="subtitle1" component="div">
            {member.username}
            {currentUserId === member.userId && (
              <Chip 
                label="Вы" 
                size="small" 
                color="primary" 
                sx={{ ml: 1, height: 20, fontSize: '0.7rem' }} 
              />
            )}
            {ownerId === member.userId && (
              <Chip 
                label="Владелец" 
                size="small" 
                color="secondary" 
                sx={{ ml: 1, height: 20, fontSize: '0.7rem' }} 
              />
            )}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {member.email}
          </Typography>
        </Box>
        
        {/* Кнопка роли и действий */}
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {/* Показываем кнопку роли только если есть права на управление */}
          {canManageRoles() && member.userId !== ownerId && member.userId !== currentUserId && (
            <Tooltip title="Изменить роль">
              <Button
                variant="outlined"
                size="small"
                startIcon={getRoleIcon(member.role?.name)}
                onClick={() => handleStartChangeRole(member)}
                sx={{
                  mr: 1,
                  backgroundColor: getRoleColor(member.role?.name),
                  '&:hover': {
                    backgroundColor: getRoleColor(member.role?.name),
                    opacity: 0.9,
                  },
                }}
              >
                Роль: {member.role?.name || 'Не задана'}
              </Button>
            </Tooltip>
          )}
          
          {/* Если нет прав на управление, просто показываем роль */}
          {(!canManageRoles() || member.userId === ownerId || member.userId === currentUserId) && (
            <Chip
              icon={getRoleIcon(member.role?.name)}
              label={member.role?.name || 'Не задана'}
              size="small"
              sx={{
                mr: 1,
                backgroundColor: getRoleColor(member.role?.name),
              }}
            />
          )}
        </Box>
      </ListItem>
    );
  };
  
  // Рендер быстрого изменения роли для участника
  const renderMemberRoleSelector = () => {
    if (!selectedMember) return null;
    
    return (
      <Dialog
        open={showRoleSelector}
        onClose={() => !changingRole && setShowRoleSelector(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          Изменение роли участника
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
            <Avatar 
              src={getAvatarUrl(selectedMember.avatarUrl)} 
              alt={selectedMember.username}
              sx={{ mr: 2 }}
            >
              {selectedMember.username?.charAt(0)?.toUpperCase() || 'U'}
            </Avatar>
            <Box>
              <Typography variant="subtitle1">
                {selectedMember.displayName || selectedMember.username}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedMember.email}
              </Typography>
            </Box>
          </Box>
          
          <Typography variant="subtitle2" gutterBottom>
            Текущая роль: 
            <Chip
              label={selectedMember.role?.name || "Нет роли"} 
              size="small"
              sx={{
                ml: 1,
                bgcolor: getRoleColor(selectedMember.role?.name),
              }}
              icon={getRoleIcon(selectedMember.role?.name)}
            />
          </Typography>
          
          <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
            Выберите новую роль:
          </Typography>
          
          <Box sx={{ mt: 1 }}>
            <List>
              {roles.map(role => (
                <ListItem 
                  key={role.id}
                  button
                  selected={selectedRoleId === role.id}
                  onClick={() => setSelectedRoleId(role.id)}
                  sx={{ 
                    borderRadius: 1,
                    mb: 1,
                    bgcolor: selectedRoleId === role.id ? getRoleColor(role.name) : 'background.paper',
                  }}
                >
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: getRoleColor(role.name) }}>
                      {getRoleIcon(role.name)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText 
                    primary={role.name} 
                    secondary={role.description}
                  />
                  {selectedRoleId === role.id && (
                    <Chip label="Выбрано" size="small" color="primary" />
                  )}
                </ListItem>
              ))}
            </List>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setShowRoleSelector(false)} 
            disabled={changingRole}
          >
            Отмена
          </Button>
          <Button 
            onClick={handleRoleChange} 
            variant="contained"
            color="primary"
            disabled={changingRole || !selectedRoleId || selectedRoleId === selectedMember.role?.id}
            startIcon={changingRole && <CircularProgress size={16} />}
          >
            {changingRole ? 'Сохранение...' : 'Сохранить'}
          </Button>
        </DialogActions>
      </Dialog>
    );
  };
  
  // Рендер прямого списка участников с кнопками для управления ролями
  const renderDirectMembersList = () => {
    return (
      <Box sx={{ mt: 2 }}>
        {/* Список участников */}
        {filteredMembers.length === 0 && !loading ? (
          <Alert severity="info" sx={{ mt: 2 }}>
            Участники не найдены
          </Alert>
        ) : (
          <List>
            {loading ? (
              // Скелеты загрузки
              Array.from(new Array(3)).map((_, index) => (
                <ListItem key={index} divider>
                  <ListItemAvatar>
                    <Skeleton variant="circular" width={40} height={40} />
                  </ListItemAvatar>
                  <ListItemText
                    primary={<Skeleton width="60%" />}
                    secondary={<Skeleton width="40%" />}
                  />
                </ListItem>
              ))
            ) : (
              // Список участников
              filteredMembers.map((member) => renderMemberItem(member))
            )}
          </List>
        )}
        
        {/* Кнопка добавления участника */}
        {canManageMembers() ? (
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<PersonAddIcon />}
              onClick={() => setActiveTab(1)}
            >
              Добавить участника
            </Button>
          </Box>
        ) : (
          <Alert severity="info" sx={{ mt: 2 }}>
            Данное действие Вам недоступно, обратитесь к администратору
          </Alert>
        )}
      </Box>
    );
  };
  
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      scroll="paper"
      aria-labelledby="board-members-dialog-title"
    >
      {/* Заголовок с кнопкой добавления */}
      <DialogTitle id="board-members-dialog-title" sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="h6" component="h2" fontWeight="bold" gutterBottom>
              Участники доски
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {canManageMembers() 
                ? "Просматривайте, добавляйте и удаляйте участников доски"
                : "Просматривайте список участников доски"}
            </Typography>
          </Box>
          <Tooltip title="Закрыть">
            <IconButton
              aria-label="close"
              onClick={onClose}
              sx={{ mt: -1, mr: -1 }}
            >
              <CloseIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </DialogTitle>

      {/* Вкладки */}
      <Box sx={{ px: 3, pb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
          aria-label="участники доски"
        >
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <PeopleAltIcon sx={{ mr: 1 }} />
                <span>Участники</span>
                {members.length > 0 && (
                  <Chip 
                    label={members.length} 
                    size="small" 
                    color="primary" 
                    sx={{ ml: 1, height: 20, minWidth: 24 }} 
                  />
                )}
              </Box>
            } 
            id="tab-0"
            aria-controls="tabpanel-0"
          />
          {canManageMembers() && (
            <Tab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <PersonAddIcon sx={{ mr: 1 }} />
                  <span>Добавить участника</span>
                </Box>
              } 
              id="tab-1" 
              aria-controls="tabpanel-1"
            />
          )}
        </Tabs>
      </Box>
      
      <Divider />
      
      {/* Информационное сообщение о недостаточных правах */}
      {!canManageMembers() && !loading && (
        <Alert severity="info" sx={{ mx: 3, mt: 2 }}>
          У вас нет прав для управления участниками. Доступен только просмотр списка.
        </Alert>
      )}
      
      {/* Информационное сообщение об изменении ролей */}
      {activeTab === 0 && canManageRoles() && !loading && members.length > 0 && (
        <Alert severity="info" sx={{ mx: 3, mt: 2, display: 'flex', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <EditIcon sx={{ mr: 1 }} />
            <Typography variant="body2">
              Вы можете изменить роль участника, нажав на кнопку "Роль" справа от его имени
            </Typography>
          </Box>
        </Alert>
      )}

      {/* Панель фильтрации (только для вкладки участников) */}
      {activeTab === 0 && !loading && members.length > 0 && (
        <Box sx={{ px: 3, py: 2 }}>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <TextField
              placeholder="Поиск участников..."
              value={searchQuery}
              onChange={handleSearchQueryChange}
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
                endAdornment: searchQuery && (
                  <InputAdornment position="end">
                    <IconButton 
                      size="small" 
                      onClick={() => setSearchQuery('')}
                      aria-label="очистить поиск"
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                )
              }}
              sx={{ flexGrow: 1, minWidth: 200 }}
            />
            
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <Select
                value={roleFilter}
                onChange={handleRoleFilterChange}
                displayEmpty
                renderValue={(selected) => {
                  if (!selected) {
                    return <Typography color="text.secondary">Все роли</Typography>;
                  }
                  const role = roles.find(r => r.id.toString() === selected);
                  return role ? role.name : 'Все роли';
                }}
              >
                <MenuItem value="">Все роли</MenuItem>
                {roles.map(role => (
                  <MenuItem key={role.id} value={role.id.toString()}>
                    {role.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            {(searchQuery || roleFilter) && (
              <Tooltip title="Сбросить фильтры">
                <Button 
                  size="small" 
                  variant="outlined" 
                  color="secondary"
                  onClick={clearFilters}
                  startIcon={<FilterListIcon />}
                >
                  Сбросить
                </Button>
              </Tooltip>
            )}
          </Box>
          
          {filteredMembers.length !== members.length && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
              Показано {filteredMembers.length} из {members.length} участников
            </Typography>
          )}
        </Box>
      )}
      
      <DialogContent dividers>
        {loading ? (
          <Box sx={{ pt: 1, pb: 3 }}>
            <Skeleton variant="rectangular" width="100%" height={50} sx={{ mb: 2 }} />
            <Skeleton variant="rectangular" width="100%" height={70} sx={{ mb: 2 }} />
            <Skeleton variant="rectangular" width="100%" height={70} sx={{ mb: 2 }} />
            <Skeleton variant="rectangular" width="100%" height={70} />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        ) : (
          <Box role="tabpanel" hidden={activeTab !== 0} id="tabpanel-0" aria-labelledby="tab-0">
            {activeTab === 0 && (
              <Fade in={activeTab === 0} timeout={500}>
                <div>
                  {/* Сообщение об успешном действии */}
                  {successMessage && (
                    <Alert 
                      severity="success" 
                      sx={{ mb: 2 }}
                      onClose={() => setSuccessMessage(null)}
                    >
                      {successMessage}
                    </Alert>
                  )}
                  
                  {/* Используем простой список вместо компонента MembersList */}
                  {renderDirectMembersList()}
                </div>
              </Fade>
            )}
          </Box>
        )}
        
        <Box role="tabpanel" hidden={activeTab !== 1} id="tabpanel-1" aria-labelledby="tab-1">
          {activeTab === 1 && !loading && (
            <Fade in={activeTab === 1} timeout={500}>
              <div>
                <InviteForm
                  boardId={boardId}
                  roles={roles}
                  onInvite={handleAddMember}
                />
              </div>
            </Fade>
          )}
        </Box>
      </DialogContent>
      
      <DialogActions>
        <Box sx={{ mr: 'auto', display: 'flex', alignItems: 'center' }}>
          <Tooltip title="Права доступа определяются ролью пользователя">
            <IconButton size="small" color="info">
              <InfoIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
            {canManageRoles() ? 
              `У вас есть права на управление участниками (роль: ${userRoles.userRole || currentUserRole || 'Админ'})` : 
              'Для изменения ролей требуются права администратора'}
          </Typography>
        </Box>
        <Button onClick={onClose} color="primary">
          Закрыть
        </Button>
      </DialogActions>
      
      {/* Диалог изменения роли */}
      {renderMemberRoleSelector()}
    </Dialog>
  );
};

export default BoardMembersModal; 