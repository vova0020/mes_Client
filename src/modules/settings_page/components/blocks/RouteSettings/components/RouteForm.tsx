import React, { useState, useEffect } from 'react';
import { 
    Route, 
    CreateRouteDto, 
    ProductionLine, 
    LineStagesResponse,
    routesApi 
} from '../api/routes.api';
import styles from './RouteForm.module.css';

interface RouteFormProps {
    open: boolean;
    onClose: () => void;
    onSave: (routeData: CreateRouteDto) => void;
    route?: Route | null;
    isEditing: boolean;
    isLoading: boolean;
}

interface SelectedStage {
    stageId: number;
    substageId?: number;
    sequenceNumber: number;
    stageName: string;
    substageName?: string;
}

const RouteForm: React.FC<RouteFormProps> = ({
    open,
    onClose,
    onSave,
    route,
    isEditing,
    isLoading
}) => {
    // Состояние формы
    const [routeForm, setRouteForm] = useState({
        routeName: '',
        lineId: 0
    });

    // Состояние для производственных линий и этапов
    const [productionLines, setProductionLines] = useState<ProductionLine[]>([]);
    const [lineStages, setLineStages] = useState<LineStagesResponse | null>(null);
    const [selectedStages, setSelectedStages] = useState<SelectedStage[]>([]);
    
    // Состояние для drag and drop
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    
    // Состояние загрузки
    const [loadingLines, setLoadingLines] = useState(false);
    const [loadingStages, setLoadingStages] = useState(false);

    // Загрузка производственных линий при открытии формы
    useEffect(() => {
        if (open) {
            loadProductionLines();
        }
    }, [open]);

    // Инициализация формы при открытии
    useEffect(() => {
        if (route && isEditing) {
            setRouteForm({
                routeName: route.routeName,
                lineId: route.lineId || 0
            });

            // При редактировании показываем только существующие этапы маршрута
            const stages = route.routeStages
                .sort((a, b) => a.sequenceNumber - b.sequenceNumber)
                .map(stage => ({
                    stageId: stage.stageId,
                    substageId: stage.substageId,
                    sequenceNumber: stage.sequenceNumber,
                    stageName: stage.stage.stageName,
                    substageName: stage.substage?.substageName
                }));
            
            setSelectedStages(stages);

            // НЕ загружаем этапы линии автоматически при редактировании
            // Этапы линии загрузятся только если пользователь выберет линию заново
        } else {
            // При создании нового маршрута
            setRouteForm({ routeName: '', lineId: 0 });
            setSelectedStages([]);
            setLineStages(null);
        }
    }, [route, isEditing, open]);

    // Загрузка производственных линий
    const loadProductionLines = async () => {
        setLoadingLines(true);
        try {
            const linesData = await routesApi.getProductionLines();
            setProductionLines(linesData);
        } catch (error) {
            console.error('Ошибка загрузки производственных линий:', error);
        } finally {
            setLoadingLines(false);
        }
    };

    // Загрузка этапов производственной линии
    const loadLineStages = async (lineId: number): Promise<LineStagesResponse | null> => {
        setLoadingStages(true);
        try {
            const stagesData = await routesApi.getLineStages(lineId);
            setLineStages(stagesData);
            return stagesData;
        } catch (error) {
            console.error('Ошибка загрузки этапов производственной линии:', error);
            setLineStages(null);
            return null;
        } finally {
            setLoadingStages(false);
        }
    };

    // Обработчик изменения производственной линии
    const handleLineChange = async (lineId: number) => {
        setRouteForm(prev => ({ ...prev, lineId }));
        
        if (lineId > 0) {
            // При выборе производственной линии всегда загружаем этапы
            const stagesData = await loadLineStages(lineId);
            
            // При редактировании: всегда заменяем этапы на все этапы выбранной линии
            if (isEditing && stagesData) {
                const allStages = stagesData.stagesLevel1.map((stage, index) => ({
                    stageId: stage.stageId,
                    substageId: undefined,
                    sequenceNumber: index + 1,
                    stageName: stage.stageName,
                    substageName: undefined
                }));
                setSelectedStages(allStages);
            }
        } else {
            // При выборе "Без привязки к линии"
            setLineStages(null);
            setSelectedStages([]);
        }
    };

    // Управление этапами при загрузке этапов линии
    useEffect(() => {
        if (!lineStages || isEditing) return;

        // При создании нового маршрута всегда показываем все этапы линии
        const allStages = lineStages.stagesLevel1.map((stage, index) => ({
            stageId: stage.stageId,
            substageId: undefined,
            sequenceNumber: index + 1,
            stageName: stage.stageName,
            substageName: undefined
        }));
        
        setSelectedStages(allStages);
    }, [lineStages, isEditing]);

    // Обработчик изменения поля формы
    const handleRouteFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setRouteForm(prev => ({ ...prev, [name]: value }));
    };

    // Обработчики управления этапами
    const handleDeleteStage = (stageToDelete: SelectedStage) => {
        const updatedStages = selectedStages
            .filter(stage => 
                !(stage.stageId === stageToDelete.stageId && 
                  stage.substageId === stageToDelete.substageId)
            )
            .map((stage, idx) => ({
                ...stage,
                sequenceNumber: idx + 1
            }));
        
        setSelectedStages(updatedStages);
    };

    // Обработчик выбора подэтапа
    const handleSubstageChange = (stageIndex: number, substageId: number | undefined) => {
        const updatedStages = [...selectedStages];
        const stage = updatedStages[stageIndex];
        
        if (substageId && lineStages) {
            const substage = lineStages.stagesLevel2.find(s => s.substageId === substageId);
            updatedStages[stageIndex] = {
                ...stage,
                substageId: substageId,
                substageName: substage?.substageName
            };
        } else {
            updatedStages[stageIndex] = {
                ...stage,
                substageId: undefined,
                substageName: undefined
            };
        }
        
        console.log(`Обновлен этап ${stageIndex}:`, updatedStages[stageIndex]);
        setSelectedStages(updatedStages);
    };

    // Получить подэтапы для конкретного этапа
    const getSubstagesForStage = (stageId: number) => {
        if (!lineStages) return [];
        return lineStages.stagesLevel2.filter(substage => substage.stageId === stageId);
    };
    
    // Drag and drop обработчики
    const handleDragStart = (e: React.DragEvent, index: number) => {
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (e: React.DragEvent, dropIndex: number) => {
        e.preventDefault();
        
        if (draggedIndex === null || draggedIndex === dropIndex) {
            setDraggedIndex(null);
            return;
        }

        const stages = [...selectedStages];
        const draggedStage = stages[draggedIndex];
        
        // Удаляем перетаскиваемый элемент
        stages.splice(draggedIndex, 1);
        // Вставляем на новое место
        stages.splice(dropIndex, 0, draggedStage);
        
        // Обновляем номера последовательности
        const reorderedStages = stages.map((stage, idx) => ({
            ...stage,
            sequenceNumber: idx + 1
        }));
        
        setSelectedStages(reorderedStages);
        setDraggedIndex(null);
    };

    const handleDragEnd = () => {
        setDraggedIndex(null);
    };

    // Обработчик сохранения
    const handleSave = () => {
        const routeData: CreateRouteDto = {
            routeName: routeForm.routeName,
            lineId: routeForm.lineId > 0 ? routeForm.lineId : undefined,
            stages: selectedStages.map(stage => ({
                stageId: stage.stageId,
                substageId: stage.substageId,
                sequenceNumber: stage.sequenceNumber
            }))
        };
        
        console.log('Сохраняемые данные маршрута:', routeData);
        onSave(routeData);
    };

    
    if (!open) return null;

    return (
        <div className={styles.overlay}>
            <div className={styles.routeFormContainer}>
                {/* Заголовок формы */}
                <div className={styles.formHeader}>
                    <h2 className={styles.formTitle}>
                        {isEditing ? 'Редактирование маршрута' : 'Создание нового маршрута'}
                    </h2>
                    <button 
                        className={styles.closeButton}
                        onClick={onClose}
                        disabled={isLoading}
                    >
                        ✕
                    </button>
                </div>

                {/* Содержимое формы */}
                <div className={styles.form}>
                    {/* Основная информация */}
                    <div className={styles.formSection}>
                        <h3 className={styles.sectionTitle}>Основная информация</h3>
                        
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Название маршрута</label>
                            <input
                                type="text"
                                name="routeName"
                                value={routeForm.routeName}
                                onChange={handleRouteFormChange}
                                className={styles.input}
                                placeholder="Введите название маршрута"
                                required
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Производственная линия</label>
                            <select
                                value={routeForm.lineId}
                                onChange={(e) => handleLineChange(Number(e.target.value))}
                                onClick={(e) => {
                                    if (isEditing && e.target instanceof HTMLSelectElement) {
                                        const selectedValue = Number(e.target.value);
                                        if (selectedValue > 0) {
                                            handleLineChange(selectedValue);
                                        }
                                    }
                                }}
                                className={styles.select}
                                disabled={loadingLines}
                            >
                                <option value={0}>Без привязки к производственной линии</option>
                                {productionLines.map(line => (
                                    <option key={line.lineId} value={line.lineId}>
                                        {line.lineName} ({line.lineType})
                                    </option>
                                ))}
                            </select>
                            {loadingLines && (
                                <div className={styles.fieldHint}>Загрузка производственных линий...</div>
                            )}
                        </div>

                        {lineStages && (
                            <div className={styles.flowInfo}>
                                <div className={styles.flowInfoHeader}>
                                    <span className={styles.flowInfoIcon}>🏭</span>
                                    <span className={styles.flowInfoName}>{lineStages.productionLine.lineName}</span>
                                </div>
                                <div className={styles.flowInfoDescription}>
                                    Тип: {lineStages.productionLine.lineType}
                                </div>
                                <div className={styles.flowInfoStats}>
                                    Доступно этапов: {lineStages.stagesLevel1.length} | 
                                    Подэтапов: {lineStages.stagesLevel2.length} | 
                                    Маршрутов в линии: {lineStages.routesCount}
                                </div>
                            </div>
                        )}
                    </div>

                    
                    {/* Выбранные этапы */}
                    <div className={styles.formSection}>
                        <h3 className={styles.sectionTitle}>
                            Этапы производственной линии (перетащите для изменения порядка)
                        </h3>
                        
                        {selectedStages.length === 0 ? (
                            <div className={styles.emptyStages}>
                                {routeForm.lineId === 0 
                                    ? 'Выберите производственную линию для отображения этапов'
                                    : loadingStages 
                                        ? 'Загрузка этапов производственной линии...'
                                        : isEditing 
                                            ? 'Этапы маршрута отображены выше. Выберите линию заново для загрузки всех этапов линии.'
                                            : 'Этапы производственной линии будут отображены автоматически'
                                }
                            </div>
                        ) : (
                            <div className={styles.stagesList}>
                                {selectedStages.map((stage, index) => (
                                    <div 
                                        key={`${stage.stageId}-${stage.substageId || 'none'}-${index}`}
                                        className={`${styles.stageItem} ${draggedIndex === index ? styles.dragging : ''}`}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, index)}
                                        onDragOver={handleDragOver}
                                        onDrop={(e) => handleDrop(e, index)}
                                        onDragEnd={handleDragEnd}
                                    >
                                        <div className={styles.dragHandle} title="Перетащите для изменения порядка">
                                            ⋮⋮
                                        </div>
                                        <div className={styles.stageSequence}>
                                            {index + 1}
                                        </div>
                                        <div className={styles.stageInfo}>
                                            <div className={styles.stageName}>
                                                🔧 {stage.stageName}
                                            </div>
                                            {stage.substageName && (
                                                <div className={styles.stageDescription}>
                                                    → {stage.substageName}
                                                </div>
                                            )}
                                        </div>
                                        <div className={styles.stageActions}>
                                            {getSubstagesForStage(stage.stageId).length > 0 && (
                                                <select
                                                    value={stage.substageId || ''}
                                                    onChange={(e) => handleSubstageChange(index, e.target.value ? Number(e.target.value) : undefined)}
                                                    className={styles.substageSelect}
                                                    title="Выбрать подэтап"
                                                >
                                                    <option value="">Без подэтапа</option>
                                                    {getSubstagesForStage(stage.stageId).map(substage => (
                                                        <option key={substage.substageId} value={substage.substageId}>
                                                            {substage.substageName}
                                                        </option>
                                                    ))}
                                                </select>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteStage(stage)}
                                                className={`${styles.actionButton} ${styles.deleteButton}`}
                                                title="Удалить этап"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Действия формы */}
                <div className={styles.formActions}>
                    <button 
                        type="button"
                        onClick={onClose} 
                        className={`${styles.button} ${styles.cancelButton}`}
                        disabled={isLoading}
                    >
                        Отмена
                    </button>
                    <button 
                        type="button"
                        onClick={handleSave} 
                        className={`${styles.button} ${styles.submitButton}`}
                        disabled={!routeForm.routeName || isLoading}
                    >
                        {isLoading ? (
                            <>
                                <div className={styles.spinner}></div>
                                Сохранение...
                            </>
                        ) : (
                            'Сохранить'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RouteForm;