import React, { useCallback, useState, useMemo } from 'react';
import { Box, Typography, CircularProgress, Alert } from '@mui/material';
import { FixedSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { Task } from '../../../types/task';
import { TaskCard } from '../TaskCard/TaskCard';
import { TaskType, BoardStatus } from '../../../types/board';

interface TaskListProps {
    tasks: Task[];
    boardStatuses: BoardStatus[];
    taskTypes: TaskType[];
    loading: boolean;
    error?: string;
    onTaskStatusChange: (taskId: number, statusId: number) => void;
    onTaskUpdate: (task: Task) => void;
    onTaskDelete: (taskId: number) => void;
}

export const TaskList: React.FC<TaskListProps> = ({
    tasks,
    boardStatuses,
    taskTypes,
    loading,
    error,
    onTaskStatusChange,
    onTaskUpdate,
    onTaskDelete
}) => {
    // Задаем примерную высоту для карточки задачи (будет корректироваться)
    const estimatedTaskCardHeight = 150;
    
    // Мемоизируем функцию рендеринга задачи для виртуализированного списка
    const renderTask = useCallback(({ index, style }) => {
        const task = tasks[index];
        if (!task) return null;
        
        return (
            <div style={style}>
                <TaskCard
                    key={task.id}
                    task={task}
                    boardStatuses={boardStatuses}
                    taskTypes={taskTypes}
                    onTaskStatusChange={onTaskStatusChange}
                    onTaskUpdate={onTaskUpdate}
                    onTaskDelete={onTaskDelete}
                />
            </div>
        );
    }, [tasks, boardStatuses, taskTypes, onTaskStatusChange, onTaskUpdate, onTaskDelete]);
    
    // Проверяем статус загрузки и наличие ошибок
    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
            </Box>
        );
    }
    
    if (error) {
        return (
            <Alert severity="error" sx={{ mt: 2 }}>
                {error}
            </Alert>
        );
    }
    
    if (tasks.length === 0) {
        return (
            <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body1" color="text.secondary">
                    Нет задач для отображения
                </Typography>
            </Box>
        );
    }
    
    return (
        <Box sx={{ height: '100%', width: '100%' }}>
            <AutoSizer>
                {({ height, width }) => (
                    <List
                        height={height || 500}
                        width={width || 300}
                        itemCount={tasks.length}
                        itemSize={estimatedTaskCardHeight}
                        overscanCount={3}
                    >
                        {renderTask}
                    </List>
                )}
            </AutoSizer>
        </Box>
    );
}; 