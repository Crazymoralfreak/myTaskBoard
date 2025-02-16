import React, { useEffect, useState } from 'react';
import { Container, Typography, Button, Grid, Card, CardContent, CardActions, CircularProgress } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { Board } from '../types/board';
import { boardService } from '../services/boardService';
import { getAuthUser } from '../utils/auth';

export const HomePage: React.FC = () => {
    const [boards, setBoards] = useState<Board[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const loadBoards = async () => {
            try {
                const user = getAuthUser();
                if (!user) {
                    navigate('/auth');
                    return;
                }
                
                const loadedBoards = await boardService.getUserBoards(user.id);
                setBoards(loadedBoards || []);
            } catch (err) {
                console.error('Failed to load boards:', err);
                setBoards([]); // В случае ошибки просто показываем пустой список
            } finally {
                setLoading(false);
            }
        };

        loadBoards();
    }, [navigate]);

    const handleCreateBoard = () => {
        navigate('/boards/new');
    };

    const handleBoardClick = (boardId: string) => {
        navigate(`/boards/${boardId}`);
    };

    if (loading) {
        return (
            <Container sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <CircularProgress />
            </Container>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ mt: 4 }}>
            <Grid container spacing={3} alignItems="center" sx={{ mb: 4 }}>
                <Grid item xs>
                    <Typography variant="h4">Мои доски</Typography>
                </Grid>
                <Grid item>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={handleCreateBoard}
                    >
                        Создать доску
                    </Button>
                </Grid>
            </Grid>

            {boards.length === 0 ? (
                <Container sx={{ textAlign: 'center', mt: 8 }}>
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                        У вас пока нет досок
                    </Typography>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={handleCreateBoard}
                        sx={{ mt: 2 }}
                    >
                        Создать первую доску
                    </Button>
                </Container>
            ) : (
                <Grid container spacing={3}>
                    {boards.map((board) => (
                        <Grid item xs={12} sm={6} md={4} key={board.id}>
                            <Card 
                                sx={{ cursor: 'pointer' }}
                                onClick={() => handleBoardClick(board.id)}
                            >
                                <CardContent>
                                    <Typography variant="h6">{board.name}</Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {board.description}
                                    </Typography>
                                </CardContent>
                                <CardActions>
                                    <Button size="small">Открыть</Button>
                                </CardActions>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}
        </Container>
    );
};