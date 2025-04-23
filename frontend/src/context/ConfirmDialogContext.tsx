import React, { createContext, useState, useContext, useCallback, ReactNode } from 'react';
import { ConfirmDialog } from '../components/shared/ConfirmDialog';

type ActionType = 'delete' | 'edit' | 'save';

interface ConfirmDialogOptions {
    title: string;
    message: string;
    actionType?: ActionType;
    onConfirm: () => void;
    loading?: boolean;
}

interface ConfirmDialogContextType {
    showConfirmDialog: (options: ConfirmDialogOptions) => void;
    closeConfirmDialog: () => void;
}

const ConfirmDialogContext = createContext<ConfirmDialogContextType | undefined>(undefined);

export const useConfirmDialog = (): ConfirmDialogContextType => {
    const context = useContext(ConfirmDialogContext);
    if (!context) {
        throw new Error('useConfirmDialog must be used within a ConfirmDialogProvider');
    }
    return context;
};

interface ConfirmDialogProviderProps {
    children: ReactNode;
}

export const ConfirmDialogProvider: React.FC<ConfirmDialogProviderProps> = ({ children }) => {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [options, setOptions] = useState<ConfirmDialogOptions>({
        title: '',
        message: '',
        actionType: 'delete',
        onConfirm: () => {},
        loading: false
    });

    const showConfirmDialog = useCallback((options: ConfirmDialogOptions) => {
        setOptions(options);
        setDialogOpen(true);
    }, []);

    const closeConfirmDialog = useCallback(() => {
        setDialogOpen(false);
    }, []);

    const handleConfirm = useCallback(() => {
        console.log('Контекст: вызывается handleConfirm');
        if (typeof options.onConfirm === 'function') {
            console.log('Контекст: onConfirm это функция, вызываем её');
            options.onConfirm();
        } else {
            console.error('Контекст: onConfirm не является функцией', options.onConfirm);
        }
        closeConfirmDialog();
    }, [options, closeConfirmDialog]);

    return (
        <ConfirmDialogContext.Provider value={{ showConfirmDialog, closeConfirmDialog }}>
            {children}
            <ConfirmDialog
                open={dialogOpen}
                onClose={closeConfirmDialog}
                onConfirm={handleConfirm}
                title={options.title}
                message={options.message}
                actionType={options.actionType}
                loading={options.loading}
            />
        </ConfirmDialogContext.Provider>
    );
}; 