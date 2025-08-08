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
        const prevLineId = routeForm.lineId;
        setRouteForm(prev => ({ ...prev, lineId }));
        
        if (lineId > 0) {
            // При выборе производственной линии всегда загружаем этапы
            const stagesData = await loadLineStages(lineId);
            
            // При редактировании: если пользователь выбрал ту же линию повторно,
            // заменяем текущие этапы маршрута на все этапы линии
            if (isEditing && lineId === prevLineId && stagesData) {
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
        if (!lineStages) return;

        const allStages = lineStages.stagesLevel1.map((stage, index) => ({
            stageId: stage.stageId,
            substageId: undefined,
            sequenceNumber: index + 1,
            stageName: stage.stageName,
            substageName: undefined
        }));

        // При создании нового маршрута всегда показываем все этапы линии
        if (!isEditing) {
            setSelectedStages(allStages);
            return;
        }

        // При редактировании и смене линии показываем все этапы новой линии
        if (route?.lineId !== routeForm.lineId) {
            setSelectedStages(allStages);
        }
        // При редактировании с той же линией оставляем текущие этапы
        // (они обновятся через handleLineChange если пользователь специально выберет ту же линию)
        
    }, [lineStages, isEditing, route?.lineId, routeForm.lineId]);

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
    
    const handleMoveUp = (index: number) => {
        if (index === 0) return;
        
        const stages = [...selectedStages];
        const temp = stages[index];
        stages[index] = stages[index - 1];
        stages[index - 1] = temp;
        
        const reorderedStages = stages.map((stage, idx) => ({
            ...stage,
            sequenceNumber: idx + 1
        }));
        
        setSelectedStages(reorderedStages);
    };
    
    // Переместить этап вниз
    const handleMoveDown = (index: number) => {
        if (index === selectedStages.length - 1) return;
        
        const stages = [...selectedStages];
        const temp = stages[index];
        stages[index] = stages[index + 1];
        stages[index + 1] = temp;
        
        const reorderedStages = stages.map((stage, idx) => ({
            ...stage,
            sequenceNumber: idx + 1
        }));
        
        setSelectedStages(reorderedStages);
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
                            Этапы производственной линии (настройка порядка выполнения)
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
                                        className={styles.stageItem}
                                    >
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
                                            <button
                                                type="button"
                                                onClick={() => handleMoveUp(index)}
                                                disabled={index === 0}
                                                className={styles.actionButton}
                                                title="Переместить вверх"
                                            >
                                                ↑
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleMoveDown(index)}
                                                disabled={index === selectedStages.length - 1}
                                                className={styles.actionButton}
                                                title="Переместить вниз"
                                            >
                                                ↓
                                            </button>
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