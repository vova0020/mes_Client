import React from 'react';
import { CircularProgress, Box, Typography, Button } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import BuildIcon from '@mui/icons-material/Build';
import PowerOffIcon from '@mui/icons-material/PowerOff';

import styles from './MachineStatus.module.css';

// Компонент загрузки
export const LoadingSpinner: React.FC = () => {
  return (
    <Box className={styles.statusContainer}>
      <CircularProgress size={60} color="primary" />
      <Typography variant="h6" className={styles.statusText}>
        Загрузка данных о станке...
      </Typography>
    </Box>
  );
};

// Компонент для отображения ошибки
export const ErrorStatus: React.FC<{ message: string; onRetry: () => void }> = ({ 
  message, 
  onRetry 
}) => {
  return (
    <Box className={styles.statusContainer}>
      <ErrorOutlineIcon color="error" className={styles.statusIcon} />
      <Typography variant="h6" color="error" className={styles.statusText}>
        Ошибка при загрузке данных
      </Typography>
      <Typography variant="body1" color="textSecondary" className={styles.statusSubtext}>
        {message}
      </Typography>
      <Button 
        variant="contained" 
        color="primary" 
        onClick={onRetry} 
        className={styles.retryButton}
      >
        Попробовать снова
      </Button>
    </Box>
  );
};

// Компонент для отображения сломанного станка
export const BrokenStatus: React.FC<{ machineName: string }> = ({ machineName }) => {
  return (
    <Box className={styles.statusContainer}>
      <ErrorOutlineIcon color="error" className={styles.statusIcon} />
      <Typography variant="h5" color="error" className={styles.statusText}>
        Станок {machineName} сломан
      </Typography>
      <Typography variant="body1" color="textSecondary" className={styles.statusSubtext}>
        Требуется вмешательство технического персонала для устранения неисправности.
      </Typography>
    </Box>
  );
};

// Компонент для отображения неактивного станка
export const InactiveStatus: React.FC<{ machineName: string }> = ({ machineName }) => {
  return (
    <Box className={styles.statusContainer}>
      <PowerOffIcon color="disabled" className={styles.statusIcon} />
      <Typography variant="h5" color="textSecondary" className={styles.statusText}>
        Станок {machineName} не активен
      </Typography>
      <Typography variant="body1" color="textSecondary" className={styles.statusSubtext}>
        Запустите станок в работу через панель управления.
      </Typography>
    </Box>
  );
};

// Компонент для отображения станка на обслуживании
export const MaintenanceStatus: React.FC<{ machineName: string }> = ({ machineName }) => {
  return (
    <Box className={styles.statusContainer}>
      <BuildIcon color="warning" className={styles.statusIcon} />
      <Typography variant="h5" color="warning.main" className={styles.statusText}>
        Станок {machineName} на обслуживании
      </Typography>
      <Typography variant="body1" color="textSecondary" className={styles.statusSubtext}>
        Проводятся технические работы. Станок временно недоступен.
      </Typography>
    </Box>
  );
};