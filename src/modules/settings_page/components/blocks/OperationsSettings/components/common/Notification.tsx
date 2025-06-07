import React from 'react';
import { Snackbar, Alert } from '@mui/material';

export type NotificationSeverity = 'success' | 'error' | 'warning' | 'info';

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
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
            <Alert
                onClose={onClose}
                severity={severity}
                sx={{ width: '100%' }}
            >
                {message}
            </Alert>
        </Snackbar>
    );
};

export default Notification;