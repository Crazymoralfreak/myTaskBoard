import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    CircularProgress
} from '@mui/material';

type ActionType = 'delete' | 'edit' | 'save';

interface ConfirmDialogProps {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    loading?: boolean;
    actionType?: ActionType;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
    open,
    onClose,
    onConfirm,
    title,
    message,
    loading = false,
    actionType = 'delete'
}) => {
    const getActionColor = () => {
        switch (actionType) {
            case 'delete':
                return 'error';
            case 'edit':
            case 'save':
                return 'primary';
            default:
                return 'primary';
        }
    };

    const getActionText = () => {
        switch (actionType) {
            case 'delete':
                return loading ? 'Удаление...' : 'Удалить';
            case 'edit':
                return loading ? 'Сохранение...' : 'Сохранить изменения';
            case 'save':
                return loading ? 'Сохранение...' : 'Сохранить';
            default:
                return loading ? 'Подтверждение...' : 'Подтвердить';
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>{title}</DialogTitle>
            <DialogContent>
                <Typography>{message}</Typography>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} disabled={loading}>Отмена</Button>
                <Button 
                    onClick={onConfirm} 
                    variant="contained" 
                    color={getActionColor()}
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} /> : null}
                >
                    {getActionText()}
                </Button>
            </DialogActions>
        </Dialog>
    );
}; 