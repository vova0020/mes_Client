import React, { useState, useEffect } from 'react';
import { 
    Route, 
    CreateRouteDto, 
    ProductionLine, 
    LineStagesResponse,
    routesApi 
} from '../api/routes.api';
import { useDeleteAllRouteStages } from '../hooks/useRoutes';
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

    // Хук для удаления всех этапов маршрута
    const deleteAllStagesMutation = useDeleteAllRouteStages();

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

            // Устанавливаем выбранные этапы
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

            // Загружаем этапы производственной линии если линия выбрана
            if (route.lineId) {
                loadLineStages(route.lineId);
            }
        } else {
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
    const loadLineStages = async (lineId: number) => {
        setLoadingStages(true);
        try {
            const stagesData = await routesApi.getLineStages(lineId);
            setLineStages(stagesData);
        } catch (error) {
            console.error('Ошибка загрузки этапов производственной линии:', error);
            setLineStages(null);
        } finally {
            setLoadingStages(false);
        }
    };

    // Обработчик изменения производственной линии
    const handleLineChange = async (lineId: number) => {
        setRouteForm(prev => ({ ...prev, lineId }));
        setSelectedStages([]); // Очищаем выбранные этапы
        
        if (lineId > 0) {
            loadLineStages(lineId);
        } else {
            setLineStages(null);
            
            // Если это редактирование существующего маршрута и выбрано "Без привязки к производственной линии"
            // то удаляем все этапы маршрута через API
            if (isEditing && route?.routeId && route.routeStages.length > 0) {
                try {
                    await deleteAllStagesMutation.mutateAsync(route.routeId);
                    console.log('Все этапы маршрута успешно удалены');
                } catch (error) {
                    console.error('Ошибка при удалении всех этапов маршрута:', error);
                }
            }
        }
    };

    // Автоматически добавить все этапы линии при загрузке этапов
    useEffect(() => {
        if (lineStages) {
            if (!isEditing) {
                // Для создания нового маршрута - автоматически добавляем все этапы линии
                const allStages: SelectedStage[] = lineStages.stagesLevel1.map((stage, index) => ({
                    stageId: stage.stageId,
                    substageId: undefined,
                    sequenceNumber: index + 1,
                    stageName: stage.stageName,
                    substageName: undefined
                }));
                setSelectedStages(allStages);
            } else {
                // При редактировании проверяем, есть ли этапы которых нет в текущем маршруте
                // и добавляем их в конец списка
                setSelectedStages(prevStages => {
                    const currentStageIds = prevStages.map(s => s.stageId);
                    const missingStages = lineStages.stagesLevel1.filter(stage => 
                        !currentStageIds.includes(stage.stageId)
                    );
                    
                    if (missingStages.length > 0) {
                        const newStages: SelectedStage[] = missingStages.map((stage, index) => ({
                            stageId: stage.stageId,
                            substageId: undefined,
                            sequenceNumber: prevStages.length + index + 1,
                            stageName: stage.stageName,
                            substageName: undefined
                        }));
                        
                        return [...prevStages, ...newStages];
                    }
                    
                    return prevStages;
                });
            }
        }
    }, [lineStages, isEditing]);

    // Обработчик изменения поля формы
    const handleRouteFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setRouteForm(prev => ({ ...prev, [name]: value }));
    };

    
    // Переместить этап вверх
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
                                        ? 'Загрузка этапов производственной ли��ии...'
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