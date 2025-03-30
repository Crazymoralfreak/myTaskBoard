import React from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { CssBaseline } from '@mui/material';
import { SnackbarProvider } from 'notistack';
import { theme } from './theme/theme';
import { HomePage } from './pages/HomePage';
import { AuthPage } from './pages/AuthPage';
import { CreateBoardPage } from './pages/CreateBoardPage';
import { PrivateRoute } from './components/auth';
import { BoardPage } from './pages/BoardPage';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ru } from 'date-fns/locale';

function App() {
    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <SnackbarProvider maxSnack={3}>
                <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ru}>
                    <Router>
                        <Routes>
                            <Route path="/auth" element={<AuthPage />} />
                            <Route
                                path="/"
                                element={
                                    <PrivateRoute>
                                        <HomePage />
                                    </PrivateRoute>
                                }
                            />
                            <Route
                                path="/boards/new"
                                element={
                                    <PrivateRoute>
                                        <CreateBoardPage />
                                    </PrivateRoute>
                                }
                            />
                            <Route
                                path="/boards/:boardId"
                                element={
                                    <PrivateRoute>
                                        <BoardPage />
                                    </PrivateRoute>
                                }
                            />
                            <Route path="*" element={<Navigate to="/" replace />} />
                        </Routes>
                    </Router>
                </LocalizationProvider>
            </SnackbarProvider>
        </ThemeProvider>
    );
}

export default App;