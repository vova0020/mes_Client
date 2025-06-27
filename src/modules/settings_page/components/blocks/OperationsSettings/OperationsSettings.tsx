import React, { useState, useEffect } from 'react';
import {
    Typography,
    Tabs,
    Tab,
    Paper,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import styles from './OperationsSettings.module.css';

// Компоненты
import OperationsList from './components/OperationsList';
import OperationDetails from './components/OperationDetails';
import RelationsList from './components/RelationsList';
import OperationForm from './components/OperationForm';
import RelationForm from './components/RelationForm';
import MachineOperationsList from './components/MachineOperationsList';
import SegmentOperationsList from './components/SegmentOperationsList';
import Notification, { NotificationSeverity } from './components/common/Notification';


// Интерфейсы для данных
export interface IProcessStep {
    id: number;
    name: string;
    sequence: number;
    description: string | null;
}

export interface IStepRelation {
    parentId: number;
    childId: number;
    parent?: IProcessStep;
    child?: IProcessStep;
}

export interface IMachineProcessStep {
    id: number;
    machineId: number;
    processStepId: number;
    isDefault: boolean;
    machineName?: string; // Для отображения в интерфейсе
}

export interface ISegmentProcessStep {
    id: number;
    segmentId: number;
    processStepId: number;
    isPrimary: boolean;
    segmentName?: string; // Для отображения в интерфейсе
}

export interface IMachine {
    id: number;
    name: string;
}

export interface ISegment {
    id: number;
    name: string;
}

// Компонент настроек технологических операций
const OperationsSettings: React.FC = () => {
    // Состояния для списков
    const [operations, setOperations] = useState<IProcessStep[]>([]);
    const [relations, setRelations] = useState<IStepRelation[]>([]);
    const [machines, setMachines] = useState<IMachine[]>([]);
    const [segments, setSegments] = useState<ISegment[]>([]);
    const [machineSteps, setMachineSteps] = useState<IMachineProcessStep[]>([]);
    const [segmentSteps, setSegmentSteps] = useState<ISegmentProcessStep[]>([]);

    // Состояние для активного таба
    const [activeTab, setActiveTab] = useState(0);

    // Состояния для выбранных элементов
    const [selectedOperation, setSelectedOperation] = useState<IProcessStep | null>(null);

    // Состояния для диалогов
    const [operationDialogOpen, setOperationDialogOpen] = useState(false);
    const [relationDialogOpen, setRelationDialogOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    // Состояние для уведомлений
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success' as NotificationSeverity
    });

    // Имитация загрузки данных с сервера
    useEffect(() => {
        // Здесь должен быть запрос к API для получения списка операций, отношений, машин и участков
        const mockOperations: IProcessStep[] = [
            { id: 1, name: 'Раскрой', sequence: 1, description: 'Раскрой материала на заготовки' },
            { id: 2, name: 'Кромление', sequence: 2, description: 'Обработка краев деталей' },
            { id: 3, name: 'Присадка', sequence: 3, description: 'Сверление отверстий для крепежа' },
            { id: 4, name: 'Упаковка', sequence: 4, description: 'Упаковка готовых деталей' },
            { id: 5, name: 'Шлифовка', sequence: 5, description: 'Шлифовка поверхностей' },
            { id: 6, name: 'Покраска', sequence: 6, description: 'Покраска деталей' }
        ];

        const mockRelations: IStepRelation[] = [
            { parentId: 1, childId: 2, parent: mockOperations[0], child: mockOperations[1] },
            { parentId: 2, childId: 3, parent: mockOperations[1], child: mockOperations[2] },
            { parentId: 3, childId: 4, parent: mockOperations[2], child: mockOperations[3] },
            { parentId: 1, childId: 5, parent: mockOperations[0], child: mockOperations[4] },
            { parentId: 5, childId: 6, parent: mockOperations[4], child: mockOperations[5] },
            { parentId: 6, childId: 4, parent: mockOperations[5], child: mockOperations[3] }
        ];

        const mockMachines: IMachine[] = [
            { id: 1, name: 'Станок раскроя' },
            { id: 2, name: 'Кромкооблицовочный станок' },
            { id: 3, name: 'Станок для присадки' },
            { id: 4, name: 'Упаковочный станок' },
            { id: 5, name: 'Шлифовальный станок' },
            { id: 6, name: 'Покрасочная камера' }
        ];

        const mockSegments: ISegment[] = [
            { id: 1, name: 'Участок раскроя' },
            { id: 2, name: 'Участок кромления' },
            { id: 3, name: 'Участок присадки' },
            { id: 4, name: 'Участок упаковки' },
            { id: 5, name: 'Участок финишной обработки' }
        ];

        const mockMachineSteps: IMachineProcessStep[] = [
            { id: 1, machineId: 1, processStepId: 1, isDefault: true, machineName: 'Станок раскроя' },
            { id: 2, machineId: 2, processStepId: 2, isDefault: true, machineName: 'Кромкооблицовочный станок' },
            { id: 3, machineId: 3, processStepId: 3, isDefault: true, machineName: 'Станок для присадки' },
            { id: 4, machineId: 4, processStepId: 4, isDefault: true, machineName: 'Упаковочный станок' },
            { id: 5, machineId: 5, processStepId: 5, isDefault: true, machineName: 'Шлифовальный станок' },
            { id: 6, machineId: 6, processStepId: 6, isDefault: true, machineName: 'Покрасочная камера' }
        ];

        const mockSegmentSteps: ISegmentProcessStep[] = [
            { id: 1, segmentId: 1, processStepId: 1, isPrimary: true, segmentName: 'Участок раскроя' },
            { id: 2, segmentId: 2, processStepId: 2, isPrimary: true, segmentName: 'Участок кромления' },
            { id: 3, segmentId: 3, processStepId: 3, isPrimary: true, segmentName: 'Участок присадки' },
            { id: 4, segmentId: 4, processStepId: 4, isPrimary: true, segmentName: 'Участок упаковки' },
            { id: 5, segmentId: 5, processStepId: 5, isPrimary: true, segmentName: 'Участок финишной обработки' },
            { id: 6, segmentId: 5, processStepId: 6, isPrimary: false, segmentName: 'Участок финишной обработки' }
        ];

        setOperations(mockOperations);
        setRelations(mockRelations);
        setMachines(mockMachines);
        setSegments(mockSegments);
        setMachineSteps(mockMachineSteps);
        setSegmentSteps(mockSegmentSteps);
    }, []);

    // Обработчик для закрытия уведомления
    const handleCloseSnackbar = () => {
        setSnackbar(prev => ({ ...prev, open: false }));
    };

    // Получение информации о родительских и дочерних операциях
    const getParentOperations = (operationId: number) => {
        return relations
            .filter(relation => relation.childId === operationId)
            .map(relation => operations.find(op => op.id === relation.parentId))
            .filter(Boolean) as IProcessStep[];
    };

    const getChildOperations = (operationId: number) => {
        return relations
            .filter(relation => relation.parentId === operationId)
            .map(relation => operations.find(op => op.id === relation.childId))
            .filter(Boolean) as IProcessStep[];
    };

    // Получение станков и участков для операции
    const getMachinesForOperation = (operationId: number) => {
        return machineSteps
            .filter(step => step.processStepId === operationId)
            .map(step => ({
                ...step,
                machineName: machines.find(m => m.id === step.machineId)?.name || 'Неизвестный станок'
            }));
    };

    const getSegmentsForOperation = (operationId: number) => {
        return segmentSteps
            .filter(step => step.processStepId === operationId)
            .map(step => ({
                ...step,
                segmentName: segments.find(s => s.id === step.segmentId)?.name || 'Неизвестный участок'
            }));
    };

    // Обработчики для операций
    const handleOpenOperationDialog = (operation?: IProcessStep) => {
        if (operation) {
            setIsEditing(true);
            setSelectedOperation(operation);
        } else {
            setIsEditing(false);
            setSelectedOperation(null);
        }
        setOperationDialogOpen(true);
    };

    const handleCloseOperationDialog = () => {
        setOperationDialogOpen(false);
    };

    const handleSaveOperation = (operationData: Partial<IProcessStep>) => {
        // Валидация формы
        if (!operationData.name) {
            setSnackbar({
                open: true,
                message: 'Название операции обязательно',
                severity: 'error'
            });
            return;
        }

        // Проверка на уникальность названия операции
        const isDuplicate = operations.some(op =>
            op.name === operationData.name &&
            (!isEditing || op.id !== operationData.id)
        );

        if (isDuplicate) {
            setSnackbar({
                open: true,
                message: 'Операция с таким названием уже существует',
                severity: 'error'
            });
            return;
        }

        // Имитация сохранения на сервер
        if (isEditing && operationData.id) {
            // Обновление существующей операции
            const updatedOperation: IProcessStep = {
                id: operationData.id,
                name: operationData.name,
                sequence: operationData.sequence || 0,
                description: operationData.description || null
            };

            setOperations(prev => prev.map(op =>
                op.id === updatedOperation.id ? updatedOperation : op
            ));

            // Обновляем ссылки на операцию в отношениях
            setRelations(prev => prev.map(relation => {
                if (relation.parentId === operationData.id) {
                    return {
                        ...relation,
                        parent: updatedOperation
                    };
                }
                if (relation.childId === operationData.id) {
                    return {
                        ...relation,
                        child: updatedOperation
                    };
                }
                return relation;
            }));

            setSnackbar({
                open: true,
                message: 'Операция успешно обновлена',
                severity: 'success'
            });
        } else {
            // Создание новой операции
            const newOperation: IProcessStep = {
                id: Math.max(...operations.map(op => op.id), 0) + 1,
                name: operationData.name,
                sequence: operationData.sequence || operations.length + 1,
                description: operationData.description || null
            };

            setOperations(prev => [...prev, newOperation]);

            setSnackbar({
                open: true,
                message: 'Операция успешно создана',
                severity: 'success'
            });
        }

        handleCloseOperationDialog();
    };

    const handleDeleteOperation = (id: number) => {
        // Проверка на наличие отношений с этой операцией
        const hasRelations = relations.some(
            relation => relation.parentId === id || relation.childId === id
        );

        // Проверка на наличие связей со станками
        const hasMachineConnections = machineSteps.some(
            step => step.processStepId === id
        );

        // Проверка на наличие связей с участками
        const hasSegmentConnections = segmentSteps.some(
            step => step.processStepId === id
        );

        if (hasRelations || hasMachineConnections || hasSegmentConnections) {
            setSnackbar({
                open: true,
                message: 'Невозможно удалить операцию, имеющую связи',
                severity: 'error'
            });
            return;
        }

        // Имитация удаления на сервере
        setOperations(prev => prev.filter(op => op.id !== id));

        setSnackbar({
            open: true,
            message: 'Операция успешно удалена',
            severity: 'success'
        });

        // Если была выбрана эта операция, снимаем выбор
        if (selectedOperation?.id === id) {
            setSelectedOperation(null);
        }
    };

    // Обработчики для отношений между операциями
    const handleOpenRelationDialog = () => {
        setRelationDialogOpen(true);
    };

    const handleCloseRelationDialog = () => {
        setRelationDialogOpen(false);
    };

    const handleSaveRelation = (parentId: number, childId: number) => {
        // Проверка на существование операций
        const parentExists = operations.some(op => op.id === parentId);
        const childExists = operations.some(op => op.id === childId);

        if (!parentExists || !childExists) {
            setSnackbar({
                open: true,
                message: 'Одна из операций не существует',
                severity: 'error'
            });
            return;
        }

        // Проверка на циклические зависимости
        // Простая проверка - нельзя создать отношение, если операция уже является родителем для другой
        const wouldCreateCycle = isChildOf(parentId, childId);

        if (wouldCreateCycle) {
            setSnackbar({
                open: true,
                message: 'Нельзя создать циклическую зависимость',
                severity: 'error'
            });
            return;
        }

        // Проверка на дублирование
        const isDuplicate = relations.some(
            relation => relation.parentId === parentId && relation.childId === childId
        );

        if (isDuplicate) {
            setSnackbar({
                open: true,
                message: 'Такое отношение уже существует',
                severity: 'error'
            });
            return;
        }

        // Создание нового отношения
        const parent = operations.find(op => op.id === parentId);
        const child = operations.find(op => op.id === childId);

        const newRelation: IStepRelation = {
            parentId,
            childId,
            parent,
            child
        };

        setRelations(prev => [...prev, newRelation]);

        setSnackbar({
            open: true,
            message: 'Отношение успешно создано',
            severity: 'success'
        });

        handleCloseRelationDialog();
    };

    const handleDeleteRelation = (parentId: number, childId: number) => {
        // Имитация удаления на сервере
        setRelations(prev => prev.filter(
            relation => !(relation.parentId === parentId && relation.childId === childId)
        ));

        setSnackbar({
            open: true,
            message: 'Отношение успешно удалено',
            severity: 'success'
        });
    };

    // Функция для проверки, является ли одна операция потомком другой (для проверки циклов)
    const isChildOf = (potentialChildId: number, ancestorId: number, visited: Set<number> = new Set()): boolean => {
        if (potentialChildId === ancestorId) return true;
        if (visited.has(potentialChildId)) return false;
        
        visited.add(potentialChildId);
        
        const childrenOfChild = getChildOperations(potentialChildId);
        return childrenOfChild.some(child => isChildOf(child.id, ancestorId, visited));
    };

    return (
        <div className={styles.operationsSettings}>
            <Typography variant="h5" component="h1" className={styles.mainTitle}>
                Управление технологическими операциями
            </Typography>

            <Tabs
                value={activeTab}
                onChange={(_, newValue) => setActiveTab(newValue)}
                className={styles.tabs}
            >
                <Tab label="Операции" />
                <Tab label="Связи" />
                <Tab label="Станки" />
                <Tab label="Участки" />
            </Tabs>

            {activeTab === 0 ? (
                <div className={styles.operationsManagement}>
                    <Grid container spacing={2} style={{ height: '100%' }}>
                        <Grid size={{ xs: 12, md: 5 }} style={{ height: '100%' }}>
                            <Paper className={styles.paper}>
                                <OperationsList
                                    operations={operations}
                                    selectedOperation={selectedOperation}
                                    setSelectedOperation={setSelectedOperation}
                                    onEdit={handleOpenOperationDialog}
                                    onDelete={handleDeleteOperation}
                                />
                            </Paper>
                        </Grid>
                        <Grid size={{ xs: 12, md: 7 }} style={{ height: '100%' }} className={styles.rightColumn}>
                            <Paper className={styles.paper} style={{ height: '100%' }}>
                                <OperationDetails
                                    selectedOperation={selectedOperation}
                                    parentOperations={selectedOperation ? getParentOperations(selectedOperation.id) : []}
                                    childOperations={selectedOperation ? getChildOperations(selectedOperation.id) : []}
                                    machineSteps={selectedOperation ? getMachinesForOperation(selectedOperation.id) : []}
                                    segmentSteps={selectedOperation ? getSegmentsForOperation(selectedOperation.id) : []}
                                />
                            </Paper>
                        </Grid>
                    </Grid>
                </div>
            ) : activeTab === 1 ? (
                <div className={styles.relationsManagement}>
                    <Paper className={styles.paper}>
                        <RelationsList
                            relations={relations}
                            operations={operations}
                            onDelete={handleDeleteRelation}
                            onAdd={handleOpenRelationDialog}
                        />
                    </Paper>
                </div>
            ) : activeTab === 2 ? (
                <div className={styles.machineStepsManagement}>
                    <Paper className={styles.paper}>
                        <MachineOperationsList
                            machineSteps={machineSteps}
                            machines={machines}
                            operations={operations}
                        />
                    </Paper>
                </div>
            ) : (
                <div className={styles.segmentStepsManagement}>
                    <Paper className={styles.paper}>
                        <SegmentOperationsList
                            segmentSteps={segmentSteps}
                            segments={segments}
                            operations={operations}
                        />
                    </Paper>
                </div>
            )}

            {/* Диалог для создания/редактирования операции */}
            <OperationForm
                open={operationDialogOpen}
                onClose={handleCloseOperationDialog}
                onSave={handleSaveOperation}
                operation={selectedOperation}
                isEditing={isEditing}
            />

            {/* Диалог для создания отношения */}
            <RelationForm
                open={relationDialogOpen}
                onClose={handleCloseRelationDialog}
                onSave={handleSaveRelation}
                operations={operations}
            />

            {/* Уведомления */}
            <Notification
                open={snackbar.open}
                message={snackbar.message}
                severity={snackbar.severity}
                onClose={handleCloseSnackbar}
            />
        </div>
    );
};

export default OperationsSettings;