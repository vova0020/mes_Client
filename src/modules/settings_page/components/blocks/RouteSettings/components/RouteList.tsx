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
    ListItemButton,
    CircularProgress,
    Tooltip
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Route as RouteIcon,
    ContentCopy as CopyIcon
} from '@mui/icons-material';
import { Route } from '../api/routes.api';
import { useCopyRoute } from '../hooks/useRoutes';
import styles from './RouteList.module.css';

interface RouteListProps {
    routes: Route[];
    selectedRoute: Route | null;
    setSelectedRoute: (route: Route) => void;
    onEdit: (route?: Route) => void;
    onDelete: (id: number) => void;
    isDeleting: boolean;
}

const RouteList: React.FC<RouteListProps> = ({
    routes,
    selectedRoute,
    setSelectedRoute,
    onEdit,
    onDelete,
    isDeleting
}) => {
    const copyRouteMutation = useCopyRoute();

    const handleCopyRoute = async (route: Route) => {
        try {
            await copyRouteMutation.mutateAsync({
                id: route.routeId,
                newRouteName: `${route.routeName} (копия)`
            });
        } catch (error) {
            console.error('Ошибка при копировании маршрута:', error);
        }
    };

    return (
        <div className={styles.listContainer}>
            <div className={styles.listHeader}>
                <Typography variant="h6" component="h2">
                    Список маршрутов
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => onEdit()}
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
                            key={route.routeId} 
                            className={styles.routeItem}
                            style={{ animationDelay: `${index * 0.05}s` }}
                        >
                            <ListItemButton
                                selected={selectedRoute?.routeId === route.routeId}
                                onClick={() => setSelectedRoute(route)}
                            >
                                <ListItemAvatar>
                                    <Avatar className={styles.avatar}>
                                        <RouteIcon />
                                    </Avatar>
                                </ListItemAvatar>
                                <ListItemText
                                    primary={route.routeName}
                                    secondary={
                                        <div className={styles.routeInfo}>
                                            <div className={styles.stepChips}>
                                                {route.routeStages && route.routeStages.length > 0 ? (
                                                    route.routeStages
                                                        .sort((a, b) => a.sequenceNumber - b.sequenceNumber)
                                                        .map((stage, idx) => (
                                                            <Chip
                                                                key={stage.routeStageId}
                                                                label={`${idx + 1}. ${stage.stage.stageName}${
                                                                    stage.substage ? ` → ${stage.substage.substageName}` : ''
                                                                }`}
                                                                size="small"
                                                                className={styles.stepChip}
                                                            />
                                                        ))
                                                ) : (
                                                    <span className={styles.noSteps}>Нет этапов</span>
                                                )}
                                            </div>
                                            {route._count && (
                                                <Typography variant="caption" className={styles.partsCount}>
                                                    Деталей: {route._count.parts}
                                                </Typography>
                                            )}
                                        </div>
                                    }
                                />
                            </ListItemButton>

                            <ListItemSecondaryAction>
                                <Tooltip title="Копировать маршрут">
                                    <IconButton
                                        edge="end"
                                        onClick={() => handleCopyRoute(route)}
                                        size="small"
                                        disabled={copyRouteMutation.isPending}
                                    >
                                        {copyRouteMutation.isPending ? (
                                            <CircularProgress size={16} />
                                        ) : (
                                            <CopyIcon />
                                        )}
                                    </IconButton>
                                </Tooltip>
                                <Tooltip title="Редактировать маршрут">
                                    <IconButton
                                        edge="end"
                                        onClick={() => onEdit(route)}
                                        size="small"
                                    >
                                        <EditIcon />
                                    </IconButton>
                                </Tooltip>
                                <Tooltip title="Удалить маршрут">
                                    <IconButton
                                        edge="end"
                                        onClick={() => onDelete(route.routeId)}
                                        size="small"
                                        className={styles.deleteButton}
                                        disabled={isDeleting}
                                    >
                                        {isDeleting ? (
                                            <CircularProgress size={16} />
                                        ) : (
                                            <DeleteIcon />
                                        )}
                                    </IconButton>
                                </Tooltip>
                            </ListItemSecondaryAction>
                        </ListItem>
                    ))}
                </List>
            )}
        </div>
    );
};

export default RouteList;