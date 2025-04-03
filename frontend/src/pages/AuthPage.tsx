import React, { useState } from 'react';
import { Container, Paper, Tabs, Tab, Box, TextField, Button, Typography } from '@mui/material';
import { TelegramLogin } from '../components/auth/TelegramLogin';
import { authService } from '../services/authService';
import { useNavigate } from 'react-router-dom';

interface TelegramAuthResponse {
    token: string;
    user_id: number;
    first_name?: string;
    username?: string;
}

export const AuthPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<number>(0);
    const [loginData, setLoginData] = useState({ email: '', password: '' });
    const [registerData, setRegisterData] = useState({ email: '', password: '', name: '' });
    const navigate = useNavigate();

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setActiveTab(newValue);
    };

    const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        try {
            const response = await authService.login(loginData.email, loginData.password);
            if (response.token) {
                navigate('/');
            }
        } catch (error) {
            console.error('Login failed:', error);
        }
    };

    const handleRegister = async (event: React.FormEvent) => {
        event.preventDefault();
        try {
            const response = await authService.register(registerData.email, registerData.password, registerData.name);
            if (response.token) {
                localStorage.setItem('token', response.token);
                localStorage.setItem('user', JSON.stringify(response.user));
                navigate('/boards');
            }
        } catch (error) {
            console.error('Registration failed:', error);
        }
    };

    const handleTelegramAuth = (authResponse: TelegramAuthResponse) => {
        console.log('Telegram auth response:', authResponse);
        if (authResponse.token) {
            localStorage.setItem('token', authResponse.token);
            navigate('/');
        } else {
            console.error('Invalid Telegram auth response:', authResponse);
        }
    };

    return (
        <Container maxWidth="sm">
            <Box sx={{ mt: 8 }}>
                <Paper elevation={3}>
                    <Box sx={{ p: 3 }}>
                        <Typography variant="h4" align="center" gutterBottom>
                            MyTaskBoard
                        </Typography>
                        
                        <Box sx={{ mb: 3 }}>
                            <TelegramLogin
                                botName={import.meta.env.VITE_BOT_NAME}
                                onAuth={handleTelegramAuth}
                            />
                        </Box>

                        <Tabs value={activeTab} onChange={handleTabChange} centered>
                            <Tab label="Вход" />
                            <Tab label="Регистрация" />
                        </Tabs>

                        {activeTab === 0 && (
                            <Box component="form" onSubmit={handleLogin} sx={{ mt: 3 }}>
                                <TextField
                                    fullWidth
                                    label="Email"
                                    type="email"
                                    margin="normal"
                                    value={loginData.email}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLoginData({ ...loginData, email: e.target.value })}
                                    required
                                />
                                <TextField
                                    fullWidth
                                    label="Пароль"
                                    type="password"
                                    margin="normal"
                                    value={loginData.password}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLoginData({ ...loginData, password: e.target.value })}
                                    required
                                />
                                <Button
                                    type="submit"
                                    fullWidth
                                    variant="contained"
                                    sx={{ mt: 3 }}
                                >
                                    Войти
                                </Button>
                            </Box>
                        )}

                        {activeTab === 1 && (
                            <Box component="form" onSubmit={handleRegister} sx={{ mt: 3 }}>
                                <TextField
                                    fullWidth
                                    label="Имя"
                                    margin="normal"
                                    value={registerData.name}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRegisterData({ ...registerData, name: e.target.value })}
                                    required
                                />
                                <TextField
                                    fullWidth
                                    label="Email"
                                    type="email"
                                    margin="normal"
                                    value={registerData.email}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRegisterData({ ...registerData, email: e.target.value })}
                                    required
                                />
                                <TextField
                                    fullWidth
                                    label="Пароль"
                                    type="password"
                                    margin="normal"
                                    value={registerData.password}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRegisterData({ ...registerData, password: e.target.value })}
                                    required
                                />
                                <Button
                                    type="submit"
                                    fullWidth
                                    variant="contained"
                                    sx={{ mt: 3 }}
                                >
                                    Зарегистрироваться
                                </Button>
                            </Box>
                        )}
                    </Box>
                </Paper>
            </Box>
        </Container>
    );
};