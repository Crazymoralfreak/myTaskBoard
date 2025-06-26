import React, { useState, useEffect } from 'react';
import { 
  Drawer, 
  Box, 
  List, 
  ListItem, 
  ListItemIcon, 
  Tooltip,
  IconButton,
  useMediaQuery,
  useTheme,
  Typography,
  AppBar,
  Toolbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Container,
  Badge
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import SettingsIcon from '@mui/icons-material/Settings';
import PersonIcon from '@mui/icons-material/Person';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import LogoutIcon from '@mui/icons-material/Logout';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../../services/authService';
import NotificationBell from '../notifications/NotificationBell';
import { useWebSocket } from '../../context/WebSocketContext';
import { useLocalization } from '../../hooks/useLocalization';

interface SidebarProps {
  children: React.ReactNode;
}

const DRAWER_WIDTH = 72; // Уменьшаем ширину для отображения только иконок

export const Sidebar: React.FC<SidebarProps> = ({ children }) => {
  const { t } = useLocalization();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [isOpen, setIsOpen] = useState(!isMobile);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Используем WebSocket для real-time обновления счетчика
  const { unreadCount, isConnected } = useWebSocket();

  const handleToggleDrawer = () => {
    setIsOpen(!isOpen);
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    if (isMobile) {
      setIsOpen(false);
    }
  };
  
  const handleLogoutClick = () => {
    setLogoutDialogOpen(true);
  };
  
  const handleLogoutConfirm = async () => {
    try {
      await authService.logout();
      setLogoutDialogOpen(false);
      navigate('/auth', { replace: true });
    } catch (error) {
      console.error(t('logoutError'), error);
    }
  };
  
  const handleLogoutCancel = () => {
    setLogoutDialogOpen(false);
  };

  const menuItems = [
    { text: t('boards'), icon: <DashboardIcon />, path: '/' },
    { 
      text: t('notifications'), 
      icon: (
        <Badge badgeContent={unreadCount || 0} color="error">
          <NotificationsIcon />
        </Badge>
      ), 
      path: '/notifications' 
    },
    { text: t('settings'), icon: <SettingsIcon />, path: '/settings' },
    { text: t('profile'), icon: <PersonIcon />, path: '/profile' },
  ];

  const isSelected = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  // Получаем токен для NotificationBell
  const token = authService.getToken();

  const drawer = (
    <Box sx={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      <Box sx={{ p: 1, textAlign: 'center' }}>
        <IconButton onClick={handleToggleDrawer}>
          <ChevronLeftIcon />
        </IconButton>
      </Box>
      
      <List sx={{ flexGrow: 1 }}>
        {menuItems.map((item) => (
          <Tooltip key={item.text} title={item.text} placement="right">
            <ListItem
              button
              onClick={() => handleNavigate(item.path)}
              selected={isSelected(item.path)}
              sx={{
                minHeight: 48,
                justifyContent: 'center',
                px: 2.5,
                '&.Mui-selected': {
                  backgroundColor: theme.palette.primary.light,
                  '&:hover': {
                    backgroundColor: theme.palette.primary.light,
                  },
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  justifyContent: 'center',
                  color: isSelected(item.path)
                    ? theme.palette.primary.main
                    : 'inherit',
                }}
              >
                {item.icon}
              </ListItemIcon>
            </ListItem>
          </Tooltip>
        ))}
      </List>

      <List>
        <Tooltip title={t('logout')} placement="right">
          <ListItem
            button
            onClick={handleLogoutClick}
            sx={{
              minHeight: 48,
              justifyContent: 'center',
              px: 2.5,
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: 0,
                justifyContent: 'center',
              }}
            >
              <LogoutIcon />
            </ListItemIcon>
          </ListItem>
        </Tooltip>
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      {/* Мобильная шапка с кнопкой меню */}
      <AppBar
        position="fixed"
        sx={{
          display: { xs: 'block', md: 'none' },
          width: '100%',
          zIndex: (theme) => theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleToggleDrawer}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {t('taskboard')}
          </Typography>
          {/* Колокольчик уведомлений в мобильной шапке */}
          {token && <NotificationBell token={token} />}
        </Toolbar>
      </AppBar>

      {/* Боковое меню */}
      <Drawer
        variant={isMobile ? 'temporary' : 'permanent'}
        open={isOpen}
        onClose={() => setIsOpen(false)}
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
            overflowX: 'hidden',
          },
        }}
      >
        {drawer}
      </Drawer>

      {/* Основной контент */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          marginLeft: { md: `${DRAWER_WIDTH}px` },
          mt: { xs: 8, md: 0 }
        }}
      >
        <Container maxWidth="xl" sx={{ pt: 3, pb: 3 }}>
            {children}
        </Container>
      </Box>

      {/* Диалог подтверждения выхода */}
      <Dialog
        open={logoutDialogOpen}
        onClose={handleLogoutCancel}
      >
        <DialogTitle>{t('logoutDialogTitle')}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t('logoutConfirm')}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleLogoutCancel}>{t('cancel')}</Button>
          <Button onClick={handleLogoutConfirm} color="primary" autoFocus>
            {t('logout')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}; 