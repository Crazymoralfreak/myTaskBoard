import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    Box,
    CircularProgress
} from '@mui/material';
import { ConfirmDialog } from './ConfirmDialog';

interface EditColumnModalProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (name: string) => Promise<void>;
    initialName: string;
}

export const EditColumnModal: React.FC<EditColumnModalProps> = ({
    open,
    onClose,
    onSubmit,
    initialName
}) => {
    const [name, setName] = useState(initialName);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    useEffect(() => {
        setHasChanges(name !== initialName);
    }, [name, initialName]);

    const handleSubmit = async () => {
        if (!name.trim()) {
            setError('Название колонки обязательно');
            return;
        }

        try {
            setLoading(true);
            await onSubmit(name.trim());
            handleClose();
        } catch (error) {
            console.error('Failed to update column:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        if (loading) return;
        
        if (hasChanges) {
            setShowConfirm(true);
            return;
        }

        resetAndClose();
    };

    const resetAndClose = () => {
        setName(initialName);
        setError(null);
        onClose();
    };

    return (
        <>
            <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
                <DialogTitle>Редактировать колонку</DialogTitle>
                <DialogContent>
                    <Box sx={{ mt: 1 }}>
                        <TextField
                            label="Название"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            fullWidth
                            required
                            error={!!error && !name.trim()}
                            helperText={error && !name.trim() ? error : ''}
                            disabled={loading}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose} disabled={loading}>Отмена</Button>
                    <Button 
                        onClick={handleSubmit} 
                        variant="contained"
                        disabled={loading}
                        startIcon={loading ? <CircularProgress size={20} /> : null}
                    >
                        {loading ? 'Сохранение...' : 'Сохранить'}
                    </Button>
                </DialogActions>
            </Dialog>

            <ConfirmDialog
                open={showConfirm}
                onClose={() => setShowConfirm(false)}
                onConfirm={() => {
                    setShowConfirm(false);
                    resetAndClose();
                }}
                title="Несохраненные изменения"
                message="У вас есть несохраненные изменения. Вы уверены, что хотите закрыть окно без сохранения?"
                actionType="edit"
            />
        </>
    );
}; 