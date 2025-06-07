import React from 'react';
import { Snackbar, Alert } from '@mui/material';
import styles from './Notification.module.css';

export type NotificationSeverity = 'success' | 'error' | 'info' | 'warning';

interface NotificationProps {
  open: boolean;
  message: string;
  severity: NotificationSeverity;
  onClose: () => void;
}

const Notification: React.FC<NotificationProps> = ({
  open,
  message,
  severity,
  onClose,
}) => {
  // Добавляем класс в зависимости от типа уведомления
  const alertClass = severity === 'success' 
    ? styles.successNotification 
    : severity === 'error' 
      ? styles.errorNotification 
      : '';

  return (
    <Snackbar
      open={open}
      autoHideDuration={6000}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
    >
      <Alert 
        onClose={onClose} 
        severity={severity}
        className={alertClass}
      >
        {message}
      </Alert>
    </Snackbar>
  );
};

export default Notification;