import React, { useState } from 'react';
import { CircularProgress } from '@mui/material';
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

// Компонент карточки маршрута
const RouteCard: React.FC<{
    route: Route;
    isSelected: boolean;
    onSelect: (route: Route) => void;
    onEdit: (route: Route) => void;
    onDelete: (routeId: number) => void;
    onCopy: (route: Route) => void;
    isDeleteConfirm: boolean;
    onCancelDelete: () => void;
    isCopying: boolean;
}> = ({ 
    route, 
    isSelected, 
    onSelect, 
    onEdit, 
    onDelete, 
    onCopy, 
    isDeleteConfirm, 
    onCancelDelete,
    isCopying 
}) => {
    // Сортируем этапы по последовательности
    const sortedStages = route.routeStages 
        ? [...route.routeStages].sort((a, b) => a.sequenceNumber - b.sequenceNumber)
        : [];

    return (
        <div 
            className={`${styles.routeCard} ${isSelected ? styles.routeCardSelected : ''}`}
            onClick={() => onSelect(route)}
        >
            <div className={styles.routeInfo}>
                <div className={styles.routeHeader}>
                    <h3 className={styles.routeName}>{route.routeName}</h3>
                    <span className={styles.routeType}>Маршрут</span>
                </div>

                <div className={styles.routeDetails}>
                    <div className={styles.stagesInfo}>
                        <span className={styles.stagesLabel}>Этапов:</span>
                        <span className={styles.stagesCount}>
                            {sortedStages.length} шт.
                        </span>
                    </div>

                    {route._count && (
                        <div className={styles.partsInfo}>
                            <span className={styles.partsLabel}>Деталей:</span>
                            <span className={styles.partsCount}>
                                {route._count.parts} шт.
                            </span>
                        </div>
                    )}
                </div>

                {/* Stages Preview */}
                {sortedStages.length > 0 && (
                    <div className={styles.stagesPreview}>
                        <span className={styles.previewLabel}>Этапы обработки:</span>
                        <div className={styles.stagesTags}>
                            {sortedStages.slice(0, 3).map((stage, index, arr) => (
                                <span key={stage.routeStageId} className={styles.stageTag}>
                                    {index + 1}. {stage.stage.stageName}
                                    {stage.substage ? ` → ${stage.substage.substageName}` : ''}
                                    {index < arr.length - 1 ? ',' : ''}
                                </span>
                            ))}
                            {sortedStages.length > 3 && (
                                <span className={styles.stageTag}>
                                    +{sortedStages.length - 3} еще
                                </span>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <div className={styles.routeActions}>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onCopy(route);
                    }}
                    className={`${styles.actionButton} ${styles.copyButton}`}
                    title="Копировать маршрут"
                    disabled={isCopying}
                >
                    {isCopying ? <CircularProgress size={16} /> : '📋'}
                </button>

                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onEdit(route);
                    }}
                    className={`${styles.actionButton} ${styles.editButton}`}
                    title="Редактировать маршрут"
                >
                    ✏️
                </button>

                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete(route.routeId);
                    }}
                    className={`${styles.actionButton} ${isDeleteConfirm
                        ? styles.confirmDeleteButton
                        : styles.deleteButton
                    }`}
                    title={
                        isDeleteConfirm
                            ? "Подтвердить удаление"
                            : "Удалить маршрут"
                    }
                >
                    {isDeleteConfirm ? '✓' : '🗑️'}
                </button>

                {isDeleteConfirm && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onCancelDelete();
                        }}
                        className={`${styles.actionButton} ${styles.cancelButton}`}
                        title="Отменить удаление"
                    >
                        ✕
                    </button>
                )}
            </div>
        </div>
    );
};

const RouteList: React.FC<RouteListProps> = ({
    routes,
    selectedRoute,
    setSelectedRoute,
    onEdit,
    onDelete,
    isDeleting
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
    const copyRouteMutation = useCopyRoute();

    // Фильтрация маршрутов по поисковому запросу
    const filteredRoutes = routes.filter((route: Route) =>
        route.routeName.toLowerCase().includes(searchTerm.toLowerCase())
    );

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

    const handleDelete = (routeId: number) => {
        if (deleteConfirmId === routeId) {
            onDelete(routeId);
            setDeleteConfirmId(null);
        } else {
            setDeleteConfirmId(routeId);
        }
    };

    const handleCancelDelete = () => {
        setDeleteConfirmId(null);
    };

    return (
        <div className={styles.routesListContainer}>
            {/* Header with search */}
            <div className={styles.listHeader}>
                <div className={styles.searchContainer}>
                    <input
                        type="text"
                        placeholder="Поиск по названию маршрута..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={styles.searchInput}
                    />
                    <span className={styles.searchIcon}>🔍</span>
                </div>
                <div className={styles.resultsCount}>
                    Найдено: {filteredRoutes.length} из {routes.length}
                </div>
            </div>

            {/* Routes List */}
            <div className={styles.routesList}>
                {filteredRoutes.length === 0 ? (
                    <div className={styles.emptyState}>
                        <p>
                            {searchTerm
                                ? 'По вашему запросу маршруты не найдены'
                                : 'Маршруты не созданы'
                            }
                        </p>
                    </div>
                ) : (
                    filteredRoutes.map((route: Route) => (
                        <RouteCard
                            key={route.routeId}
                            route={route}
                            isSelected={selectedRoute?.routeId === route.routeId}
                            onSelect={setSelectedRoute}
                            onEdit={onEdit}
                            onDelete={handleDelete}
                            onCopy={handleCopyRoute}
                            isDeleteConfirm={deleteConfirmId === route.routeId}
                            onCancelDelete={handleCancelDelete}
                            isCopying={copyRouteMutation.isPending}
                        />
                    ))
                )}
            </div>

            {/* Loading indicator for delete operation */}
            {isDeleting && (
                <div className={styles.operationOverlay}>
                    <div className={styles.spinner}></div>
                    <p>Удаление маршрута...</p>
                </div>
            )}
        </div>
    );
};

export default RouteList;