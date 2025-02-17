import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    MenuItem,
    Stack
} from '@mui/material';
import { CreateTaskRequest, TaskPriority } from '../types/task';
import { DatePicker } from '@mui/x-date-pickers';

interface AddTaskModalProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (task: CreateTaskRequest) => Promise<void>;
    columnId?: number;
}

export const AddTaskModal = ({ open, onClose, onSubmit, columnId }: AddTaskModalProps) => {
    const [date, setDate] = useState<Date | null>(null);
    const [formData, setFormData] = useState<Omit<Partial<CreateTaskRequest>, 'dueDate'>>({});
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleSubmit = async () => {
        if (!formData.title?.trim() || !formData.description?.trim()) {
            setErrors({
                ...((!formData.title?.trim()) && { title: 'Title is required' }),
                ...((!formData.description?.trim()) && { description: 'Description is required' })
            });
            return;
        }

        setLoading(true);
        try {
            await onSubmit({ 
                ...formData, 
                columnId,
                dueDate: date?.toISOString()
            } as CreateTaskRequest);
            setFormData({});
            onClose();
        } catch (error: any) {
            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
            }
            console.error('Failed to add task:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Add New Task</DialogTitle>
            <DialogContent>
                <Stack spacing={2} sx={{ mt: 1 }}>
                    <TextField
                        label="Title"
                        fullWidth
                        value={formData.title || ''}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        error={!!errors.title}
                        helperText={errors.title}
                        required
                    />
                    <TextField
                        label="Description"
                        fullWidth
                        multiline
                        rows={4}
                        value={formData.description || ''}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        error={!!errors.description}
                        helperText={errors.description}
                        required
                    />
                    <DatePicker
                        label="Due Date"
                        value={date}
                        onChange={(newDate: Date | null) => setDate(newDate)}
                        slotProps={{ textField: { fullWidth: true } }}
                    />
                    <TextField
                        select
                        label="Priority"
                        fullWidth
                        value={formData.priority || 'NONE'}
                        onChange={(e) => setFormData({ ...formData, priority: e.target.value as TaskPriority })}
                    >
                        <MenuItem value="NONE">None</MenuItem>
                        <MenuItem value="LOW">Low</MenuItem>
                        <MenuItem value="MEDIUM">Medium</MenuItem>
                        <MenuItem value="HIGH">High</MenuItem>
                    </TextField>
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button 
                    onClick={handleSubmit} 
                    variant="contained" 
                    disabled={loading}
                >
                    Create
                </Button>
            </DialogActions>
        </Dialog>
    );
}; 