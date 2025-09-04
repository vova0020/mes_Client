import React, { useState } from 'react';
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
    
    // Состояние для drag and drop
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

    // Drag and drop обработчики
    const handleDragStart = (e: React.DragEvent, index: number) => {
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
        e.preventDefault();
        
        if (draggedIndex === null || draggedIndex === dropIndex || !routeToDisplay) {
            setDraggedIndex(null);
            return;
        }

        const sortedStages = [...routeToDisplay.routeStages].sort((a, b) => a.sequenceNumber - b.sequenceNumber);
        const draggedStage = sortedStages[draggedIndex];
        const targetStage = sortedStages[dropIndex];
        
        // Используем номер последовательности целевой позиции
        const newSequenceNumber = Number(targetStage.sequenceNumber);

        try {
            await moveRouteStage.mutateAsync({
                stageId: Number(draggedStage.routeStageId),
                newSequenceNumber
            });
            
            // Если есть callback, обновляем родительский компонент
            if (onRouteUpdate && currentRoute) {
                onRouteUpdate(currentRoute);
            }
        } catch (error) {
            console.error('Ошибка при перемещении этапа:', error);
        }
        
        setDraggedIndex(null);
    };

    const handleDragEnd = () => {
        setDraggedIndex(null);
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
                            💡 Перетащите этапы для изменения порядка. Порядок определяет последовательность обработки деталей.
                        </div>
                        <div className={styles.stagesFlow}>
                            {sortedStages.map((stage, index) => (
                                <div 
                                    key={stage.routeStageId}
                                    className={`${styles.stageCard} ${draggedIndex === index ? styles.dragging : ''}`}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, index)}
                                    onDragOver={handleDragOver}
                                    onDrop={(e) => handleDrop(e, index)}
                                    onDragEnd={handleDragEnd}
                                >
                                    <div className={styles.dragHandle} title="Перетащите для изменения порядка">
                                        ⋮⋮
                                    </div>
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
                                </div>
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