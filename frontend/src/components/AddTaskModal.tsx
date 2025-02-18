import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    Box,
    Typography
} from '@mui/material';
import { CreateTaskRequest } from '../types/task';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import ruLocale from 'date-fns/locale/ru';

interface AddTaskModalProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (task: CreateTaskRequest) => void;
}

export const AddTaskModal: React.FC<AddTaskModalProps> = ({
    open,
    onClose,
    onSubmit
}) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = () => {
        // Валидация
        if (!title.trim()) {
            setError('Название задачи обязательно');
            return;
        }

        if (startDate && endDate && startDate > endDate) {
            setError('Дата начала не может быть позже даты окончания');
            return;
        }

        const task: CreateTaskRequest = {
            title: title.trim(),
            description: description.trim(),
            status: 'todo',
            tags: []
        };

        // Добавляем даты только если они установлены
        if (startDate) {
            task.startDate = startDate.toISOString();
        }
        if (endDate) {
            task.endDate = endDate.toISOString();
        }

        onSubmit(task);
        handleClose();
    };

    const handleClose = () => {
        setTitle('');
        setDescription('');
        setStartDate(null);
        setEndDate(null);
        setError(null);
        onClose();
    };

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ruLocale}>
            <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
                <DialogTitle>Создать задачу</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                        <TextField
                            label="Название"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            fullWidth
                            required
                            error={!!error && !title.trim()}
                            helperText={error && !title.trim() ? error : ''}
                        />
                        <TextField
                            label="Описание"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            fullWidth
                            multiline
                            rows={3}
                        />
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <DateTimePicker
                                label="Дата начала"
                                value={startDate}
                                onChange={(newValue) => setStartDate(newValue)}
                                slotProps={{
                                    textField: { fullWidth: true }
                                }}
                            />
                            <DateTimePicker
                                label="Дата окончания"
                                value={endDate}
                                onChange={(newValue) => setEndDate(newValue)}
                                slotProps={{
                                    textField: { 
                                        fullWidth: true,
                                        error: !!error && !!startDate && !!endDate && startDate > endDate,
                                        helperText: error && startDate && endDate && startDate > endDate ? error : ''
                                    }
                                }}
                            />
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>Отмена</Button>
                    <Button onClick={handleSubmit} variant="contained">
                        Создать
                    </Button>
                </DialogActions>
            </Dialog>
        </LocalizationProvider>
    );
}; 