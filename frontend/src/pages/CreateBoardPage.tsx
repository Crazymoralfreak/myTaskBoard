import React, { useState } from 'react';
import { Container, Paper, TextField, Button, Typography, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { boardService } from '../services/boardService';

export const CreateBoardPage: React.FC = () => {
    const [boardData, setBoardData] = useState({ name: '', description: '' });
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const newBoard = await boardService.createBoard(boardData);
            navigate(`/boards/${newBoard.id}`);
        } catch (error) {
            console.error('Failed to create board:', error);
        }
    };

    return (
        <Container maxWidth="sm">
            <Box sx={{ mt: 4 }}>
                <Paper elevation={3}>
                    <Box sx={{ p: 3 }}>
                        <Typography variant="h5" gutterBottom>
                            Создание новой доски
                        </Typography>
                        <Box component="form" onSubmit={handleSubmit}>
                            <TextField
                                fullWidth
                                label="Название"
                                margin="normal"
                                value={boardData.name}
                                onChange={(e) => setBoardData({ ...boardData, name: e.target.value })}
                                required
                            />
                            <TextField
                                fullWidth
                                label="Описание"
                                margin="normal"
                                multiline
                                rows={4}
                                value={boardData.description}
                                onChange={(e) => setBoardData({ ...boardData, description: e.target.value })}
                            />
                            <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                                <Button
                                    type="submit"
                                    variant="contained"
                                    color="primary"
                                    fullWidth
                                >
                                    Создать
                                </Button>
                                <Button
                                    variant="outlined"
                                    color="secondary"
                                    fullWidth
                                    onClick={() => navigate('/')}
                                >
                                    Отмена
                                </Button>
                            </Box>
                        </Box>
                    </Box>
                </Paper>
            </Box>
        </Container>
    );
}; 