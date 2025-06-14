import React from 'react';
import {
    Typography,
    Divider,
    List,
    ListItem,
    ListItemText,
    ListItemAvatar,
    Avatar,
    Paper,
    Box,
    Chip,
    IconButton,
    Tooltip,
    CircularProgress
} from '@mui/material';
import {
    Route as RouteIcon,
    ArrowForward as ArrowForwardIcon,
    Assignment as AssignmentIcon,
    ArrowUpward as ArrowUpwardIcon,
    ArrowDownward as ArrowDownwardIcon,
    Edit as EditIcon,
    Delete as DeleteIcon
} from '@mui/icons-material';
import { Route } from '../api/routes.api';
import { useDeleteRouteStage, useMoveRouteStage } from '../hooks/useRoutes';
import styles from './RouteDetails.module.css';

interface RouteDetailsProps {
    selectedRoute: Route | null;
}

const RouteDetails: React.FC<RouteDetailsProps> = ({
    selectedRoute
}) => {
    const deleteRouteStage = useDeleteRouteStage();
    const moveRouteStage = useMoveRouteStage();

    const handleDeleteStage = async (stageId: number) => {
        try {
            await deleteRouteStage.mutateAsync(stageId);
        } catch (error) {
            console.error('Ошибка при удалении этапа:', error);
        }
    };

    const handleMoveStage = async (stageId: number, direction: 'up' | 'down') => {
        if (!selectedRoute) return;

        const currentStage = selectedRoute.routeStages.find(s => s.routeStageId === stageId);
        if (!currentStage) return;

        const newSequenceNumber = direction === 'up' 
            ? currentStage.sequenceNumber - 1 
            : currentStage.sequenceNumber + 1;

        try {
            await moveRouteStage.mutateAsync({
                stageId,
                newSequenceNumber
            });
        } catch (error) {
            console.error('Ошибка при перемещении этапа:', error);
        }
    };

    if (!selectedRoute) {
        return (
            <div className={styles.routeDetailsContainer}>
                <Typography className={styles.selectPrompt}>
                    Выберите маршрут для просмотра деталей
                </Typography>
            </div>
        );
    }

    // Сортируем этапы по последовательности
    const sortedStages = [...selectedRoute.routeStages].sort((a, b) => a.sequenceNumber - b.sequenceNumber);

    return (
        <div className={styles.routeDetailsContainer}>
            <Typography variant="h6" component="h2" className={styles.detailsTitle}>
                Информация о маршруте
            </Typography>
            <Divider className={styles.divider} />

            <div className={styles.routeInfo}>
                <div className={styles.routeInfoHeader}>
                    <Avatar className={styles.largeAvatar}>
                        <RouteIcon />
                    </Avatar>
                    <div className={styles.routeMainInfo}>
                        <Typography variant="h5">{selectedRoute.routeName}</Typography>
                        <Chip
                            label={`Этапов: ${sortedStages.length}`}
                            className={styles.stagesCountChip}
                        />
                    </div>
                </div>

                {sortedStages.length > 0 ? (
                    <Paper elevation={0} className={styles.stagesContainer}>
                        <Typography variant="subtitle1" className={styles.sectionTitle}>
                            Последовательность этапов обработки
                        </Typography>
                        <Box className={styles.stagesFlow}>
                            {sortedStages.map((stage, index) => (
                                <React.Fragment key={stage.routeStageId}>
                                    <Paper elevation={2} className={styles.stageItem}>
                                        <div className={styles.stageContent}>
                                            <Typography className={styles.stageNumber}>
                                                {index + 1}
                                            </Typography>
                                            <div className={styles.stageInfo}>
                                                <Typography className={styles.stageName}>
                                                    {stage.stage.stageName}
                                                </Typography>
                                                {stage.substage && (
                                                    <Typography className={styles.substageName}>
                                                        → {stage.substage.substageName}
                                                    </Typography>
                                                )}
                                            </div>
                                            <div className={styles.stageActions}>
                                                <Tooltip title="Переместить вверх">
                                                    <span>
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => handleMoveStage(stage.routeStageId, 'up')}
                                                            disabled={index === 0 || moveRouteStage.isPending}
                                                        >
                                                            <ArrowUpwardIcon fontSize="small" />
                                                        </IconButton>
                                                    </span>
                                                </Tooltip>
                                                <Tooltip title="Переместить вниз">
                                                    <span>
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => handleMoveStage(stage.routeStageId, 'down')}
                                                            disabled={index === sortedStages.length - 1 || moveRouteStage.isPending}
                                                        >
                                                            <ArrowDownwardIcon fontSize="small" />
                                                        </IconButton>
                                                    </span>
                                                </Tooltip>
                                                <Tooltip title="Удалить этап">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleDeleteStage(stage.routeStageId)}
                                                        disabled={deleteRouteStage.isPending}
                                                        className={styles.deleteButton}
                                                    >
                                                        {deleteRouteStage.isPending ? (
                                                            <CircularProgress size={16} />
                                                        ) : (
                                                            <DeleteIcon fontSize="small" />
                                                        )}
                                                    </IconButton>
                                                </Tooltip>
                                            </div>
                                        </div>
                                    </Paper>
                                    {index < sortedStages.length - 1 && (
                                        <ArrowForwardIcon className={styles.arrowIcon} />
                                    )}
                                </React.Fragment>
                            ))}
                        </Box>
                    </Paper>
                ) : (
                    <Typography className={styles.noStages}>
                        Этапы обработки не определены для данного маршрута
                    </Typography>
                )}

                {selectedRoute.parts && selectedRoute.parts.length > 0 ? (
                    <div className={styles.partsSection}>
                        <Typography variant="subtitle1" className={styles.sectionTitle}>
                            Детали, использующие данный маршрут
                        </Typography>
                        <List className={styles.partsList}>
                            {selectedRoute.parts.map(part => (
                                <ListItem key={part.partId} className={styles.partItem}>
                                    <ListItemAvatar>
                                        <Avatar className={styles.partAvatar}>
                                            <AssignmentIcon />
                                        </Avatar>
                                    </ListItemAvatar>
                                    <ListItemText
                                        primary={part.partName}
                                        secondary={
                                            <span className={styles.partCodeText}>
                                                Код: {part.partCode}
                                            </span>
                                        }
                                    />
                                </ListItem>
                            ))}
                        </List>
                    </div>
                ) : (
                    <Typography className={styles.noParts}>
                        Этот маршрут не назначен ни одной детали
                    </Typography>
                )}
            </div>
        </div>
    );
};

export default RouteDetails;