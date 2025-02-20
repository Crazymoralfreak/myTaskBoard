import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button
} from '@mui/material';

interface AddColumnModalProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (name: string) => void;
}

export const AddColumnModal: React.FC<AddColumnModalProps> = ({ open, onClose, onSubmit }) => {
    const [name, setName] = useState('');

    const handleSubmit = () => {
        if (name.trim()) {
            onSubmit(name);
            setName('');
            onClose();
        }
    };

    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>Создание новой колонки</DialogTitle>
            <DialogContent>
                <TextField
                    autoFocus
                    margin="dense"
                    label="Название колонки"
                    fullWidth
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
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