import React from 'react';
import { Snackbar, Alert } from '@mui/material';

export type NotificationSeverity = 'success' | 'info' | 'warning' | 'error';

interface NotificationProps {
    open: boolean;
    message: string;
    severity: NotificationSeverity;
    onClose: () => void;
    autoHideDuration?: number;
}

const Notification: React.FC<NotificationProps> = ({
    open,
    message,
    severity,
    onClose,
    autoHideDuration = 5000
}) => {
    return (
        <Snackbar
            open={open}
            autoHideDuration={autoHideDuration}
            onClose={onClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
            <Alert 
                onClose={onClose} 
                severity={severity} 
                variant="filled"
                sx={{ width: '100%' }}
            >
                {message}
            </Alert>
        </Snackbar>
    );
};

export default Notification;