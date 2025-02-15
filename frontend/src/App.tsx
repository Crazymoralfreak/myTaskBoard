import { ThemeProvider } from '@mui/material/styles';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { theme } from './theme/theme';
import { HomePage } from './pages/HomePage';
import { AuthPage } from './pages/AuthPage';
import { CreateBoardPage } from './pages/CreateBoardPage';
import { PrivateRoute } from './components/PrivateRoute';
import { BoardPage } from './pages/BoardPage';

function App() {
    return (
        <ThemeProvider theme={theme}>
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
        </ThemeProvider>
    );
}

export default App;