import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Button,
  Paper,
  CircularProgress,
  Alert,
  Divider,
  Card,
  CardContent,
  CardActions,
  Avatar,
  Chip
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import InfoIcon from '@mui/icons-material/Info';
import LoginIcon from '@mui/icons-material/Login';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import AssignmentIcon from '@mui/icons-material/Assignment';
import { authService } from '../services/authService';
import { boardService } from '../services/boardService';
import { Role } from '../types/Role';
import { useLocalization } from '../hooks/useLocalization';
import { getRoleDisplayName } from '../utils/roleUtils';
import { useSnackbar } from 'notistack';
import { showInviteNotification, showAuthNotification } from '../utils/notifications';

// Ключ для локального хранилища
const INVITE_TOKEN_STORAGE_KEY = 'pendingInviteToken';

// Интерфейс для данных приглашения
interface InviteData {
  boardId: string;
  boardName: string;
  invitedBy: {
    id: number;
    username: string;
    displayName?: string;
    avatarUrl?: string;
  };
  roleId: number;
  roleName: string;
  isActive: boolean;
}

/**
 * Страница обработки приглашения по ссылке
 */
const InvitePage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLocalization();
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [inviteData, setInviteData] = useState<InviteData | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);
  const [isJustLoggedIn, setIsJustLoggedIn] = useState<boolean>(false);

  // Проверяем наличие параметра just_logged_in в URL
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const justLoggedIn = searchParams.get('just_logged_in') === 'true';
    
    if (justLoggedIn) {
      setIsJustLoggedIn(true);
      
      // Удаляем параметр из URL без перезагрузки страницы
      searchParams.delete('just_logged_in');
      const newUrl = `${location.pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
      window.history.replaceState({}, '', newUrl);
    }
  }, [location]);

  // Сохраняем токен приглашения в localStorage при первом посещении
  useEffect(() => {
    if (token) {
      localStorage.setItem(INVITE_TOKEN_STORAGE_KEY, token);
    }
  }, [token]);

  // Проверяем аутентификацию и получаем данные приглашения
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Проверка аутентификации
        const authenticated = await authService.isAuthenticated();
        setIsAuthenticated(authenticated);
        
        // Получаем токен либо из параметра, либо из localStorage
        const inviteToken = token || localStorage.getItem(INVITE_TOKEN_STORAGE_KEY);
        
        if (!inviteToken) {
          setError(t('inviteLinkInvalid'));
          return;
        }
        
        // В реальном приложении здесь был бы запрос к API для проверки приглашения
        // Имитация получения данных о приглашении
        setTimeout(() => {
          const mockInviteData: InviteData = {
            boardId: 'board-123',
            boardName: 'Проект X',
            invitedBy: {
              id: 1,
              username: 'admin',
              displayName: 'Администратор',
              avatarUrl: ''
            },
            roleId: 3,
            roleName: 'VIEWER',
            isActive: true
          };
          
          setInviteData(mockInviteData);
          setLoading(false);
          
          // Если пользователь только что вошел, автоматически принимаем приглашение
          if (authenticated && isJustLoggedIn) {
            handleAcceptInvite();
          }
        }, 1000);
      } catch (err) {
        console.error('Ошибка при загрузке данных приглашения:', err);
        setError(t('inviteLoadFailed'));
        setLoading(false);
      }
    };
    
    fetchData();
  }, [token, isJustLoggedIn]);

  // Обработчик принятия приглашения
  const handleAcceptInvite = async () => {
    try {
      setLoading(true);
      
      // Получаем токен либо из параметра, либо из localStorage
      const inviteToken = token || localStorage.getItem(INVITE_TOKEN_STORAGE_KEY);
      
      if (!inviteToken || !inviteData) {
        setError(t('inviteInvalidData'));
        return;
      }
      
      // Проверяем, аутентифицирован ли пользователь
      if (!isAuthenticated) {
        setError(t('inviteLoginRequired'));
        setLoading(false);
        return;
      }
      
      // В реальном приложении здесь был бы запрос к API для принятия приглашения
      // Отправляем только токен и информацию о текущем пользователе
      // НЕ используем данные пользователя, создавшего приглашение
      try {
        // Примерная структура запроса
        // const response = await fetch('/api/invite/accept', {
        //   method: 'POST',
        //   headers: {
        //     'Content-Type': 'application/json',
        //     'Authorization': `Bearer ${authService.getToken()}`
        //   },
        //   body: JSON.stringify({ token: inviteToken })
        // });
        
        // Имитация запроса
        setTimeout(() => {
          // После успешного принятия очищаем токен из localStorage
          localStorage.removeItem(INVITE_TOKEN_STORAGE_KEY);
          
          setSuccess(true);
          setLoading(false);
          
          // Перенаправление на доску через 2 секунды после успешного принятия
          setTimeout(() => {
            navigate(`/board/${inviteData.boardId}`);
          }, 2000);
        }, 1000);
      } catch (apiError) {
        console.error('Ошибка API при принятии приглашения:', apiError);
        setError(t('inviteServerError'));
        setLoading(false);
      }
    } catch (err) {
      console.error('Ошибка при принятии приглашения:', err);
      setError(t('inviteAcceptFailed'));
      setLoading(false);
    }
  };

  // Если пользователь не авторизован, показываем опции входа/регистрации
  const renderAuthOptions = () => (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body1">
            Для доступа к доске необходимо войти в систему или зарегистрироваться
          </Typography>
        </Alert>
        
        <Typography variant="body2" color="text.secondary" paragraph>
          После авторизации вы сможете присоединиться к доске "{inviteData?.boardName}" с ролью "{inviteData?.roleName ? getRoleDisplayName(inviteData.roleName, t) : inviteData?.roleName}"
        </Typography>
      </CardContent>
      <CardActions sx={{ justifyContent: 'space-between', p: 2 }}>
        <Button 
          variant="contained" 
          color="primary"
          startIcon={<LoginIcon />}
          component={Link}
          to={`/login?redirect=${encodeURIComponent(`/invite/${token || ''}?just_logged_in=true`)}`}
        >
          Войти
        </Button>
        <Button 
          variant="outlined" 
          color="primary"
          startIcon={<PersonAddIcon />}
          component={Link}
          to={`/register?redirect=${encodeURIComponent(`/invite/${token || ''}?just_logged_in=true`)}`}
        >
          Зарегистрироваться
        </Button>
      </CardActions>
    </Card>
  );

  // Отображение информации о приглашении
  const renderInviteInfo = () => (
    <Box sx={{ mb: 3 }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar
            alt={inviteData?.invitedBy.displayName || inviteData?.invitedBy.username}
            src={inviteData?.invitedBy.avatarUrl}
            sx={{ mr: 2 }}
          />
          <Box>
            <Typography variant="body2" color="text.secondary">
              Вас приглашает:
            </Typography>
            <Typography variant="subtitle1">
              {inviteData?.invitedBy.displayName || inviteData?.invitedBy.username}
            </Typography>
          </Box>
        </Box>
        
        <Divider sx={{ my: 2 }} />
        
        <Typography variant="subtitle1" gutterBottom>
          Информация о приглашении:
        </Typography>
        
        <Box sx={{ mt: 2 }}>
          <Box sx={{ display: 'flex', mb: 1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ minWidth: 150 }}>
              Название доски:
            </Typography>
            <Typography variant="body2" fontWeight="medium">
              {inviteData?.boardName}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', mb: 1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ minWidth: 150 }}>
              Ваша роль:
            </Typography>
            <Chip 
              label={inviteData?.roleName ? getRoleDisplayName(inviteData.roleName, t) : inviteData?.roleName} 
              size="small" 
              color={
                inviteData?.roleName === 'ADMIN' ? 'error' :
                inviteData?.roleName === 'EDITOR' ? 'primary' : 'success'
              }
              variant="outlined"
            />
          </Box>
        </Box>
      </Paper>
      
      {isAuthenticated ? (
        <Button
          variant="contained"
          color="primary"
          size="large"
          fullWidth
          onClick={handleAcceptInvite}
          disabled={loading || success}
          startIcon={loading ? <CircularProgress size={20} /> : <AssignmentIcon />}
        >
          {loading ? 'Присоединение...' : 'Принять приглашение'}
        </Button>
      ) : renderAuthOptions()}
    </Box>
  );

  return (
    <Container maxWidth="sm" sx={{ py: 5 }}>
      <Typography variant="h4" component="h1" gutterBottom align="center">
        Приглашение на доску
      </Typography>
      
      <Box sx={{ mb: 4 }}>
        {loading && !inviteData ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 5 }}>
            <CircularProgress sx={{ mb: 2 }} />
            <Typography variant="body1" color="text.secondary">
              Загрузка информации о приглашении...
            </Typography>
          </Box>
        ) : error ? (
          <Alert severity="error" variant="filled" sx={{ my: 2 }}>
            <Typography variant="subtitle1">{error}</Typography>
            <Typography variant="body2">
              Возможно, ссылка устарела или была деактивирована.
            </Typography>
          </Alert>
        ) : success ? (
          <Alert severity="success" variant="filled" sx={{ my: 2 }}>
            <Typography variant="subtitle1">Вы успешно присоединились к доске!</Typography>
            <Typography variant="body2">
              Перенаправление на доску...
            </Typography>
          </Alert>
        ) : inviteData ? (
          renderInviteInfo()
        ) : null}
      </Box>
    </Container>
  );
};

export default InvitePage; 