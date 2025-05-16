import React, { useState } from 'react';
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
  SelectChangeEvent
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import EditIcon from '@mui/icons-material/Edit';
import { BoardMember, UpdateMemberRoleRequest } from '../../types/BoardMember';
import { BoardMembersService } from '../../services/BoardMembersService';
import { RolesService } from '../../services/RolesService';
import { Role } from '../../types/Role';

interface MembersListProps {
  boardId: string;
  members: BoardMember[];
  currentUserId: number;
  ownerId?: number;
  isAdmin: boolean;
  onMemberRemoved: (userId: number) => void;
  onMemberRoleChanged: (member: BoardMember) => void;
  onAddMemberClick?: () => void;
}

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
  onAddMemberClick
}) => {
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState<boolean>(false);
  const [memberToDelete, setMemberToDelete] = useState<BoardMember | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loadingRoles, setLoadingRoles] = useState<boolean>(false);
  const [editingRoleMember, setEditingRoleMember] = useState<BoardMember | null>(null);
  const [editRoleDialogOpen, setEditRoleDialogOpen] = useState<boolean>(false);
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [roleChangeLoading, setRoleChangeLoading] = useState<boolean>(false);
  
  // Загружаем роли, когда открывается диалог изменения роли
  React.useEffect(() => {
    if (editRoleDialogOpen) {
      loadRoles();
    }
  }, [editRoleDialogOpen]);
  
  const loadRoles = async () => {
    try {
      setLoadingRoles(true);
      const rolesData = await RolesService.getBoardRoles(boardId);
      setRoles(rolesData);
      
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
  };
  
  const handleRoleChange = async () => {
    if (!editingRoleMember || !selectedRoleId) return;
    
    try {
      setRoleChangeLoading(true);
      
      const request: UpdateMemberRoleRequest = {
        roleId: selectedRoleId
      };
      
      const updatedMember = await BoardMembersService.updateMemberRole(
        boardId, 
        editingRoleMember.userId, 
        request
      );
      
      onMemberRoleChanged(updatedMember);
      setSuccessMessage(`Роль пользователя ${editingRoleMember.displayName || editingRoleMember.username} успешно обновлена`);
      
      // Закрываем диалог
      setEditRoleDialogOpen(false);
      setEditingRoleMember(null);
      setSelectedRoleId(null);
    } catch (err) {
      console.error('Ошибка при обновлении роли участника:', err);
    } finally {
      setRoleChangeLoading(false);
    }
  };
  
  const handleRoleSelectChange = (event: SelectChangeEvent<number>) => {
    setSelectedRoleId(Number(event.target.value));
  };
  
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
          
          {isAdmin && onAddMemberClick && (
            <Button 
              variant="outlined" 
              size="small" 
              startIcon={<PersonAddIcon />}
              onClick={onAddMemberClick}
            >
              Добавить участника
            </Button>
          )}
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
          <List>
            {members.map((member) => (
              <ListItem 
                key={member.userId} 
                divider 
                sx={{ 
                  borderRadius: 1,
                  transition: 'all 0.2s',
                  '&:hover': { 
                    bgcolor: 'action.hover'
                  }
                }}
              >
                <ListItemAvatar>
                  <Avatar 
                    src={member.avatarUrl} 
                    alt={member.username}
                    sx={{ 
                      bgcolor: member.userId === ownerId ? 'primary.main' : 'default'
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
                    </Box>
                  }
                  secondary={
                    <React.Fragment>
                      <Typography variant="body2" color="text.secondary" component="span">
                        {member.email}
                      </Typography>
                      <br />
                      <Box display="flex" alignItems="center" mt={0.5}>
                        <Tooltip 
                          title={member.role?.description || 'Описание роли отсутствует'} 
                          arrow
                          placement="top"
                        >
                          <Chip 
                            label={member.role?.name || 'Без роли'} 
                            size="small"
                            variant="outlined"
                            sx={{ mr: 1 }}
                          />
                        </Tooltip>
                        
                        {member.userId === ownerId && (
                          <Chip 
                            label="Владелец" 
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        )}
                        
                        {isAdmin && member.userId !== ownerId && member.userId !== currentUserId && (
                          <Tooltip title="Изменить роль участника">
                            <IconButton 
                              size="small" 
                              color="primary"
                              onClick={() => handleEditRole(member)}
                              sx={{ ml: 0.5 }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </React.Fragment>
                  }
                />
                
                {isAdmin && member.userId !== ownerId && member.userId !== currentUserId && (
                  <ListItemSecondaryAction>
                    <Tooltip title="Удалить участника">
                      <IconButton 
                        edge="end" 
                        aria-label="delete"
                        color="error"
                        size="small"
                        onClick={() => {
                          setMemberToDelete(member);
                          setConfirmDeleteOpen(true);
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </ListItemSecondaryAction>
                )}
              </ListItem>
            ))}
          </List>
        )}
      </Paper>
      
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
      >
        <DialogTitle>Изменение роли участника</DialogTitle>
        <DialogContent>
          {editingRoleMember && (
            <>
              <Typography gutterBottom>
                Выберите новую роль для пользователя {editingRoleMember.displayName || editingRoleMember.username}:
              </Typography>
              
              {loadingRoles ? (
                <Box display="flex" justifyContent="center" py={2}>
                  <Alert severity="info">Загрузка ролей...</Alert>
                </Box>
              ) : (
                <FormControl fullWidth sx={{ mt: 2 }}>
                  <Select
                    value={selectedRoleId || ''}
                    onChange={handleRoleSelectChange}
                    displayEmpty
                    disabled={roleChangeLoading}
                  >
                    <MenuItem value="" disabled>
                      Выберите роль
                    </MenuItem>
                    {roles.map((role) => (
                      <MenuItem key={role.id} value={role.id}>
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
                </FormControl>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setEditRoleDialogOpen(false)} 
            disabled={roleChangeLoading}
          >
            Отмена
          </Button>
          <Button 
            onClick={handleRoleChange} 
            color="primary" 
            disabled={roleChangeLoading || !selectedRoleId}
            autoFocus
          >
            {roleChangeLoading ? 'Сохранение...' : 'Сохранить'}
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