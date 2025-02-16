import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button
} from '@mui/material';

interface AddTaskModalProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (title: string) => void;
}

export const AddTaskModal: React.FC<AddTaskModalProps> = ({ open, onClose, onSubmit }) => {
    const [title, setTitle] = useState('');

    const handleSubmit = () => {
        if (title.trim()) {
            onSubmit(title);
            setTitle('');
            onClose();
        }
    };

    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>Создание новой карточки</DialogTitle>
            <DialogContent>
                <TextField
                    autoFocus
                    margin="dense"
                    label="Название карточки"
                    fullWidth
                    multiline
                    rows={3}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Отмена</Button>
                <Button onClick={handleSubmit} variant="contained" color="primary">
                    Создать
                </Button>
            </DialogActions>
        </Dialog>
    );
}; 