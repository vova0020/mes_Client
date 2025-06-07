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
    Route as RouteIcon
} from '@mui/icons-material';
import { IProductionRoute, IProcessStep } from '../RouteSettings';
import styles from './RouteList.module.css';

interface RouteListProps {
    routes: IProductionRoute[];
    steps: IProcessStep[];
    selectedRoute: IProductionRoute | null;
    setSelectedRoute: (route: IProductionRoute) => void;
    onEdit: (route: IProductionRoute) => void;
    onDelete: (id: number) => void;
    getStepName: (stepId: number) => string;
}

const RouteList: React.FC<RouteListProps> = ({
    routes,
    steps,
    selectedRoute,
    setSelectedRoute,
    onEdit,
    onDelete,
    getStepName
}) => {
    return (
        <div className={styles.listContainer}>
            <div className={styles.listHeader}>
                <Typography variant="h6" component="h2">
                    Список маршрутов
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => onEdit(undefined as any)}
                    className={styles.addButton}
                >
                    Добавить маршрут
                </Button>
            </div>
            <Divider />
            {routes.length === 0 ? (
                <Typography className={styles.emptyMessage}>
                    Маршруты не найдены. Создайте первый маршрут.
                </Typography>
            ) : (
                <List className={styles.routeList}>
                    {routes.map((route, index) => (
                        <ListItem 
                            key={route.id} 
                            className={styles.routeItem}
                            style={{ animationDelay: `${index * 0.05}s` }}
                        >
                            <ListItemButton
                                selected={selectedRoute?.id === route.id}
                                onClick={() => setSelectedRoute(route)}
                            >
                                <ListItemAvatar>
                                    <Avatar className={styles.avatar}>
                                        <RouteIcon />
                                    </Avatar>
                                </ListItemAvatar>
                                <ListItemText
                                    primary={route.name}
                                    secondary={
                                        <div className={styles.stepChips}>
                                            {route.steps && route.steps.length > 0 ? (
                                                route.steps.map((step, idx) => (
                                                    <Chip
                                                        key={step.id}
                                                        label={`${idx + 1}. ${getStepName(step.processStepId)}`}
                                                        size="small"
                                                        className={styles.stepChip}
                                                    />
                                                ))
                                            ) : (
                                                <span className={styles.noSteps}>Нет этапов</span>
                                            )}
                                        </div>
                                    }
                                />
                            </ListItemButton>

                            <ListItemSecondaryAction>
                                <IconButton
                                    edge="end"
                                    onClick={() => onEdit(route)}
                                    size="small"
                                >
                                    <EditIcon />
                                </IconButton>
                                <IconButton
                                    edge="end"
                                    onClick={() => onDelete(route.id)}
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

export default RouteList;