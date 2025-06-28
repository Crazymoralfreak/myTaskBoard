import React, { useState } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Chip,
  Tooltip,
  Typography,
  Button,
  CircularProgress,
  Paper,
  Divider,
  Stack,
  Card,
  CardContent,
  TextField,
  InputAdornment,
  Alert
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import { InviteLink } from '../../types/inviteLink';
import { InviteLinkService } from '../../services/InviteLinkService';
import { formatDistanceToNow, formatRelative, isAfter } from 'date-fns';
import { formatDateWithTZ } from '../../utils/formatters';
import { useLocalization } from '../../hooks/useLocalization';

interface InviteLinksListProps {
  boardId: string;
  inviteLinks: InviteLink[];
  loading: boolean;
  onDelete: (linkId: number) => Promise<void>;
}

/**
 * Компонент для отображения списка ссылок-приглашений
 */
const InviteLinksList: React.FC<InviteLinksListProps> = ({
  boardId,
  inviteLinks,
  loading,
  onDelete
}) => {
  const { language, timezone, t } = useLocalization();
  const [copiedLinkId, setCopiedLinkId] = useState<number | null>(null);
  const [deletingLinkId, setDeletingLinkId] = useState<number | null>(null);
  const [copyError, setCopyError] = useState<boolean>(false);
  
  const handleCopyLink = async (link: InviteLink) => {
    try {
      setCopyError(false);
      const success = await InviteLinkService.copyInviteLinkToClipboard(link.inviteUrl);
      
      if (success) {
        setCopiedLinkId(link.id);
        // Очищаем статус "скопировано" через 2 секунды
        setTimeout(() => {
          setCopiedLinkId(null);
        }, 2000);
      } else {
        setCopyError(true);
      }
    } catch (err) {
      console.error('Error copying link:', err);
      setCopyError(true);
    }
  };
  
  const handleDeleteLink = async (linkId: number) => {
    try {
      setDeletingLinkId(linkId);
      await onDelete(linkId);
    } catch (err) {
      console.error('Error deleting link:', err);
    } finally {
      setDeletingLinkId(null);
    }
  };
  
  const isLinkExpired = (link: InviteLink): boolean => {
    if (!link.expiresAt) return false;
    const expirationDate = new Date(link.expiresAt);
    return isAfter(new Date(), expirationDate);
  };
  
  const isLinkMaxUsesExceeded = (link: InviteLink): boolean => {
    if (!link.maxUses) return false;
    return link.useCount >= link.maxUses;
  };
  
  const getLinkStatus = (link: InviteLink) => {
    if (!link.isActive) {
      return { text: 'Деактивирована', color: 'error' as const };
    }
    
    if (isLinkExpired(link)) {
      return { text: 'Истек срок', color: 'error' as const };
    }
    
    if (isLinkMaxUsesExceeded(link)) {
      return { text: 'Лимит исчерпан', color: 'error' as const };
    }
    
    return { text: 'Активна', color: 'success' as const };
  };
  
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" py={4}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (inviteLinks.length === 0) {
    return (
      <Box textAlign="center" py={4}>
        <Typography variant="body1" color="textSecondary">
          Ссылки-приглашения не созданы
        </Typography>
      </Box>
    );
  }
  
  return (
    <Box>
      {copyError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {t('copyError') || 'Не удалось скопировать ссылку. Попробуйте скопировать вручную.'}
        </Alert>
      )}
      
      <List disablePadding>
        {inviteLinks.map((link) => {
          const status = getLinkStatus(link);
          const isExpired = isLinkExpired(link);
          const isMaxUsesExceeded = isLinkMaxUsesExceeded(link);
          const isInactive = !link.isActive || isExpired || isMaxUsesExceeded;
          
          // Форматируем даты
          const createdAt = formatDateWithTZ(link.createdAt, timezone, 'dd.MM.yyyy HH:mm', language);
          let expiresAtText = t('perpetual') || 'Бессрочная';
          if (link.expiresAt) {
            const expiresAtDate = link.expiresAt;
            expiresAtText = isExpired
              ? `${t('expired') || 'Истекла'} ${formatDateWithTZ(expiresAtDate, timezone, 'dd.MM.yyyy HH:mm', language)}`
              : `${t('expires') || 'Истекает'} ${formatDateWithTZ(expiresAtDate, timezone, 'dd.MM.yyyy HH:mm', language)}`;
          }
          
          return (
            <Card key={link.id} variant="outlined" sx={{ mb: 2, opacity: isInactive ? 0.7 : 1 }}>
              <CardContent sx={{ pb: 1 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Chip 
                    label={status.text}
                    color={status.color}
                    size="small"
                    icon={status.color === 'success' ? <CheckCircleIcon /> : <WarningIcon />}
                  />
                  
                  <IconButton 
                    size="small" 
                    onClick={() => handleDeleteLink(link.id)}
                    disabled={deletingLinkId === link.id}
                    color="error"
                  >
                    {deletingLinkId === link.id ? (
                      <CircularProgress size={20} />
                    ) : (
                      <DeleteIcon />
                    )}
                  </IconButton>
                </Box>
                
                <TextField
                  fullWidth
                  size="small"
                  variant="outlined"
                  value={link.inviteUrl}
                  InputProps={{
                    readOnly: true,
                    endAdornment: (
                      <InputAdornment position="end">
                        <Tooltip title={copiedLinkId === link.id ? 'Скопировано!' : 'Копировать'}>
                          <IconButton
                            edge="end"
                            onClick={() => handleCopyLink(link)}
                            disabled={isInactive}
                          >
                            {copiedLinkId === link.id ? (
                              <CheckCircleIcon color="success" />
                            ) : (
                              <ContentCopyIcon />
                            )}
                          </IconButton>
                        </Tooltip>
                      </InputAdornment>
                    ),
                  }}
                  sx={{ mb: 1 }}
                />
                
                <Stack spacing={0.5} direction="column" sx={{ fontSize: '0.875rem' }}>
                  <Box>
                    <Typography variant="caption" color="textSecondary" component="span">
                      Роль: 
                    </Typography>{' '}
                    <Typography variant="caption" component="span" fontWeight="500">
                      {link.defaultRole.name}
                    </Typography>
                  </Box>
                  
                  <Box>
                    <Typography variant="caption" color="textSecondary" component="span">
                      Использования: 
                    </Typography>{' '}
                    <Typography variant="caption" component="span" fontWeight="500">
                      {link.useCount}{link.maxUses ? ` из ${link.maxUses}` : ''}
                    </Typography>
                  </Box>
                  
                  <Box>
                    <Typography variant="caption" color="textSecondary" component="span">
                      Создана: 
                    </Typography>{' '}
                    <Typography variant="caption" component="span" fontWeight="500">
                      {createdAt}
                    </Typography>
                  </Box>
                  
                  <Box>
                    <Typography variant="caption" color="textSecondary" component="span">
                      Срок действия: 
                    </Typography>{' '}
                    <Typography variant="caption" component="span" fontWeight="500">
                      {expiresAtText}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          );
        })}
      </List>
    </Box>
  );
};

export default InviteLinksList; 