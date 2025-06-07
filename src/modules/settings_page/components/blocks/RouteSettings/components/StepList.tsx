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
    Tooltip
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Engineering as EngineeringIcon
} from '@mui/icons-material';
import { IProcessStep, IRouteStep } from '../RouteSettings';
import styles from './StepList.module.css';

interface StepListProps {
    steps: IProcessStep[];
    routeSteps: IRouteStep[];
    onEdit: (step: IProcessStep) => void;
    onDelete: (id: number) => void;
}

const StepList: React.FC<StepListProps> = ({
    steps,
    routeSteps,
    onEdit,
    onDelete
}) => {
    // Функция для подсчета количества маршрутов, использующих этап
    const getRouteCount = (stepId: number) => {
        // Получаем уникальные маршруты, использующие этот этап
        const uniqueRouteIds = new Set(
            routeSteps
                .filter(rs => rs.processStepId === stepId)
                .map(rs => rs.routeId)
        );
        return uniqueRouteIds.size;
    };

    return (
        <div className={styles.listContainer}>
            <div className={styles.listHeader}>
                <Typography variant="h6" component="h2">
                    Этапы обработки
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => onEdit(undefined as any)}
                    className={styles.addButton}
                >
                    Добавить этап
                </Button>
            </div>
            <Divider />
            {steps.length === 0 ? (
                <Typography className={styles.emptyMessage}>
                    Этапы обработки не найдены. Создайте первый этап.
                </Typography>
            ) : (
                <List className={styles.stepList}>
                    {steps.map((step, index) => {
                        const routeCount = getRouteCount(step.id);
                        
                        return (
                            <ListItem 
                                key={step.id} 
                                className={styles.stepItem}
                                style={{ animationDelay: `${index * 0.05}s` }}
                            >
                                <ListItemAvatar>
                                    <Avatar className={styles.avatar}>
                                        <EngineeringIcon />
                                    </Avatar>
                                </ListItemAvatar>
                                <ListItemText
                                    primary={step.name}
                                    secondary={
                                        <div>
                                            <span className={styles.routesCount}>
                                                Используется в {routeCount} {
                                                    routeCount === 1 ? 'маршруте' : 
                                                    routeCount >= 2 && routeCount <= 4 ? 'маршрутах' : 
                                                    'маршрутах'
                                                }
                                            </span>
                                            {step.description && (
                                                <span className={styles.description}>
                                                    {step.description}
                                                </span>
                                            )}
                                        </div>
                                    }
                                />
                                <ListItemSecondaryAction>
                                    <IconButton
                                        edge="end"
                                        onClick={() => onEdit(step)}
                                        size="small"
                                        title="Редактировать этап"
                                    >
                                        <EditIcon />
                                    </IconButton>
                                    <Tooltip title={
                                        routeCount > 0 
                                            ? "Невозможно удалить этап, используемый в маршрутах" 
                                            : "Удалить этап"
                                    }>
                                        <span>
                                            <IconButton
                                                edge="end"
                                                onClick={() => onDelete(step.id)}
                                                size="small"
                                                className={styles.deleteButton}
                                                disabled={routeCount > 0}
                                            >
                                                <DeleteIcon />
                                            </IconButton>
                                        </span>
                                    </Tooltip>
                                </ListItemSecondaryAction>
                            </ListItem>
                        );
                    })}
                </List>
            )}
        </div>
    );
};

export default StepList;