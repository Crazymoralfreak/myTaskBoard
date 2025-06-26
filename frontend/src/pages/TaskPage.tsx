import React from 'react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Task } from '../types';
import { useParams } from 'react-router-dom';
import { useTelegram } from '../hooks/useTelegram';
import { fetchTask } from '../api/api';
import { TextField, Button, Box, Typography } from '@mui/material';
import { useLocalization } from '../hooks/useLocalization';

interface TaskFormData {
    title: string;
    description: string;
    priority: number;
    dueDate: string;
}

export const TaskPage: React.FC = () => {
    const { t } = useLocalization();
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
        return <div>{t('loading')}</div>;
    }

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
                {t('createTask')}
            </Typography>
            <form onSubmit={handleSubmit(onSubmit)}>
                <TextField
                    fullWidth
                    label={t('taskTitle')}
                    {...register('title')}
                    margin="normal"
                />
                <TextField
                    fullWidth
                    label={t('taskDescription')}
                    {...register('description')}
                    margin="normal"
                    multiline
                    rows={4}
                />
                <TextField
                    fullWidth
                    label={t('taskPriority')}
                    type="number"
                    {...register('priority')}
                    margin="normal"
                />
                <TextField
                    fullWidth
                    label={t('taskDueDate')}
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
                    {t('save')}
                </Button>
            </form>
        </Box>
    );
};
  