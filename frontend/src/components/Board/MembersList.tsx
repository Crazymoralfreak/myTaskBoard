import React, { useState, useMemo } from 'react';
import {
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Avatar,
  IconButton,
  Typography,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Chip,
  Paper,
  Divider,
  Snackbar,
  Alert,
  Fade,
  FormControl,
  Select,
  MenuItem,
  SelectChangeEvent,
  Menu,
  ListItemIcon,
  ToggleButtonGroup,
  ToggleButton,
  Pagination,
  Stack,
  CircularProgress
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import EditIcon from '@mui/icons-material/Edit';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import SortIcon from '@mui/icons-material/Sort';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';
import VisibilityIcon from '@mui/icons-material/Visibility';
import GroupIcon from '@mui/icons-material/Group';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { BoardMember, UpdateMemberRoleRequest } from '../../types/BoardMember';
import { BoardMembersService } from '../../services/BoardMembersService';
import { RolesService } from '../../services/RolesService';
import { Role, SystemRoles } from '../../types/Role';

interface MembersListProps {
  boardId: string;
  members: BoardMember[];
  currentUserId: number;
  ownerId?: number;
  isAdmin: boolean;
  onMemberRemoved: (userId: number) => void;
  onMemberRoleChanged: (member: BoardMember) => void;
  onAddMemberClick?: () => void;
  roles: Role[];
}

const ITEMS_PER_PAGE = 5;

/**
 * Компонент для отображения списка участников доски
 */
const MembersList: React.FC<MembersListProps> = ({
  boardId,
  members,
  currentUserId,
  ownerId,
  isAdmin,
  onMemberRemoved,
  onMemberRoleChanged,
  onAddMemberClick,
  roles
}) => {
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState<boolean>(false);
  const [memberToDelete, setMemberToDelete] = useState<BoardMember | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loadingRoles, setLoadingRoles] = useState<boolean>(false);
  const [editingRoleMember, setEditingRoleMember] = useState<BoardMember | null>(null);
  const [editRoleDialogOpen, setEditRoleDialogOpen] = useState<boolean>(false);
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [roleChangeLoading, setRoleChangeLoading] = useState<boolean>(false);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [menuMember, setMenuMember] = useState<BoardMember | null>(null);
  const [sortOrder, setSortOrder] = useState<string>('role');
  const [page, setPage] = useState<number>(1);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Получаем цвет для роли (цветовое кодирование ролей)
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
  
  // Получаем цвет текста для роли
  const getRoleTextColor = (roleName?: string): string => {
    if (!roleName) return 'text.secondary';
    
    switch (roleName.toUpperCase()) {
      case SystemRoles.ADMIN:
        return '#d32f2f'; // Красный
      case SystemRoles.EDITOR:
        return '#1976d2'; // Синий
      case SystemRoles.VIEWER:
        return '#388e3c'; // Зеленый
      default:
        return 'text.primary';
    }
  };
  
  // Получаем иконку для роли
  const getRoleIcon = (roleName?: string) => {
    if (!roleName) return <InfoOutlinedIcon fontSize="small" />;
    
    switch (roleName.toUpperCase()) {
      case SystemRoles.ADMIN:
        return <AdminPanelSettingsIcon fontSize="small" />;
      case SystemRoles.EDITOR:
        return <SupervisorAccountIcon fontSize="small" />;
      case SystemRoles.VIEWER:
        return <VisibilityIcon fontSize="small" />;
      default:
        return <InfoOutlinedIcon fontSize="small" />;
    }
  };
  
  // Загружаем роли, когда открывается диалог изменения роли
  React.useEffect(() => {
    if (editRoleDialogOpen) {
      loadRoles();
    }
  }, [editRoleDialogOpen]);
  
  const loadRoles = async () => {
    try {
      setLoadingRoles(true);
      
      // Если роли уже были загружены в качестве пропса, используем их
      if (roles && roles.length > 0) {
        if (editingRoleMember && editingRoleMember.role) {
          setSelectedRoleId(editingRoleMember.role.id);
        }
        setLoadingRoles(false);
        return;
      }
      
      // Иначе загружаем роли с сервера
      const rolesData = await RolesService.getBoardRoles(boardId);
      
      // Устанавливаем текущую роль участника в качестве выбранной
      if (editingRoleMember && editingRoleMember.role) {
        setSelectedRoleId(editingRoleMember.role.id);
      }
    } catch (err) {
      console.error('Ошибка при загрузке ролей:', err);
    } finally {
      setLoadingRoles(false);
    }
  };
  
  const handleRemoveMember = async () => {
    if (!memberToDelete) return;
    
    try {
      setLoading(true);
      await BoardMembersService.removeMemberFromBoard(boardId, memberToDelete.userId);
      onMemberRemoved(memberToDelete.userId);
      setSuccessMessage(`Участник ${memberToDelete.displayName || memberToDelete.username} успешно удален`);
    } catch (err) {
      console.error('Ошибка при удалении участника:', err);
    } finally {
      setLoading(false);
      setConfirmDeleteOpen(false);
      setMemberToDelete(null);
    }
  };
  
  const handleEditRole = (member: BoardMember) => {
    setEditingRoleMember(member);
    setSelectedRoleId(member.role?.id || null);
    setEditRoleDialogOpen(true);
    handleMenuClose(); // Закрываем меню, если оно было открыто
  };
  
  const handleRoleChange = async () => {
    if (!editingRoleMember || !selectedRoleId) return;
    
    try {
      setRoleChangeLoading(true);
      console.log('Изменение роли для пользователя:', editingRoleMember.userId, 'на роль:', selectedRoleId);
      
      const request: UpdateMemberRoleRequest = {
        roleId: selectedRoleId
      };
      
      console.log('Отправляем запрос:', request);
      const updatedMember = await BoardMembersService.updateMemberRole(
        boardId, 
        editingRoleMember.userId, 
        request
      );
      
      console.log('Получен ответ от сервера:', updatedMember);
      
      // Убедимся, что данные о роли обновлены корректно
      if (!updatedMember.role || updatedMember.role.id !== selectedRoleId) {
        console.warn('Роль в ответе не соответствует запрошенной роли:', 
          updatedMember.role?.id, '!=', selectedRoleId);
        
        // Исправляем роль вручную, если она не была обновлена на сервере
        const selectedRole = roles.find(r => r.id === selectedRoleId);
        if (selectedRole) {
          updatedMember.role = selectedRole;
        }
      }
      
      onMemberRoleChanged(updatedMember);
      setSuccessMessage(`Роль пользователя ${editingRoleMember.displayName || editingRoleMember.username} успешно обновлена`);
      
      // Закрываем диалог
      setEditRoleDialogOpen(false);
      setEditingRoleMember(null);
      setSelectedRoleId(null);
    } catch (err) {
      console.error('Ошибка при обновлении роли участника:', err);
      setError(`Не удалось обновить роль: ${err instanceof Error ? err.message : 'неизвестная ошибка'}`);
    } finally {
      setRoleChangeLoading(false);
    }
  };
  
  const handleRoleSelectChange = (event: SelectChangeEvent<number>) => {
    setSelectedRoleId(Number(event.target.value));
  };
  
  // Обработчики для меню опций пользователя
  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, member: BoardMember) => {
    setMenuAnchorEl(event.currentTarget);
    setMenuMember(member);
  };
  
  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setMenuMember(null);
  };
  
  const handleDeleteClick = (member: BoardMember) => {
    setMemberToDelete(member);
    setConfirmDeleteOpen(true);
    handleMenuClose(); // Закрываем меню, если оно было открыто
  };
  
  // Обработчик открытия/закрытия меню сортировки
  const handleSortMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleSortMenuClose = () => {
    setAnchorEl(null);
  };
  
  // Обработчик изменения сортировки
  const handleSortChange = (event: React.MouseEvent<HTMLElement>, newValue: string | null) => {
    if (newValue !== null) {
      setSortOrder(newValue);
      setPage(1); // Сброс на первую страницу при изменении сортировки
    }
    handleSortMenuClose();
  };
  
  // Сортируем и группируем участников
  const sortedMembers = useMemo(() => {
    if (!members.length) return [];
    
    const sorted = [...members];
    
    switch (sortOrder) {
      case 'name':
        return sorted.sort((a, b) => {
          const nameA = a.displayName || a.username;
          const nameB = b.displayName || b.username;
          return nameA.localeCompare(nameB);
        });
      case 'role':
        return sorted.sort((a, b) => {
          if (!a.role && !b.role) return 0;
          if (!a.role) return 1;
          if (!b.role) return -1;
          return a.role.name.localeCompare(b.role.name);
        });
      case 'joined':
        return sorted.sort((a, b) => {
          return new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime();
        });
      default:
        return sorted;
    }
  }, [members, sortOrder]);
  
  // Группируем по ролям, если выбрана сортировка по ролям
  const groupedMembers = useMemo(() => {
    if (!members.length) return {};
    
    if (sortOrder === 'role') {
      return sortedMembers.reduce<Record<string, BoardMember[]>>((groups, member) => {
        const roleName = member.role?.name || 'Без роли';
        if (!groups[roleName]) {
          groups[roleName] = [];
        }
        groups[roleName].push(member);
        return groups;
      }, {});
    }
    
    return null; // Если не группируем по ролям
  }, [sortedMembers, sortOrder]);
  
  // Рассчитываем пагинацию
  const paginatedMembers = useMemo(() => {
    const startIndex = (page - 1) * ITEMS_PER_PAGE;
    return sortedMembers.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [sortedMembers, page]);
  
  // Обработчик изменения страницы
  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  // Рендер списка участников с учетом группировки
  const renderMembersList = () => {
    if (sortOrder === 'role' && groupedMembers) {
      // Рендер с группировкой по ролям
      return Object.entries(groupedMembers).map(([roleName, roleMembers]) => (
        <Box key={roleName} sx={{ mb: 3 }}>
          <Typography 
            variant="subtitle2" 
            sx={{ 
              mb: 1, 
              display: 'flex', 
              alignItems: 'center',
              color: getRoleTextColor(roleName)
            }}
          >
            {getRoleIcon(roleName)}
            <span style={{ marginLeft: 8 }}>{roleName}</span>
            <Chip 
              label={roleMembers.length} 
              size="small" 
              sx={{ ml: 1, bgcolor: getRoleColor(roleName), color: getRoleTextColor(roleName) }} 
            />
          </Typography>
          
          <List disablePadding>
            {roleMembers.map((member) => renderMemberItem(member))}
          </List>
        </Box>
      ));
    } else {
      // Рендер без группировки, с пагинацией
      return (
        <>
          <List disablePadding>
            {paginatedMembers.map((member) => renderMemberItem(member))}
          </List>
          
          {sortedMembers.length > ITEMS_PER_PAGE && (
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
              <Pagination 
                count={Math.ceil(sortedMembers.length / ITEMS_PER_PAGE)} 
                page={page}
                onChange={handlePageChange}
                color="primary"
                size="small"
              />
            </Box>
          )}
        </>
      );
    }
  };
  
  // Рендер элемента списка участников
  const renderMemberItem = (member: BoardMember): JSX.Element => (
    <ListItem 
      key={member.userId} 
      divider 
      sx={{ 
        borderRadius: 1,
        transition: 'all 0.2s',
        '&:hover': { 
          bgcolor: 'action.hover'
        },
        py: 2 // Добавляем больше вертикального пространства
      }}
      secondaryAction={
        isAdmin && member.userId !== ownerId && member.userId !== currentUserId ? (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Tooltip title="Изменить роль пользователя">
              <IconButton
                edge="end"
                aria-label="изменить роль"
                onClick={() => handleEditRole(member)}
                size="small"
                color="primary"
                sx={{ mr: 1 }}
              >
                <EditIcon />
              </IconButton>
            </Tooltip>
            <IconButton
              edge="end"
              aria-label="опции"
              onClick={(e) => handleMenuClick(e, member)}
              size="small"
              color="inherit"
            >
              <MoreVertIcon />
            </IconButton>
          </Box>
        ) : undefined
      }
    >
      <ListItemAvatar>
        <Avatar 
          src={member.avatarUrl} 
          alt={member.username}
          sx={{ 
            bgcolor: member.userId === ownerId ? 'primary.main' : 'default',
            width: 40,
            height: 40
          }}
        >
          {member.username?.charAt(0)?.toUpperCase() || 'U'}
        </Avatar>
      </ListItemAvatar>
      
      <ListItemText
        primary={
          <Box display="flex" alignItems="center">
            <Typography variant="body1" fontWeight={member.userId === ownerId ? 'medium' : 'regular'}>
              {member.displayName || member.username}
            </Typography>
            
            {member.userId === currentUserId && (
              <Chip 
                label="Вы" 
                size="small" 
                variant="outlined"
                color="info"
                sx={{ ml: 1, height: 20 }}
              />
            )}
            
            {member.userId === ownerId && (
              <Chip 
                label="Владелец" 
                size="small"
                color="primary"
                variant="outlined"
                sx={{ ml: 1 }}
              />
            )}
          </Box>
        }
        secondary={
          <React.Fragment>
            <Typography variant="body2" color="text.secondary" component="span">
              {member.email}
            </Typography>
            <br />
            <Box display="flex" alignItems="center" mt={1}>
              {isAdmin && member.userId !== ownerId ? (
                <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                  <Tooltip title="Нажмите для изменения роли" arrow placement="top">
                    <Chip 
                      label={member.role?.name || 'Без роли'} 
                      size="small"
                      variant="outlined"
                      sx={{ 
                        mr: 1,
                        mb: 0.5,
                        bgcolor: getRoleColor(member.role?.name),
                        color: getRoleTextColor(member.role?.name),
                        borderColor: 'transparent',
                        cursor: 'pointer',
                        '&:hover': {
                          boxShadow: '0 0 0 1px rgba(0,0,0,0.1)'
                        }
                      }}
                      icon={getRoleIcon(member.role?.name)}
                      onClick={() => handleEditRole(member)}
                      deleteIcon={<EditIcon fontSize="small" />}
                      onDelete={() => handleEditRole(member)}
                    />
                  </Tooltip>
                  
                  {/* Быстрые действия для смены роли */}
                  <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                    <Typography variant="caption" color="text.secondary" sx={{ mr: 1, mb: 0.5 }}>
                      Быстрая смена:
                    </Typography>
                    
                    {roles.filter(role => role.id !== member.role?.id).map(role => (
                      <Tooltip key={role.id} title={`Изменить на ${role.name}`} arrow>
                        <Chip
                          label={role.name}
                          size="small"
                          variant="outlined"
                          sx={{ 
                            mr: 0.5,
                            mb: 0.5,
                            bgcolor: 'transparent',
                            borderColor: getRoleTextColor(role.name),
                            color: getRoleTextColor(role.name),
                            cursor: 'pointer',
                            '&:hover': {
                              bgcolor: getRoleColor(role.name)
                            }
                          }}
                          onClick={() => {
                            setEditingRoleMember(member);
                            setSelectedRoleId(role.id);
                            handleRoleChange();
                          }}
                        />
                      </Tooltip>
                    ))}
                  </Box>
                </Box>
              ) : (
                <Tooltip 
                  title={member.role?.description || 'Описание роли отсутствует'} 
                  arrow
                  placement="top"
                >
                  <Chip 
                    label={member.role?.name || 'Без роли'} 
                    size="small"
                    variant="outlined"
                    sx={{ 
                      mr: 1,
                      bgcolor: getRoleColor(member.role?.name),
                      color: getRoleTextColor(member.role?.name),
                      borderColor: 'transparent'
                    }}
                    icon={getRoleIcon(member.role?.name)}
                  />
                </Tooltip>
              )}
            </Box>
          </React.Fragment>
        }
      />
    </ListItem>
  );
  
  return (
    <>
      <Paper elevation={0} variant="outlined" sx={{ mb: 2, p: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box display="flex" alignItems="center">
            <Typography variant="subtitle1" fontWeight="medium">
              Список участников ({members.length})
            </Typography>
            <Tooltip title="Участники могут просматривать и взаимодействовать с доской в соответствии со своими ролями">
              <IconButton size="small" color="info">
                <InfoOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
          
          <Box display="flex" gap={1}>
            <Tooltip title="Сортировка">
              <Button
                size="small"
                startIcon={<SortIcon />}
                variant="outlined"
                color="inherit"
                onClick={handleSortMenuClick}
              >
                {sortOrder === 'name' ? 'По имени' : 
                 sortOrder === 'role' ? 'По роли' : 'По дате'}
              </Button>
            </Tooltip>
            
            {isAdmin && onAddMemberClick && (
              <Button 
                variant="outlined" 
                size="small" 
                startIcon={<PersonAddIcon />}
                onClick={onAddMemberClick}
                color="primary"
              >
                Добавить участника
              </Button>
            )}
          </Box>
        </Box>
        
        <Divider sx={{ mb: 1 }} />

        {members.length === 0 ? (
          <Box textAlign="center" py={4}>
            <Typography variant="body1" color="text.secondary" gutterBottom>
              Нет участников для отображения
            </Typography>
            {isAdmin && onAddMemberClick && (
              <Button 
                variant="contained" 
                startIcon={<PersonAddIcon />}
                onClick={onAddMemberClick}
                sx={{ mt: 1 }}
              >
                Добавить первого участника
              </Button>
            )}
          </Box>
        ) : (
          renderMembersList()
        )}
      </Paper>
      
      {/* Меню сортировки */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleSortMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem
          selected={sortOrder === 'name'}
          onClick={(e) => handleSortChange(e, 'name')}
        >
          По имени
        </MenuItem>
        <MenuItem
          selected={sortOrder === 'role'}
          onClick={(e) => handleSortChange(e, 'role')}
        >
          По роли
        </MenuItem>
        <MenuItem
          selected={sortOrder === 'joined'}
          onClick={(e) => handleSortChange(e, 'joined')}
        >
          По дате добавления
        </MenuItem>
      </Menu>
      
      {/* Меню опций пользователя */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => menuMember && handleEditRole(menuMember)}>
          <ListItemIcon>
            <EditIcon fontSize="small" color="primary" />
          </ListItemIcon>
          Изменить роль
        </MenuItem>
        <MenuItem onClick={() => menuMember && handleDeleteClick(menuMember)}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <Typography color="error">Удалить участника</Typography>
        </MenuItem>
      </Menu>
      
      {/* Диалог подтверждения удаления участника */}
      <Dialog 
        open={confirmDeleteOpen} 
        onClose={() => setConfirmDeleteOpen(false)}
        TransitionComponent={Fade}
      >
        <DialogTitle>Удаление участника</DialogTitle>
        <DialogContent>
          <Typography>
            Вы уверены, что хотите удалить пользователя 
            {memberToDelete && ` ${memberToDelete.displayName || memberToDelete.username}`} 
            из этой доски?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Это действие нельзя отменить.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDeleteOpen(false)} disabled={loading}>
            Отмена
          </Button>
          <Button onClick={handleRemoveMember} color="error" disabled={loading} autoFocus>
            {loading ? 'Удаление...' : 'Удалить'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Диалог изменения роли участника */}
      <Dialog
        open={editRoleDialogOpen}
        onClose={() => !roleChangeLoading && setEditRoleDialogOpen(false)}
        TransitionComponent={Fade}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ borderBottom: '1px solid', borderColor: 'divider', pb: 2 }}>
          <Typography variant="h6">Изменение роли участника</Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {editingRoleMember && (
            <>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Avatar
                  src={editingRoleMember.avatarUrl}
                  alt={editingRoleMember.username}
                  sx={{ mr: 2, width: 48, height: 48 }}
                >
                  {editingRoleMember.username?.charAt(0)?.toUpperCase() || 'U'}
                </Avatar>
                <Box>
                  <Typography variant="subtitle1" fontWeight="medium">
                    {editingRoleMember.displayName || editingRoleMember.username}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {editingRoleMember.email}
                  </Typography>
                </Box>
              </Box>
              
              <Divider sx={{ mb: 3 }} />

              {error && (
                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
                  {error}
                </Alert>
              )}
              
              <Typography variant="subtitle2" gutterBottom sx={{ mb: 2 }}>
                Текущая роль: <Chip 
                  label={editingRoleMember.role?.name || "Не указана"} 
                  size="small"
                  variant="outlined"
                  sx={{ 
                    ml: 1,
                    bgcolor: getRoleColor(editingRoleMember.role?.name),
                    color: getRoleTextColor(editingRoleMember.role?.name),
                    borderColor: 'transparent'
                  }}
                  icon={getRoleIcon(editingRoleMember.role?.name)}
                />
              </Typography>
              
              <Typography variant="subtitle1" fontWeight="medium" sx={{ mb: 2 }}>
                Выберите новую роль:
              </Typography>
              
              {loadingRoles ? (
                <Box display="flex" justifyContent="center" py={2}>
                  <CircularProgress size={24} sx={{ mr: 1 }} />
                  <Typography>Загрузка ролей...</Typography>
                </Box>
              ) : (
                <Box sx={{ mt: 2 }}>
                  <Stack spacing={2}>
                    {roles.map((role) => (
                      <Paper
                        key={role.id}
                        variant="outlined"
                        sx={{
                          p: 2,
                          cursor: 'pointer',
                          borderColor: selectedRoleId === role.id ? 'primary.main' : 'divider',
                          borderWidth: selectedRoleId === role.id ? 2 : 1,
                          bgcolor: selectedRoleId === role.id ? getRoleColor(role.name) : 'background.paper',
                          transition: 'all 0.2s'
                        }}
                        onClick={() => setSelectedRoleId(role.id)}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Box sx={{ mr: 2, color: getRoleTextColor(role.name) }}>
                            {getRoleIcon(role.name)}
                          </Box>
                          <Box>
                            <Typography variant="subtitle1" fontWeight="medium">
                              {role.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {role.description}
                            </Typography>
                            {selectedRoleId === role.id && (
                              <Chip 
                                label="Выбрано" 
                                size="small" 
                                color="primary" 
                                sx={{ mt: 1 }} 
                                icon={<CheckCircleIcon />} 
                              />
                            )}
                          </Box>
                        </Box>
                      </Paper>
                    ))}
                  </Stack>
                </Box>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button 
            onClick={() => setEditRoleDialogOpen(false)} 
            disabled={roleChangeLoading}
            variant="outlined"
            color="inherit"
          >
            Отмена
          </Button>
          <Button 
            onClick={handleRoleChange} 
            color="primary" 
            disabled={roleChangeLoading || !selectedRoleId || (editingRoleMember?.role?.id === selectedRoleId)}
            variant="contained"
            autoFocus
            startIcon={roleChangeLoading && <CircularProgress size={20} />}
          >
            {roleChangeLoading ? 'Сохранение...' : 'Сохранить изменения'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Уведомление об успешном действии */}
      <Snackbar
        open={!!successMessage}
        autoHideDuration={4000}
        onClose={() => setSuccessMessage(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSuccessMessage(null)} severity="success" sx={{ width: '100%' }}>
          {successMessage}
        </Alert>
      </Snackbar>
    </>
  );
};

export default MembersList; 