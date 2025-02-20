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

interface EditBoardModalProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (updates: { name: string; description: string }) => Promise<void>;
    initialName: string;
    initialDescription: string;
}

export const EditBoardModal: React.FC<EditBoardModalProps> = ({
    open,
    onClose,
    onSubmit,
    initialName,
    initialDescription
}) => {
    const [name, setName] = useState(initialName);
    const [description, setDescription] = useState(initialDescription || '');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    useEffect(() => {
        setHasChanges(
            name !== initialName || 
            description !== (initialDescription || '')
        );
    }, [name, description, initialName, initialDescription]);

    const handleSubmit = async () => {
        if (!name.trim()) {
            setError('Название доски обязательно');
            return;
        }

        try {
            setLoading(true);
            await onSubmit({
                name: name.trim(),
                description: description.trim()
            });
            handleClose();
        } catch (error) {
            console.error('Failed to update board:', error);
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
        setDescription(initialDescription || '');
        setError(null);
        onClose();
    };

    return (
        <>
            <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
                <DialogTitle>Редактировать доску</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
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
                        <TextField
                            label="Описание"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            fullWidth
                            multiline
                            rows={3}
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