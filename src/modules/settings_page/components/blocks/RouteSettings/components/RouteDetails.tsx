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
    Chip
} from '@mui/material';

import {
    Route as RouteIcon,
    ArrowForward as ArrowForwardIcon,
    Assignment as AssignmentIcon
} from '@mui/icons-material';
import { IProductionRoute, IRouteStep, IProductionDetail } from '../RouteSettings';
import styles from './RouteDetails.module.css';

interface RouteDetailsProps {
    selectedRoute: IProductionRoute | null;
    routeSteps: IRouteStep[];
    details: IProductionDetail[];
    getStepName: (stepId: number) => string;
}

const RouteDetails: React.FC<RouteDetailsProps> = ({
    selectedRoute,
    routeSteps,
    details,
    getStepName
}) => {
    if (!selectedRoute) {
        return (
            <Typography className={styles.selectPrompt}>
                Выберите маршрут для просмотра деталей
            </Typography>
        );
    }

    // Сортируем этапы по последовательности
    const sortedSteps = [...routeSteps].sort((a, b) => a.sequence - b.sequence);

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
                        <Typography variant="h5">{selectedRoute.name}</Typography>
                        <Chip
                            label={`Этапов: ${sortedSteps.length}`}
                            className={styles.stepsCountChip}
                        />
                    </div>
                </div>

                {sortedSteps.length > 0 ? (
                    <Paper elevation={0} className={styles.stepsContainer}>
                        <Typography variant="subtitle1" className={styles.sectionTitle}>
                            Последовательность этапов обработки
                        </Typography>
                        <Box className={styles.stepsFlow}>
                            {sortedSteps.map((step, index) => (
                                <React.Fragment key={step.id}>
                                    <Paper elevation={2} className={styles.stepItem}>
                                        <Typography className={styles.stepNumber}>
                                            {index + 1}
                                        </Typography>
                                        <Typography className={styles.stepName}>
                                            {getStepName(step.processStepId)}
                                        </Typography>
                                    </Paper>
                                    {index < sortedSteps.length - 1 && (
                                        <ArrowForwardIcon className={styles.arrowIcon} />
                                    )}
                                </React.Fragment>
                            ))}
                        </Box>
                    </Paper>
                ) : (
                    <Typography className={styles.noSteps}>
                        Этапы обработки не определены для данного маршрута
                    </Typography>
                )}

                {details.length > 0 ? (
                    <div className={styles.detailsSection}>
                        <Typography variant="subtitle1" className={styles.sectionTitle}>
                            Детали, использующие данный маршрут
                        </Typography>
                        <List className={styles.detailsList}>
                            {details.map(detail => (
                                <ListItem key={detail.id} className={styles.detailItem}>
                                    <ListItemAvatar>
                                        <Avatar className={styles.detailAvatar}>
                                            <AssignmentIcon />
                                        </Avatar>
                                    </ListItemAvatar>
                                    <ListItemText
                                        primary={detail.name}
                                        secondary={
                                            <>
                                                <span className={styles.articleText}>
                                                    Артикул: {detail.article}
                                                </span>
                                                <span className={styles.materialText}>
                                                    Материал: {detail.material}, Размер: {detail.size}
                                                </span>
                                            </>
                                        }
                                    />
                                </ListItem>
                            ))}
                        </List>
                    </div>
                ) : (
                    <Typography className={styles.noDetails}>
                        Этот маршрут не назначен ни одной детали
                    </Typography>
                )}
            </div>
        </div>
    );
};

export default RouteDetails;