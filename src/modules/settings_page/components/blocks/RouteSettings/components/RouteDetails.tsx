import React from 'react';
import { Route } from '../api/routes.api';
import { useMoveRouteStage, useRoute } from '../hooks/useRoutes';
import styles from './RouteDetails.module.css';

interface RouteDetailsProps {
    selectedRoute: Route | null;
    onRouteUpdate?: (updatedRoute: Route) => void;
}

const RouteDetails: React.FC<RouteDetailsProps> = ({
    selectedRoute,
    onRouteUpdate
}) => {
    const moveRouteStage = useMoveRouteStage();
    
    // Получаем актуальные данные маршрута из кэша
    const { data: currentRoute } = useRoute(selectedRoute?.routeId || 0);
    
    // Используем актуальные данные, если они есть, иначе fallback на переданные
    const routeToDisplay = currentRoute || selectedRoute;

    const handleMoveStage = async (stageId: number, direction: 'up' | 'down') => {
        if (!routeToDisplay) return;

        const sortedStages = [...routeToDisplay.routeStages].sort((a, b) => a.sequenceNumber - b.sequenceNumber);
        const currentIndex = sortedStages.findIndex(s => s.routeStageId === stageId);
        
        if (currentIndex === -1) return;
        
        let newIndex: number;
        if (direction === 'up') {
            if (currentIndex === 0) return; // Уже первый
            newIndex = currentIndex - 1;
        } else {
            if (currentIndex === sortedStages.length - 1) return; // Уже последний
            newIndex = currentIndex + 1;
        }

        // Используем номер последовательности целевой позиции
        const targetStage = sortedStages[newIndex];
        const newSequenceNumber = Number(targetStage.sequenceNumber);

        console.log('Moving stage:', { 
            stageId, 
            direction, 
            currentIndex, 
            newIndex, 
            currentSequence: sortedStages[currentIndex].sequenceNumber, 
            newSequenceNumber,
            newSequenceNumberType: typeof newSequenceNumber
        });

        try {
            const updatedStages = await moveRouteStage.mutateAsync({
                stageId: Number(stageId),
                newSequenceNumber
            });
            
            // Если есть callback и обновленные данные, обновляем родительский компонент
            if (onRouteUpdate && updatedStages && updatedStages.length > 0) {
                // Получаем обновленный маршрут из кэша
                const updatedRoute = currentRoute;
                if (updatedRoute) {
                    onRouteUpdate(updatedRoute);
                }
            }
        } catch (error) {
            console.error('Ошибка при перемещении этапа:', error);
        }
    };

    if (!routeToDisplay) {
        return (
            <div className={styles.routeDetailsContainer}>
                <div className={styles.emptyState}>
                    <div className={styles.emptyStateIcon}>🛣️</div>
                    <h3 className={styles.emptyStateTitle}>Выберите маршрут</h3>
                    <p className={styles.emptyStateDescription}>
                        Выберите маршрут из списка слева для просмотра подробной информации
                    </p>
                </div>
            </div>
        );
    }

    // Сортируем этапы по последовательности
    const sortedStages = [...routeToDisplay.routeStages].sort((a, b) => a.sequenceNumber - b.sequenceNumber);

    return (
        <div className={styles.routeDetailsContainer}>
            {/* Header */}
            <div className={styles.detailsHeader}>
                <div className={styles.routeMainInfo}>
                    <div className={styles.routeIcon}>🛣️</div>
                    <div>
                        <h2 className={styles.routeName}>{routeToDisplay.routeName}</h2>
                        <div className={styles.routeStats}>
                            <span className={styles.statBadge}>
                                Этапов: {sortedStages.length}
                            </span>
                            {routeToDisplay._count && (
                                <span className={styles.statBadge}>
                                    Деталей: {routeToDisplay._count.parts}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className={styles.detailsContent}>
                {/* Stages Section */}
                {sortedStages.length > 0 ? (
                    <div className={styles.stagesSection}>
                        <h3 className={styles.sectionTitle}>
                            <span className={styles.sectionIcon}>⚙️</span>
                            Последовательность этапов обработки
                        </h3>
                        <div className={styles.stageFlowHint}>
                            💡 Используйте стрелки ↑↓ для изменения порядка этапов. Порядок определяет последовательность обработки деталей.
                        </div>
                        <div className={styles.stagesFlow}>
                            {sortedStages.map((stage, index) => (
                                <React.Fragment key={stage.routeStageId}>
                                    <div className={styles.stageCard}>
                                        <div className={styles.stageNumber}>
                                            {index + 1}
                                        </div>
                                        <div className={styles.stageInfo}>
                                            <div className={styles.stageName}>
                                                {stage.stage.stageName}
                                            </div>
                                            {stage.substage && (
                                                <div className={styles.substageName}>
                                                    → {stage.substage.substageName}
                                                </div>
                                            )}
                                        </div>
                                        <div className={styles.stageActions}>
                                            <button
                                                className={`${styles.actionButton} ${styles.moveButton}`}
                                                onClick={() => handleMoveStage(stage.routeStageId, 'up')}
                                                disabled={index === 0 || moveRouteStage.isPending}
                                                title="Переместить вверх"
                                            >
                                                ↑
                                            </button>
                                            <button
                                                className={`${styles.actionButton} ${styles.moveButton}`}
                                                onClick={() => handleMoveStage(stage.routeStageId, 'down')}
                                                disabled={index === sortedStages.length - 1 || moveRouteStage.isPending}
                                                title="Переместить вниз"
                                            >
                                                ↓
                                            </button>
                                        </div>
                                    </div>
                                    {index < sortedStages.length - 1 && (
                                        <div className={styles.stageArrow}></div>
                                    )}
                                </React.Fragment>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className={styles.noStagesSection}>
                        <div className={styles.noStagesIcon}>⚙️</div>
                        <h3 className={styles.noStagesTitle}>Этапы не определены</h3>
                        <p className={styles.noStagesDescription}>
                            Для данного маршрута не определены этапы обработки. 
                            Отредактируйте маршрут, чтобы добавить этапы.
                        </p>
                    </div>
                )}

                {/* Parts Section */}
                {/* {routeToDisplay.parts && routeToDisplay.parts.length > 0 ? (
                    <div className={styles.partsSection}>
                        <h3 className={styles.sectionTitle}>
                            <span className={styles.sectionIcon}>📋</span>
                            Детали, использующие данный маршрут
                        </h3>
                        <div className={styles.partsList}>
                            {routeToDisplay.parts.map(part => (
                                <div key={part.partId} className={styles.partCard}>
                                    <div className={styles.partIcon}>📋</div>
                                    <div className={styles.partInfo}>
                                        <div className={styles.partName}>{part.partName}</div>
                                        <div className={styles.partCode}>Код: {part.partCode}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className={styles.noPartsSection}>
                        <div className={styles.noPartsIcon}>📋</div>
                        <h3 className={styles.noPartsTitle}>Детали не назначены</h3>
                        <p className={styles.noPartsDescription}>
                            Этот маршрут пока не назначен ни одной детали.
                        </p>
                    </div>
                )} */}
            </div>
        </div>
    );
};

export default RouteDetails;