import React, { useEffect, useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Button,
  CircularProgress,
  Box,
  Stack,
  Alert,
  Divider,
  Chip
} from '@mui/material';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import { InviteLinkService } from '../services/InviteLinkService';
import { JoinBoardByInviteResponse } from '../types/inviteLink';
import { useLocalization } from '../hooks/useLocalization';
import { getRoleDisplayName } from '../utils/roleUtils';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import LinkIcon from '@mui/icons-material/Link';

/**
 * Страница для присоединения к доске по ссылке-приглашению
 */
const JoinByInviteLink: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { t } = useLocalization();
  
  const [loading, setLoading] = useState<boolean>(true);
  const [joining, setJoining] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<JoinBoardByInviteResponse | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  
  // Получение информации о ссылке-приглашении при загрузке страницы
  useEffect(() => {
    if (!token) {
      setError('Неверная ссылка-приглашение');
      setLoading(false);
      return;
    }
    
    const fetchInviteLinkInfo = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const info = await InviteLinkService.getInviteLinkInfo(token);
        setResponse(info);
        
        // Если требуется аутентификация
        if (info.requiresAuthentication) {
          setIsAuthenticated(false);
        }
      } catch (err) {
        console.error('Error fetching invite link info:', err);
        setError('Не удалось получить информацию о приглашении. Возможно, ссылка недействительна или истек срок ее действия.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchInviteLinkInfo();
  }, [token]);
  
  // Обработчик присоединения к доске
  const handleJoin = async () => {
    if (!token) return;
    
    try {
      setJoining(true);
      setError(null);
      
      const joinResponse = await InviteLinkService.joinByInviteLink(token);
      setResponse(joinResponse);
      
      // После успешного присоединения перенаправляем на доску
      setTimeout(() => {
        navigate(`/boards/${joinResponse.boardId}`);
      }, 2000);
    } catch (err) {
      console.error('Error joining board:', err);
      setError('Не удалось присоединиться к доске. Пожалуйста, попробуйте позже.');
    } finally {
      setJoining(false);
    }
  };
  
  // Если требуется аутентификация, перенаправляем на страницу входа
  const handleLogin = () => {
    const redirectUrl = `/invite/${token}`;
    navigate(`/login?redirect=${encodeURIComponent(redirectUrl)}`);
  };
  
  // Отображение загрузки
  if (loading) {
    return (
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center">
          <CircularProgress sx={{ mb: 2 }} />
          <Typography variant="body1">
            Получение информации о приглашении...
          </Typography>
        </Box>
      </Container>
    );
  }
  
  // Отображение ошибки
  if (error) {
    return (
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center">
            <ErrorIcon fontSize="large" color="error" sx={{ mb: 2 }} />
            <Typography variant="h5" align="center" gutterBottom>
              Ошибка
            </Typography>
            <Typography variant="body1" align="center" color="text.secondary" paragraph>
              {error}
            </Typography>
            <Button
              component={RouterLink}
              to="/"
              variant="contained"
              color="primary"
              sx={{ mt: 2 }}
            >
              На главную
            </Button>
          </Box>
        </Paper>
      </Container>
    );
  }
  
  // Если пользователь не аутентифицирован
  if (!isAuthenticated) {
    return (
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center">
            <LinkIcon fontSize="large" color="primary" sx={{ mb: 2 }} />
            <Typography variant="h5" align="center" gutterBottom>
              Приглашение на доску
            </Typography>
            <Typography variant="body1" align="center" color="text.secondary" paragraph>
              Для присоединения к доске необходимо войти в систему
            </Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={handleLogin}
              sx={{ mt: 2 }}
            >
              Войти в систему
            </Button>
          </Box>
        </Paper>
      </Container>
    );
  }
  
  // Если пользователь уже является участником доски
  if (response?.alreadyMember) {
    return (
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center">
            <CheckCircleIcon fontSize="large" color="success" sx={{ mb: 2 }} />
            <Typography variant="h5" align="center" gutterBottom>
              Вы уже являетесь участником
            </Typography>
            <Typography variant="body1" align="center" color="text.secondary" paragraph>
              Вы уже являетесь участником доски "{response.boardName}"
            </Typography>
            <Button
              component={RouterLink}
              to={`/boards/${response.boardId}`}
              variant="contained"
              color="primary"
              sx={{ mt: 2 }}
              endIcon={<ArrowForwardIcon />}
            >
              Перейти к доске
            </Button>
          </Box>
        </Paper>
      </Container>
    );
  }
  
  // Стандартное отображение
  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box display="flex" flexDirection="column" alignItems="center" mb={3}>
          <PersonAddIcon fontSize="large" color="primary" sx={{ mb: 2 }} />
          <Typography variant="h5" align="center" gutterBottom>
            Приглашение на доску
          </Typography>
        </Box>
        
        {response && (
          <>
            <Box mb={3}>
              <Typography variant="body1" align="center" color="text.secondary" gutterBottom>
                Вы приглашены присоединиться к доске:
              </Typography>
              <Typography variant="h6" align="center" gutterBottom>
                {response.boardName}
              </Typography>
            </Box>
            
            <Divider sx={{ my: 2 }} />
            
            <Box mb={3}>
              <Stack spacing={1}>
                {response.invitedBy && (
                  <Box display="flex" justifyContent="center">
                    <Typography variant="body2" color="text.secondary" mr={1}>
                      Приглашение от:
                    </Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {response.invitedBy.displayName || response.invitedBy.username}
                    </Typography>
                  </Box>
                )}
                
                {response.assignedRole && (
                  <Box display="flex" justifyContent="center" alignItems="center">
                    <Typography variant="body2" color="text.secondary" mr={1}>
                      Ваша роль:
                    </Typography>
                    <Chip 
                      label={getRoleDisplayName(response.assignedRole.name, t)} 
                      size="small" 
                      color="primary" 
                      variant="outlined"
                    />
                  </Box>
                )}
              </Stack>
            </Box>
          </>
        )}
        
        <Box display="flex" justifyContent="center" mt={3}>
          <Stack spacing={2} direction="column" width="100%">
            <Button
              variant="contained"
              color="primary"
              onClick={handleJoin}
              disabled={joining}
              fullWidth
              size="large"
              startIcon={joining && <CircularProgress size={20} />}
            >
              {joining ? 'Присоединение...' : 'Присоединиться к доске'}
            </Button>
            
            <Button
              component={RouterLink}
              to="/"
              variant="outlined"
              disabled={joining}
              fullWidth
            >
              Отмена
            </Button>
          </Stack>
        </Box>
      </Paper>
    </Container>
  );
};

export default JoinByInviteLink; 