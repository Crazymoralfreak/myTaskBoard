import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Tabs,
  Tab,
  Box,
  Typography,
  Divider,
  CircularProgress,
  Alert
} from '@mui/material';
import InviteLinkGenerator from './InviteLinkGenerator';
import InviteLinksList from './InviteLinksList';
import { Role } from '../../types/Role';
import { InviteLink } from '../../types/inviteLink';
import { InviteLinkService } from '../../services/InviteLinkService';

interface InviteLinkModalProps {
  boardId: string;
  roles: Role[];
  open: boolean;
  onClose: () => void;
}

/**
 * Модальное окно для управления ссылками-приглашениями
 */
const InviteLinkModal: React.FC<InviteLinkModalProps> = ({
  boardId,
  roles,
  open,
  onClose
}) => {
  const [tab, setTab] = useState<number>(0);
  const [inviteLinks, setInviteLinks] = useState<InviteLink[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Загрузка ссылок-приглашений при открытии модального окна
  useEffect(() => {
    if (open) {
      fetchInviteLinks();
    }
  }, [open, boardId]);
  
  const fetchInviteLinks = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const links = await InviteLinkService.getBoardInviteLinks(boardId);
      setInviteLinks(links);
    } catch (err) {
      console.error('Error fetching invite links:', err);
      setError('Не удалось загрузить ссылки-приглашения. Пожалуйста, попробуйте позже.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTab(newValue);
  };
  
  const handleCreateSuccess = () => {
    fetchInviteLinks();
    // Переключаемся на вкладку со ссылками
    setTab(1);
  };
  
  const handleDeleteLink = async (linkId: number) => {
    try {
      await InviteLinkService.deactivateInviteLink(boardId, linkId);
      // Обновляем список ссылок
      await fetchInviteLinks();
    } catch (err) {
      console.error('Error deleting invite link:', err);
      throw err;
    }
  };
  
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      scroll="paper"
      aria-labelledby="invite-link-dialog-title"
    >
      <DialogTitle id="invite-link-dialog-title">
        Управление ссылками-приглашениями
      </DialogTitle>
      
      <Tabs
        value={tab}
        onChange={handleTabChange}
        aria-label="invite links tabs"
        sx={{ borderBottom: 1, borderColor: 'divider', px: 3 }}
      >
        <Tab label="Создать ссылку" />
        <Tab 
          label={`Активные ссылки ${inviteLinks.length > 0 ? `(${inviteLinks.length})` : ''}`} 
        />
      </Tabs>
      
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <Box role="tabpanel" hidden={tab !== 0} sx={{ pt: 1 }}>
          {tab === 0 && (
            <InviteLinkGenerator 
              boardId={boardId} 
              roles={roles} 
              onSuccess={handleCreateSuccess} 
            />
          )}
        </Box>
        
        <Box role="tabpanel" hidden={tab !== 1} sx={{ pt: 1 }}>
          {tab === 1 && (
            <InviteLinksList 
              boardId={boardId} 
              inviteLinks={inviteLinks} 
              loading={loading} 
              onDelete={handleDeleteLink} 
            />
          )}
        </Box>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Закрыть
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default InviteLinkModal; 