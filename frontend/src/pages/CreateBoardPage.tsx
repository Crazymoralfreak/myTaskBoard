import React, { useState } from 'react';
import { Container, Paper, TextField, Button, Typography, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { boardService } from '../services/boardService';
import { useLocalization } from '../hooks/useLocalization';

export const CreateBoardPage: React.FC = () => {
    const { t } = useLocalization();
    const [boardData, setBoardData] = useState({ name: '', description: '' });
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const newBoard = await boardService.createBoard(boardData);
            navigate(`/boards/${newBoard.id}`);
        } catch (error) {
            console.error(t('createError'), error);
        }
    };

    return (
        <Container maxWidth="sm">
            <Box sx={{ mt: 4 }}>
                <Paper elevation={3}>
                    <Box sx={{ p: 3 }}>
                        <Typography variant="h5" gutterBottom>
                            {t('createBoard')}
                        </Typography>
                        <Box component="form" onSubmit={handleSubmit}>
                            <TextField
                                fullWidth
                                label={t('boardName')}
                                margin="normal"
                                value={boardData.name}
                                onChange={(e) => setBoardData({ ...boardData, name: e.target.value })}
                                required
                            />
                            <TextField
                                fullWidth
                                label={t('boardDescription')}
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
                                    {t('create')}
                                </Button>
                                <Button
                                    variant="outlined"
                                    color="secondary"
                                    fullWidth
                                    onClick={() => navigate('/')}
                                >
                                    {t('cancel')}
                                </Button>
                            </Box>
                        </Box>
                    </Box>
                </Paper>
            </Box>
        </Container>
    );
}; 