import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    Box,
    Typography,
    FormHelperText
} from '@mui/material';
import { CreateTaskRequest } from '../../../types/task';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import ruLocale from 'date-fns/locale/ru';

interface AddTaskModalProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (task: Omit<CreateTaskRequest, 'columnId'>) => void;
    columnId: string;
}

export const AddTaskModal: React.FC<AddTaskModalProps> = ({
    open,
    onClose,
    onSubmit,
    columnId
}) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);
    const [errors, setErrors] = useState<{
        title?: string;
        dates?: string;
    }>({});

    const validateForm = (): boolean => {
        const newErrors: { title?: string; dates?: string } = {};

        if (!title.trim()) {
            newErrors.title = 'Название задачи обязательно';
        }

        if (startDate && endDate && startDate > endDate) {
            newErrors.dates = 'Дата начала не может быть позже даты окончания';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = () => {
        if (!validateForm()) {
            return;
        }

        const task: Omit<CreateTaskRequest, 'columnId'> = {
            title: title.trim(),
            description: description.trim(),
            status: 'todo',
            priority: 'NONE',
            tags: []
        };

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
        setErrors({});
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
                            onChange={(e) => {
                                setTitle(e.target.value);
                                if (errors.title) {
                                    setErrors(prev => ({ ...prev, title: undefined }));
                                }
                            }}
                            fullWidth
                            required
                            error={!!errors.title}
                            helperText={errors.title}
                        />
                        <TextField
                            label="Описание"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            fullWidth
                            multiline
                            rows={3}
                        />
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <DateTimePicker
                                    label="Дата начала"
                                    value={startDate}
                                    onChange={(newValue) => {
                                        setStartDate(newValue);
                                        if (errors.dates) {
                                            setErrors(prev => ({ ...prev, dates: undefined }));
                                        }
                                    }}
                                    slotProps={{
                                        textField: { 
                                            fullWidth: true,
                                            error: !!errors.dates
                                        }
                                    }}
                                />
                                <DateTimePicker
                                    label="Дата окончания"
                                    value={endDate}
                                    onChange={(newValue) => {
                                        setEndDate(newValue);
                                        if (errors.dates) {
                                            setErrors(prev => ({ ...prev, dates: undefined }));
                                        }
                                    }}
                                    slotProps={{
                                        textField: { 
                                            fullWidth: true,
                                            error: !!errors.dates
                                        }
                                    }}
                                />
                            </Box>
                            {errors.dates && (
                                <FormHelperText error>{errors.dates}</FormHelperText>
                            )}
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