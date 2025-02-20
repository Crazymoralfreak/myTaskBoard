import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    Box,
    CircularProgress,
    Typography
} from '@mui/material';

interface EditColumnModalProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (name: string, color: string) => Promise<void>;
    initialName: string;
    initialColor: string;
}

export const EditColumnModal: React.FC<EditColumnModalProps> = ({
    open,
    onClose,
    onSubmit,
    initialName,
    initialColor
}) => {
    const [name, setName] = useState(initialName);
    const [color, setColor] = useState(initialColor);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setName(initialName);
        setColor(initialColor);
    }, [initialName, initialColor]);

    const handleSubmit = async () => {
        if (!name.trim()) {
            setError('Название колонки обязательно');
            return;
        }

        try {
            setLoading(true);
            await onSubmit(name.trim(), color);
            handleClose();
        } catch (error) {
            console.error('Failed to update column:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        if (loading) return;
        setName(initialName);
        setColor(initialColor);
        setError(null);
        onClose();
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle>Редактировать колонку</DialogTitle>
            <DialogContent>
                <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
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
                    <Box>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            Цвет колонки
                        </Typography>
                        <input
                            type="color"
                            value={color}
                            onChange={(e) => setColor(e.target.value)}
                            style={{ 
                                width: '100%', 
                                height: '40px',
                                padding: '0',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer'
                            }}
                        />
                    </Box>
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
    );
}; 