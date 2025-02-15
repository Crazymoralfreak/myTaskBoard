import React from 'react';
import { Card, CardContent, Typography, Chip, Box } from '@mui/material';
import { Task } from '../../types/board';

interface TaskCardProps {
    task: Task;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task }) => {
    return (
        <Card sx={{ cursor: 'pointer' }}>
            <CardContent>
                <Typography variant="subtitle2">{task.title}</Typography>
                {task.description && (
                    <Typography 
                        variant="body2" 
                        color="text.secondary"
                        sx={{ mt: 1 }}
                    >
                        {task.description}
                    </Typography>
                )}
                <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                    <Chip 
                        label={task.status} 
                        size="small" 
                        color={task.status === 'completed' ? 'success' : 'default'}
                    />
                    {task.priority && (
                        <Chip 
                            label={task.priority} 
                            size="small" 
                            color={
                                task.priority === 'high' ? 'error' : 
                                task.priority === 'medium' ? 'warning' : 
                                'default'
                            }
                        />
                    )}
                </Box>
            </CardContent>
        </Card>
    );
}; 