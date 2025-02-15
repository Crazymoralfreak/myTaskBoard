import React from 'react';
import { 
    Paper, 
    Typography, 
    IconButton, 
    Box,
    Button 
} from '@mui/material';
import {
    ChevronLeft as ChevronLeftIcon,
    ChevronRight as ChevronRightIcon,
    Add as AddIcon,
    MoreVert as MoreVertIcon
} from '@mui/icons-material';
import { Column } from '../../types/board';
import { TaskCard } from '../TaskCard';

interface BoardColumnProps {
    column: Column;
    onMove: (newPosition: number) => void;
    canMoveLeft: boolean;
    canMoveRight: boolean;
}

export const BoardColumn: React.FC<BoardColumnProps> = ({
    column,
    onMove,
    canMoveLeft,
    canMoveRight
}) => {
    const handleMove = (position: number) => {
        onMove(position);
    };

    return (
        <Paper 
            sx={{ 
                width: 280,
                minWidth: 280,
                maxHeight: '100%',
                display: 'flex',
                flexDirection: 'column'
            }}
        >
            <Box sx={{ 
                p: 2, 
                display: 'flex', 
                alignItems: 'center',
                borderBottom: '1px solid',
                borderColor: 'divider'
            }}>
                <IconButton 
                    size="small" 
                    disabled={!canMoveLeft}
                    onClick={() => handleMove(column.position - 1)}
                >
                    <ChevronLeftIcon />
                </IconButton>
                <Typography 
                    variant="subtitle1" 
                    sx={{ 
                        flexGrow: 1,
                        textAlign: 'center',
                        fontWeight: 'medium'
                    }}
                >
                    {column.name}
                </Typography>
                <IconButton 
                    size="small"
                    disabled={!canMoveRight}
                    onClick={() => handleMove(column.position + 1)}
                >
                    <ChevronRightIcon />
                </IconButton>
                <IconButton size="small">
                    <MoreVertIcon />
                </IconButton>
            </Box>

            <Box sx={{ 
                p: 1,
                flexGrow: 1,
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: 1
            }}>
                {column.tasks.map((task) => (
                    <TaskCard key={task.id} task={task} />
                ))}
            </Box>

            <Button
                startIcon={<AddIcon />}
                sx={{ m: 1 }}
                variant="outlined"
                size="small"
            >
                Добавить карточку
            </Button>
        </Paper>
    );
}; 