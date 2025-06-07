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
    Avatar
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Build as BuildIcon,
    Settings as SettingsIcon,
    Category as CategoryIcon
} from '@mui/icons-material';
import { IMachineType, IMachine } from '../MachineSettings';
import styles from './MachineTypeList.module.css';

interface MachineTypeListProps {
    machineTypes: IMachineType[];
    machines: IMachine[];
    onEdit: (machineType: IMachineType) => void;
    onDelete: (id: number) => void;
}

const MachineTypeList: React.FC<MachineTypeListProps> = ({
    machineTypes,
    machines,
    onEdit,
    onDelete
}) => {
    // Получаем иконку для типа станка
    const getTypeIcon = (typeName: string) => {
        if (typeName.toLowerCase().includes('токарн')) {
            return <BuildIcon />;
        } else if (typeName.toLowerCase().includes('фрезерн')) {
            return <SettingsIcon />;
        } else if (typeName.toLowerCase().includes('сверлильн')) {
            return <BuildIcon />;
        } else {
            return <CategoryIcon />;
        }
    };

    return (
        <div className={styles.listContainer}>
            <div className={styles.listHeader}>
                <Typography variant="h6" component="h2">
                    Управление типами станков
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => onEdit(undefined as any)}
                    className={styles.addButton}
                >
                    Добавить тип
                </Button>
            </div>
            <Divider />
            {machineTypes.length === 0 ? (
                <Typography className={styles.emptyMessage}>
                    Типы станков не найдены. Создайте первый тип.
                </Typography>
            ) : (
                <List>
                    {machineTypes.map((type, index) => (
                        <ListItem 
                            key={type.id} 
                            className={styles.typeItem}
                            style={{ animationDelay: `${index * 0.05}s` }}
                        >
                            <ListItemAvatar>
                                <Avatar className={styles.avatar}>
                                    {getTypeIcon(type.name)}
                                </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                                primary={type.name}
                                secondary={
                                    <div>
                                        <span className={styles.machinesCount}>
                                            Станков этого типа: {machines.filter(m => m.machineTypeId === type.id).length}
                                        </span>
                                        {type.description && (
                                            <span className={styles.description}>
                                                {type.description}
                                            </span>
                                        )}
                                    </div>
                                }
                            />
                            <ListItemSecondaryAction>
                                <IconButton
                                    edge="end"
                                    onClick={() => onEdit(type)}
                                    size="small"
                                >
                                    <EditIcon />
                                </IconButton>
                                <IconButton
                                    edge="end"
                                    onClick={() => onDelete(type.id)}
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

export default MachineTypeList;