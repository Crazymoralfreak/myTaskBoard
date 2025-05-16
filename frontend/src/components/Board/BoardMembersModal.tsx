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
  IconButton
} from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { BoardMembersService } from '../../services/BoardMembersService';
import { BoardMember, AddBoardMemberRequest } from '../../types/BoardMember';
import { RolesService } from '../../services/RolesService';
import { Role } from '../../types/Role';
import MembersList from './MembersList';
import InviteForm from './InviteForm';
import { useTokenRefresh } from '../../hooks/useTokenRefresh';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';

interface BoardMembersModalProps {
  open: boolean;
  onClose: () => void;
  boardId: string;
  currentUserId: number;
  ownerId?: number;
  isAdmin: boolean;
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
  isAdmin
}) => {
  const [activeTab, setActiveTab] = useState<number>(0);
  const [members, setMembers] = useState<BoardMember[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Используем хук для обновления токена
  const { isRefreshing, error: tokenError } = useTokenRefresh(open);
  
  // Обновляем состояние ошибки, если есть ошибка обновления токена
  useEffect(() => {
    if (tokenError) {
      setError(prev => prev || tokenError);
    }
  }, [tokenError]);
  
  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open, boardId]);
  
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
  
  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };
  
  const handleAddMember = async (request: AddBoardMemberRequest) => {
    try {
      setLoading(true);
      const newMember = await BoardMembersService.addMemberToBoard(boardId, request);
      setMembers((prev) => [...prev, newMember]);
      
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
  };
  
  const handleMemberRoleChanged = (updatedMember: BoardMember) => {
    setMembers((prev) => 
      prev.map(member => 
        member.userId === updatedMember.userId ? updatedMember : member
      )
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
        <Box sx={{ mb: 1 }}>
          <Typography variant="h6" component="h2" fontWeight="bold" gutterBottom>
            Управление участниками доски
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Просматривайте, добавляйте и удаляйте участников доски
          </Typography>
        </Box>
      </DialogTitle>

      {/* Вкладки и кнопка добавления участника */}
      <Box sx={{ px: 3, pb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab label="Участники" icon={<PeopleAltIcon />} iconPosition="start" />
          <Tab label="Добавить участника" icon={<PersonAddIcon />} iconPosition="start" />
        </Tabs>
      </Box>
      
      <Divider />
      
      <DialogContent dividers>
        {loading && (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
            <CircularProgress />
          </Box>
        )}
        
        {error && !loading && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {!loading && !error && (
          <>
            {/* Вкладка со списком участников */}
            {activeTab === 0 && (
              <>
                {members.length > 0 ? (
                  <MembersList
                    boardId={boardId}
                    members={members}
                    currentUserId={currentUserId}
                    ownerId={ownerId}
                    isAdmin={true}
                    onMemberRemoved={handleMemberRemoved}
                    onMemberRoleChanged={handleMemberRoleChanged}
                    onAddMemberClick={() => setActiveTab(1)}
                  />
                ) : (
                  <Box textAlign="center" py={4}>
                    <Typography variant="body1" color="text.secondary" gutterBottom>
                      Нет участников для отображения
                    </Typography>
                    <Button 
                      variant="contained" 
                      color="primary"
                      startIcon={<PersonAddIcon />}
                      onClick={() => setActiveTab(1)}
                      sx={{ mt: 2 }}
                    >
                      Добавить первого участника
                    </Button>
                  </Box>
                )}
              </>
            )}
            
            {/* Вкладка с формой приглашения */}
            {activeTab === 1 && (
              <InviteForm
                boardId={boardId}
                roles={roles}
                onInvite={handleAddMember}
              />
            )}
          </>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Закрыть
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BoardMembersModal; 