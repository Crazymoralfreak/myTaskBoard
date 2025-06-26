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
    Tabs,
    Tab,
    Typography
} from '@mui/material';
import { ConfirmDialog } from '../../shared/ConfirmDialog';
import { BoardEntitiesManager } from '../BoardEntitiesManager/BoardEntitiesManager';
import { Board } from '../../../types/board';
import { useLocalization } from '../../../hooks/useLocalization';

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`board-settings-tabpanel-${index}`}
            aria-labelledby={`board-settings-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{ p: 2 }}>
                    {children}
                </Box>
            )}
        </div>
    );
}

interface EditBoardModalProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (updates: { name: string; description: string }) => Promise<void>;
    initialName: string;
    initialDescription: string;
    board?: Board;
    onBoardUpdate?: (updatedBoard: Board) => void;
}

export const EditBoardModal: React.FC<EditBoardModalProps> = ({
    open,
    onClose,
    onSubmit,
    initialName,
    initialDescription,
    board,
    onBoardUpdate
}) => {
    const { t } = useLocalization();
    const [name, setName] = useState(initialName);
    const [description, setDescription] = useState(initialDescription || '');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    const [selectedTab, setSelectedTab] = useState(0);

    useEffect(() => {
        setHasChanges(
            name !== initialName || 
            description !== (initialDescription || '')
        );
    }, [name, description, initialName, initialDescription]);

    const handleSubmit = async () => {
        if (!name.trim()) {
            setError(t('nameRequired'));
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
        
        if (hasChanges && selectedTab === 0) {
            setShowConfirm(true);
            return;
        }

        resetAndClose();
    };

    const resetAndClose = () => {
        setName(initialName);
        setDescription(initialDescription || '');
        setError(null);
        setSelectedTab(0);
        onClose();
    };

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        if (hasChanges && selectedTab === 0) {
            setShowConfirm(true);
            return;
        }
        setSelectedTab(newValue);
    };

    return (
        <>
            <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
                <DialogTitle>{t('boardSettings')}</DialogTitle>
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tabs value={selectedTab} onChange={handleTabChange}>
                                    <Tab label={t('generalSettings')} />
            <Tab label={t('boardEntities')} />
                    </Tabs>
                </Box>
                <DialogContent>
                    <TabPanel value={selectedTab} index={0}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                            <TextField
                                label={t('boardName')}
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                fullWidth
                                required
                                error={!!error && !name.trim()}
                                helperText={error && !name.trim() ? error : ''}
                                disabled={loading}
                            />
                            <TextField
                                label={t('boardDescription')}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                fullWidth
                                multiline
                                rows={3}
                                disabled={loading}
                            />
                        </Box>
                    </TabPanel>
                    <TabPanel value={selectedTab} index={1}>
                        {board && onBoardUpdate && (
                            <BoardEntitiesManager 
                                board={board} 
                                onBoardUpdate={onBoardUpdate}
                            />
                        )}
                        {board && !onBoardUpdate && (
                            <Typography color="text.secondary">
                                {t('entitiesUpdateNote')}
                            </Typography>
                        )}
                        {!board && (
                            <Typography color="error">
                                {t('errorsLoadBoard')}
                            </Typography>
                        )}
                    </TabPanel>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose} disabled={loading}>{t('close')}</Button>
                    {selectedTab === 0 && (
                        <Button 
                            onClick={handleSubmit} 
                            variant="contained"
                            disabled={loading}
                            startIcon={loading ? <CircularProgress size={20} /> : null}
                        >
                            {loading ? t('saving') : t('save')}
                        </Button>
                    )}
                </DialogActions>
            </Dialog>

            <ConfirmDialog
                open={showConfirm}
                onClose={() => setShowConfirm(false)}
                onConfirm={() => {
                    setShowConfirm(false);
                    setSelectedTab(1);
                }}
                                      title={t('errorsUnsavedChanges')}
                      message={t('errorsDiscardChanges')}
                actionType="edit"
            />
        </>
    );
}; 