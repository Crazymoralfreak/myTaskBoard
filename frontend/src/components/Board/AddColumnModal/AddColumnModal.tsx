import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button
} from '@mui/material';
import { useLocalization } from '../../../hooks/useLocalization';

interface AddColumnModalProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (name: string) => void;
}

export const AddColumnModal: React.FC<AddColumnModalProps> = ({ open, onClose, onSubmit }) => {
    const { t } = useLocalization();
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
            <DialogTitle>{t('addColumn')}</DialogTitle>
            <DialogContent>
                <TextField
                    autoFocus
                    margin="dense"
                    label={t('columnName')}
                    fullWidth
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>{t('cancel')}</Button>
                <Button onClick={handleSubmit} variant="contained" color="primary">
                    {t('create')}
                </Button>
            </DialogActions>
        </Dialog>
    );
}; 