import React, { useEffect } from 'react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { SnackbarProvider } from 'notistack';
import { HomePage } from './pages/HomePage';
import { AuthPage } from './pages/AuthPage';
import { CreateBoardPage } from './pages/CreateBoardPage';
import { PrivateRoute } from './components/auth';
import { BoardPage } from './pages/BoardPage';
import { ProfilePage } from './pages/ProfilePage';
import { SettingsPage } from './pages/SettingsPage';
import NotificationsPage from './pages/Notifications';

import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ru } from 'date-fns/locale';
import { ConfirmDialogProvider } from './context/ConfirmDialogContext';
import { migrateLocalStorageToApi } from './utils/localStorageMigration';
import { authService } from './services/authService';
import { Layout } from './components/layout/Layout';
import { CustomThemeProvider } from './context/ThemeContext';
import { RoleProvider } from './contexts/RoleContext';
import { WebSocketProvider } from './context/WebSocketContext';
import { AppLocalizationProvider } from './contexts/LocalizationContext';

function App() {
    // Запуск миграции данных при инициализации приложения
    useEffect(() => {
        // Проверяем, авторизован ли пользователь
        if (authService.isAuthenticated()) {
            // Выполняем миграцию из localStorage в API
            migrateLocalStorageToApi().catch(error => {
                console.error('Ошибка при миграции данных:', error);
            });
        }
    }, []);

    return (
        <RoleProvider>
            <CustomThemeProvider>
                <AppLocalizationProvider>
                    <CssBaseline />
                    <SnackbarProvider maxSnack={3}>
                        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ru}>
                            <ConfirmDialogProvider>
                            <WebSocketProvider>
                                <Router>
                                    <Routes>
                                        <Route path="/auth" element={<AuthPage />} />
                                        <Route
                                            path="/"
                                            element={
                                                <PrivateRoute>
                                                    <Layout>
                                                        <HomePage />
                                                    </Layout>
                                                </PrivateRoute>
                                            }
                                        />
                                        <Route
                                            path="/notifications"
                                            element={
                                                <PrivateRoute>
                                                    <Layout>
                                                        <NotificationsPage />
                                                    </Layout>
                                                </PrivateRoute>
                                            }
                                        />
                                        <Route
                                            path="/boards/new"
                                            element={
                                                <PrivateRoute>
                                                    <Layout>
                                                        <CreateBoardPage />
                                                    </Layout>
                                                </PrivateRoute>
                                            }
                                        />
                                        <Route
                                            path="/boards/:boardId"
                                            element={
                                                <PrivateRoute>
                                                    <Layout>
                                                        <BoardPage />
                                                    </Layout>
                                                </PrivateRoute>
                                            }
                                        />
                                        <Route
                                            path="/settings"
                                            element={
                                                <PrivateRoute>
                                                    <Layout>
                                                        <SettingsPage />
                                                    </Layout>
                                                </PrivateRoute>
                                            }
                                        />
                                        <Route
                                            path="/profile"
                                            element={
                                                <PrivateRoute>
                                                    <Layout>
                                                        <ProfilePage />
                                                    </Layout>
                                                </PrivateRoute>
                                            }
                                        />
                                        <Route path="*" element={<Navigate to="/" replace />} />
                                    </Routes>
                                </Router>
                            </WebSocketProvider>
                            </ConfirmDialogProvider>
                        </LocalizationProvider>
                    </SnackbarProvider>
                </AppLocalizationProvider>
            </CustomThemeProvider>
        </RoleProvider>
    );
}

export default App;