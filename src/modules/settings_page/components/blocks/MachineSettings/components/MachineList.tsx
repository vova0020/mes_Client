import React from 'react';
import {
    Typography,
    Button,
    Divider,
    List,
    ListItem,
    ListItemText,
    ListItemAvatar,
    ListItemSecondaryAction,
    IconButton,
    Avatar,
    Chip,
    ListItemButton
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Build as BuildIcon,
    Settings as SettingsIcon,
    Warning as WarningIcon,
    CheckCircle as CheckCircleIcon,
    Cancel as CancelIcon
} from '@mui/icons-material';
import { IMachine, IMachineType } from '../MachineSettings';
import styles from './MachineList.module.css';

interface MachineListProps {
    machines: IMachine[];
    machineTypes: IMachineType[];
    selectedMachine: IMachine | null;
    setSelectedMachine: (machine: IMachine) => void;
    onEdit: (machine: IMachine) => void;
    onDelete: (id: number) => void;
    getTypeName: (typeId: number) => string;
}

const MachineList: React.FC<MachineListProps> = ({
    machines,
    machineTypes,
    selectedMachine,
    setSelectedMachine,
    onEdit,
    onDelete,
    getTypeName
}) => {
    // Получаем иконку для статуса станка
    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'active':
                return <CheckCircleIcon style={{ color: '#4caf50' }} />;
            case 'maintenance':
                return <BuildIcon style={{ color: '#ff9800' }} />;
            case 'inactive':
                return <CancelIcon style={{ color: '#f44336' }} />;
            default:
                return <WarningIcon />;
        }
    };

    // Получаем текст статуса станка
    const getStatusText = (status: string) => {
        switch (status) {
            case 'active':
                return 'Активен';
            case 'maintenance':
                return 'На обслуживании';
            case 'inactive':
                return 'Неактивен';
            default:
                return 'Неизвестно';
        }
    };

    // Получаем цвет для статуса
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active':
                return '#4caf50';
            case 'maintenance':
                return '#ff9800';
            case 'inactive':
                return '#f44336';
            default:
                return '#9e9e9e';
        }
    };

    return (
        <div className={styles.listContainer}>
            <div className={styles.listHeader}>
                <Typography variant="h6" component="h2">
                    Список станков
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => onEdit(undefined as any)}
                    className={styles.addButton}
                >
                    Добавить станок
                </Button>
            </div>
            <Divider />
            {machines.length === 0 ? (
                <Typography className={styles.emptyMessage}>
                    Станки не найдены. Добавьте первый станок.
                </Typography>
            ) : (
                <List>
                    {machines.map((machine, index) => (
                        <ListItem 
                            key={machine.id} 
                            className={styles.machineItem}
                            style={{ animationDelay: `${index * 0.05}s` }}
                        >
                            <ListItemButton
                                selected={selectedMachine?.id === machine.id}
                                onClick={() => setSelectedMachine(machine)}
                            >
                                <ListItemAvatar>
                                    <Avatar className={styles.avatar} style={{ backgroundColor: getStatusColor(machine.status) }}>
                                        {getStatusIcon(machine.status)}
                                    </Avatar>
                                </ListItemAvatar>
                                <ListItemText
                                    primary={machine.name}
                                    secondary={
                                        <>
                                            <Chip
                                                label={getTypeName(machine.machineTypeId)}
                                                size="small"
                                                className={styles.typeChip}
                                            />
                                            <span className={styles.statusText}>
                                                {getStatusText(machine.status)}
                                            </span>
                                        </>
                                    }
                                />
                            </ListItemButton>

                            <ListItemSecondaryAction>
                                <IconButton
                                    edge="end"
                                    onClick={() => onEdit(machine)}
                                    size="small"
                                >
                                    <EditIcon />
                                </IconButton>
                                <IconButton
                                    edge="end"
                                    onClick={() => onDelete(machine.id)}
                                    size="small"
                                    className={styles.deleteButton}
                                >
                                    <DeleteIcon />
                                </IconButton>
                            </ListItemSecondaryAction>
                        </ListItem>
                    ))}
                </List>
            )}
        </div>
    );
};

export default MachineList;