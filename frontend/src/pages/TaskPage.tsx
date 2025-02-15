import React from 'react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Task } from '../types';
import { useParams } from 'react-router-dom';
import { useTelegram } from '../hooks/useTelegram';
import { fetchTask } from '../api/api';
import { TextField, Button, Box, Typography } from '@mui/material';

interface TaskFormData {
    title: string;
    description: string;
    priority: number;
    dueDate: string;
}

export const TaskPage: React.FC = () => {
    const { taskId } = useParams<{ taskId: string }>();
    const [task, setTask] = useState<Task | null>(null);
    const { register, handleSubmit } = useForm<TaskFormData>();

    useEffect(() => {
        const loadTask = async () => {
            if (taskId) {
                const taskData = await fetchTask(taskId);
                setTask(taskData);
            }
        };
        loadTask();
    }, [taskId]);

    const onSubmit = async (data: TaskFormData) => {
        // Implement task creation/update logic
        console.log(data);
    };

    if (!task) {
        return <div>Загрузка...</div>;
    }

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
                Создание задачи
            </Typography>
            <form onSubmit={handleSubmit(onSubmit)}>
                <TextField
                    fullWidth
                    label="Название"
                    {...register('title')}
                    margin="normal"
                />
                <TextField
                    fullWidth
                    label="Описание"
                    {...register('description')}
                    margin="normal"
                    multiline
                    rows={4}
                />
                <TextField
                    fullWidth
                    label="Приоритет"
                    type="number"
                    {...register('priority')}
                    margin="normal"
                />
                <TextField
                    fullWidth
                    label="Срок выполнения"
                    type="date"
                    {...register('dueDate')}
                    margin="normal"
                    InputLabelProps={{
                        shrink: true,
                    }}
                />
                <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    sx={{ mt: 2 }}
                >
                    Сохранить
                </Button>
            </form>
        </Box>
    );
};
  