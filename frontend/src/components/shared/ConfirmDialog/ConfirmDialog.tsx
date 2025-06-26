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
import { useLocalization } from '../../../hooks/useLocalization';

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
    const { t } = useLocalization();
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
                return loading ? t('deleting') : t('delete');
            case 'edit':
                return loading ? t('saving') : t('saveChanges');
            case 'save':
                return loading ? t('saving') : t('save');
            default:
                return loading ? t('confirming') : t('confirm');
        }
    };
    
    const handleConfirm = () => {
        console.log('Подтверждение диалога вызвано');
        onConfirm();
    };

    // Обработчик нажатия клавиши Enter для подтверждения
    const handleKeyDown = (event: React.KeyboardEvent) => {
        if (event.key === 'Enter' && !loading) {
            handleConfirm();
        }
    };

    return (
        <Dialog 
            open={open} 
            onClose={onClose} 
            maxWidth="sm" 
            fullWidth
            aria-labelledby="confirm-dialog-title"
            onKeyDown={handleKeyDown}
            keepMounted={false}
            disablePortal={false}
            style={{ zIndex: 9999 }}
            PaperProps={{
                style: {
                    zIndex: 10000,
                    position: 'relative'
                }
            }}
            BackdropProps={{
                style: {
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    zIndex: 9998
                }
            }}
            sx={{
                '& .MuiDialog-container': {
                    zIndex: 10000
                },
                '& .MuiBackdrop-root': {
                    zIndex: 9998
                }
            }}
        >
            <DialogTitle id="confirm-dialog-title">{title}</DialogTitle>
            <DialogContent>
                <Typography>{message}</Typography>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} disabled={loading}>{t('cancel')}</Button>
                <Button 
                    onClick={handleConfirm} 
                    variant="contained" 
                    color={getActionColor()}
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} /> : null}
                    autoFocus
                >
                    {getActionText()}
                </Button>
            </DialogActions>
        </Dialog>
    );
}; 