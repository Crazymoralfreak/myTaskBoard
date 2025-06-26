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
import DeleteIcon from '@mui/icons-material/Delete';
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
import { useLocalization } from '../../hooks/useLocalization';

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
  const { t } = useLocalization();
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
  const [confirmDelete, setConfirmDelete] = useState<boolean>(false);
  const [deletingMember, setDeletingMember] = useState<boolean>(false);
  
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
      setError(t('errorLoadBoardInfo'));
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
      setError(t('errorLoadData'));
    } finally {
      setLoading(false);
    }
  };
  
  // Обработчик клика по кнопке изменения роли
  const handleRoleClick = (member: BoardMember) => {
    setSelectedMember(member);
    setSelectedRoleId(member.role?.id || null);
    setShowRoleSelector(true);
  };
  
  // Обработчик изменения роли
  const handleRoleChange = async () => {
    if (!selectedMember || !selectedRoleId) return;
    
    try {
      setChangingRole(true);
      
      // Определяем ID пользователя из разных возможных форматов данных
      const userId = selectedMember.userId || (selectedMember.user && selectedMember.user.id);
      
      if (!userId) {
        throw new Error(t('errorIdentifyUser'));
      }
      
      console.log('Обновляем роль пользователя:', { userId, roleId: selectedRoleId });
      
      const updatedMember = await BoardMembersService.updateMemberRole(
        boardId,
        userId,
        { roleId: selectedRoleId }
      );
      
      console.log('Получен обновленный участник:', updatedMember);
      
      // Проверяем, что получили валидный объект
      if (!updatedMember) {
        throw new Error('Сервер вернул пустой ответ');
      }
      
      // Проверяем наличие обязательных полей
      if (!updatedMember.userId && !(updatedMember.user && updatedMember.user.id)) {
        console.warn('Обновленный участник не содержит ID пользователя:', updatedMember);
      }
      
      // Обновляем участника в списке, используя метод проверки соответствия
      setMembers(prev => prev.map(member => 
        isSameMember(member, updatedMember) ? updatedMember : member
      ));
      
      setFilteredMembers(prev => prev.map(member => 
        isSameMember(member, updatedMember) ? updatedMember : member
      ));
      
      setShowRoleSelector(false);
      
      // Получаем имя пользователя из разных возможных форматов данных
      const username = updatedMember.username || 
                       (updatedMember.user && updatedMember.user.username) || 
                       selectedMember.username || 
                       (selectedMember.user && selectedMember.user.username) || 
                       t('user');
      
      setSuccessMessage(`${t('memberRoleChanged')} ${username} ${t('to')} ${getRoleName(selectedRoleId)}`);
      
      // Сбрасываем выбранные значения после небольшой задержки
      setTimeout(() => {
        setSelectedMember(null);
        setSelectedRoleId(null);
      }, 300);
    } catch (error) {
      console.error('Ошибка при изменении роли:', error);
      setError(t('errorChangeRole'));
      
      // Закрываем диалог при ошибке после небольшой задержки
      setTimeout(() => {
        setShowRoleSelector(false);
      }, 1500);
    } finally {
      setChangingRole(false);
    }
  };
  
  // Вспомогательная функция для проверки, является ли member тем же участником, что и updatedMember
  const isSameMember = (member: BoardMember, updatedMember: BoardMember): boolean => {
    try {
      // Проверяем совпадение по ID пользователя в разных форматах
      const memberId = member?.userId || (member?.user && member.user.id);
      const updatedMemberId = updatedMember?.userId || (updatedMember?.user && updatedMember.user.id);
      
      // Если не удалось определить ID, считаем, что это не тот же пользователь
      if (memberId === undefined || updatedMemberId === undefined) {
        console.log('Не удалось определить ID для сравнения участников:', { member, updatedMember });
        return false;
      }
      
      // Сравниваем ID участников
      return memberId === updatedMemberId;
    } catch (err) {
      console.error('Ошибка при сравнении участников:', err, { member, updatedMember });
      return false;
    }
  };
  
  // Обработчик удаления участника
  const handleDeleteMember = async () => {
    if (!selectedMember) return;
    
    try {
      setDeletingMember(true);
      
      // Получаем ID пользователя с учетом разных структур данных
      const userId = selectedMember.userId || (selectedMember.user && selectedMember.user.id);
      
      if (!userId) {
        throw new Error(t('errorIdentifyUser'));
      }
      
      await BoardMembersService.removeMemberFromBoard(boardId, userId);
      
      // Удаляем участника из списка
      setMembers(prev => prev.filter(member => 
        (member.userId || (member.user && member.user.id)) !== userId
      ));
      setFilteredMembers(prev => prev.filter(member => 
        (member.userId || (member.user && member.user.id)) !== userId
      ));
      
      const username = selectedMember.username || (selectedMember.user && selectedMember.user.username) || t('user');
      setSuccessMessage(`${t('memberRemovedSuccess')} ${username}`);
    } catch (error) {
      console.error('Ошибка при удалении участника:', error);
      setError(t('errorRemoveMember'));
    } finally {
      setDeletingMember(false);
      setConfirmDelete(false);
      setSelectedMember(null);
    }
  };
  
  // Обработчик открытия диалога удаления участника
  const handleOpenDeleteDialog = (member: BoardMember) => {
    setSelectedMember(member);
    setConfirmDelete(true);
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
  
  // Функция для рендера отдельного элемента списка участников
  const renderMemberItem = (member: BoardMember) => {
    const isCurrentUser = member.userId === currentUserId;
    const isOwner = member.userId === ownerId;
    const roleName = member.role?.name || 'Без роли';
    
    return (
      <ListItem
        key={member.userId}
        sx={{ 
          borderBottom: '1px solid',
          borderColor: 'divider',
          py: 1
        }}
      >
        <ListItemAvatar>
          <Avatar src={getAvatarUrl(member.avatarUrl)} alt={member.username}>
            {member.username.charAt(0).toUpperCase()}
          </Avatar>
        </ListItemAvatar>
        
        <ListItemText
          primary={
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant="subtitle1" component="span">
                {member.displayName || member.username}
              </Typography>
              {isOwner && (
                <Chip 
                  label="Владелец" 
                  size="small" 
                  color="primary" 
                  sx={{ ml: 1, height: 20 }} 
                />
              )}
              {isCurrentUser && (
                <Chip 
                  label="Вы" 
                  size="small" 
                  variant="outlined" 
                  sx={{ ml: 1, height: 20 }} 
                />
              )}
            </Box>
          }
          secondary={
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
              <Chip
                label={roleName}
                size="small"
                sx={{ 
                  height: 20, 
                  backgroundColor: getRoleColor(roleName),
                  color: 'white',
                  '& .MuiChip-label': { px: 1, fontSize: '0.7rem' }
                }}
                icon={getRoleIcon(roleName)}
              />
              <Typography variant="caption" sx={{ ml: 1, color: 'text.secondary' }}>
                Присоединился {new Date(member.joinedAt).toLocaleDateString()}
              </Typography>
            </Box>
          }
        />
        
        {/* Действия с участником */}
        {canManageRoles() && !isOwner && !isCurrentUser && (
          <ListItemSecondaryAction>
            <Tooltip title="Изменить роль">
              <IconButton 
                edge="end" 
                aria-label="edit-role"
                onClick={() => handleRoleClick(member)}
                size="small"
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            
            {/* Добавляем кнопку удаления участника */}
            {canManageMembers() && (
              <Tooltip title="Удалить участника">
                <IconButton 
                  edge="end" 
                  aria-label="delete-member"
                  onClick={() => handleOpenDeleteDialog(member)}
                  size="small"
                  sx={{ ml: 1 }}
                  color="error"
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </ListItemSecondaryAction>
        )}
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
            {t('membersNotFound')}
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
              {t('addMember')}
            </Button>
          </Box>
        ) : (
          <Alert severity="info" sx={{ mt: 2 }}>
            {t('actionNotAvailable')}
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
              {t('boardMembersTitle')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {canManageMembers() 
                ? t('boardMembersDescriptionAdmin')
                : t('boardMembersDescriptionUser')}
            </Typography>
          </Box>
          <Tooltip title={t('close')}>
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
          aria-label={t('boardMembers')}
        >
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <PeopleAltIcon sx={{ mr: 1 }} />
                <span>{t('members')}</span>
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
                  <span>{t('addMember')}</span>
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
          {t('noMemberManagementPermission')}
        </Alert>
      )}
      
      {/* Информационное сообщение об изменении ролей */}
      {activeTab === 0 && canManageRoles() && !loading && members.length > 0 && (
        <Alert severity="info" sx={{ mx: 3, mt: 2, display: 'flex', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <EditIcon sx={{ mr: 1 }} />
            <Typography variant="body2">
              {t('memberRoleChangeHint')}
            </Typography>
          </Box>
        </Alert>
      )}

      {/* Панель фильтрации (только для вкладки участников) */}
      {activeTab === 0 && !loading && members.length > 0 && (
        <Box sx={{ px: 3, py: 2 }}>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <TextField
              placeholder={t('searchMembersPlaceholder')}
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
                      aria-label={t('clearSearch')}
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
                    return <Typography color="text.secondary">{t('allRoles')}</Typography>;
                  }
                  const role = roles.find(r => r.id.toString() === selected);
                  return role ? role.name : t('allRoles');
                }}
              >
                <MenuItem value="">{t('allRoles')}</MenuItem>
                {roles.map(role => (
                  <MenuItem key={role.id} value={role.id.toString()}>
                    {role.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            {(searchQuery || roleFilter) && (
              <Tooltip title={t('resetFilters')}>
                <Button 
                  size="small" 
                  variant="outlined" 
                  color="secondary"
                  onClick={clearFilters}
                  startIcon={<FilterListIcon />}
                >
                  {t('reset')}
                </Button>
              </Tooltip>
            )}
          </Box>
          
          {filteredMembers.length !== members.length && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
              {`${t('showing')} ${filteredMembers.length} ${t('of')} ${members.length} ${t('members')}`}
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
          <Tooltip title={t('accessRightsTooltip')}>
            <IconButton size="small" color="info">
              <InfoIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
            {canManageRoles() ? 
              `${t('youHaveManagementRights')} (${t('role')}: ${userRoles.userRole || currentUserRole || t('admin')})` : 
              t('adminRightsRequired')}
          </Typography>
        </Box>
        <Button onClick={onClose} color="primary">
          {t('close')}
        </Button>
      </DialogActions>
      
      {/* Модальное окно для выбора роли */}
      {renderMemberRoleSelector()}
      
      {/* Диалог подтверждения удаления участника */}
      <Dialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          {t('removeMemberTitle')}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" id="alert-dialog-description">
            {`${t('removeMemberConfirm')} ${selectedMember?.username || selectedMember?.user?.username || t('selectedUser')} ${t('fromBoard')}?`}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDelete(false)} color="primary">
            {t('cancel')}
          </Button>
          <Button 
            onClick={handleDeleteMember} 
            color="error" 
            autoFocus
            disabled={deletingMember}
            startIcon={deletingMember && <CircularProgress size={16} />}
          >
            {deletingMember ? t('removing') : t('remove')}
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
};

export default BoardMembersModal; 