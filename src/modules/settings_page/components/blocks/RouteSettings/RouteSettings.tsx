import React, { useState, useEffect } from 'react';
import {
    Typography,
    Tabs,
    Tab,
    Paper,

} from '@mui/material';
import Grid from '@mui/material/Grid';
import styles from './RouteSettings.module.css';

// Компоненты
import RouteList from './components/RouteList';
import RouteDetails from './components/RouteDetails';
import StepList from './components/StepList';
import RouteForm from './components/RouteForm';
import StepForm from './components/StepForm';
import Notification, { NotificationSeverity } from './components/common/Notification';

// Интерфейсы для данных (в реальном приложении получаются с бэкенда)
export interface IProcessStep {
    id: number;
    name: string;
    sequence: number;
    description: string | null;
}

export interface IRouteStep {
    id: number;
    routeId: number;
    processStepId: number;
    sequence: number;
    processStep?: IProcessStep;
}

export interface IProductionRoute {
    id: number;
    name: string;
    steps: IRouteStep[] | null;
}

export interface IProductionDetail {
    id: number;
    article: string;
    name: string;
    material: string;
    size: string;
    routeId: number | null;
}

// Компонент настроек маршрутов
const RouteSettings: React.FC = () => {
    // Состояния для списков
    const [routes, setRoutes] = useState<IProductionRoute[]>([]);
    const [steps, setSteps] = useState<IProcessStep[]>([]);
    const [details, setDetails] = useState<IProductionDetail[]>([]);
    const [routeSteps, setRouteSteps] = useState<IRouteStep[]>([]);

    // Состояние для активного таба
    const [activeTab, setActiveTab] = useState(0);

    // Состояния для выбранных элементов
    const [selectedRoute, setSelectedRoute] = useState<IProductionRoute | null>(null);
    const [selectedStep, setSelectedStep] = useState<IProcessStep | null>(null);

    // Состояния для диалогов
    const [routeDialogOpen, setRouteDialogOpen] = useState(false);
    const [stepDialogOpen, setStepDialogOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    // Состояние для уведомлений
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success' as NotificationSeverity
    });

    // Имитация загрузки данных с сервера
    useEffect(() => {
        // Здесь должен быть запрос к API для получения списка маршрутов, этапов и деталей
        const mockSteps: IProcessStep[] = [
            { id: 1, name: 'Раскрой', sequence: 1, description: 'Раскрой материала на заготовки' },
            { id: 2, name: 'Кромление', sequence: 2, description: 'Обработка краев деталей' },
            { id: 3, name: 'Присадка', sequence: 3, description: 'Сверление отверстий для крепежа' },
            { id: 4, name: 'Упаковка', sequence: 4, description: 'Упаковка готовых деталей' },
            { id: 5, name: 'Упаковка2', sequence: 5, description: 'Упаковка готовых деталей' },
            { id: 6, name: 'Упаковка3', sequence: 6, description: 'Упаковка готовых деталей' },
            { id: 7, name: 'Упаковка4', sequence: 7, description: 'Упаковка готовых деталей' },
            { id: 8, name: 'Упаковка5', sequence: 8, description: 'Упаковка готовых деталей' },
            { id: 9, name: 'Упаковка6', sequence: 9, description: 'Упаковка готовых деталей' },
            { id: 10, name: 'Упаковк7', sequence: 10, description: 'Упаковка готовых деталей' }
        ];

        const mockRouteSteps: IRouteStep[] = [
            { id: 1, routeId: 1, processStepId: 1, sequence: 1, processStep: mockSteps[0] },
            { id: 2, routeId: 1, processStepId: 2, sequence: 2, processStep: mockSteps[1] },
            { id: 3, routeId: 1, processStepId: 3, sequence: 3, processStep: mockSteps[2] },
            { id: 3, routeId: 1, processStepId: 4, sequence: 4, processStep: mockSteps[3] },
            { id: 3, routeId: 1, processStepId: 5, sequence: 5, processStep: mockSteps[4] },
            { id: 3, routeId: 1, processStepId: 6, sequence: 6, processStep: mockSteps[5] },
            { id: 3, routeId: 1, processStepId: 7, sequence: 7, processStep: mockSteps[6] },
            { id: 3, routeId: 1, processStepId: 8, sequence: 8, processStep: mockSteps[7] },
            { id: 3, routeId: 1, processStepId: 9, sequence: 9, processStep: mockSteps[8] },
            { id: 3, routeId: 1, processStepId: 10, sequence: 10, processStep: mockSteps[9] },
            { id: 4, routeId: 2, processStepId: 1, sequence: 1, processStep: mockSteps[0] },
            { id: 5, routeId: 2, processStepId: 3, sequence: 2, processStep: mockSteps[2] },
            { id: 6, routeId: 3, processStepId: 2, sequence: 1, processStep: mockSteps[1] },
            { id: 7, routeId: 3, processStepId: 4, sequence: 2, processStep: mockSteps[3] }
        ];

        const mockRoutes: IProductionRoute[] = [
            { id: 1, name: 'Стандартный маршрут', steps: mockRouteSteps.filter(rs => rs.routeId === 1) },
            { id: 2, name: 'Маршрут без кромления', steps: mockRouteSteps.filter(rs => rs.routeId === 2) },
            { id: 3, name: 'Маршрут без раскроя и присадки', steps: mockRouteSteps.filter(rs => rs.routeId === 3) }
        ];

        const mockDetails: IProductionDetail[] = [
            { id: 1, article: 'DT-001', name: 'Столешница', material: 'ДСП', size: '120x60x2.5', routeId: 1 },
            { id: 2, article: 'DT-002', name: 'Боковая панель', material: 'ДСП', size: '75x60x1.8', routeId: 1 },
            { id: 3, article: 'DT-003', name: 'Задняя стенка', material: 'ДВП', size: '120x75x0.3', routeId: 1 },
            { id: 4, article: 'DT-003', name: 'Задняя стенка', material: 'ДВП', size: '120x75x0.3', routeId: 1 },
            { id: 5, article: 'DT-003', name: 'Задняя стенка', material: 'ДВП', size: '120x75x0.3', routeId: 1 },
            { id: 6, article: 'DT-003', name: 'Задняя стенка', material: 'ДВП', size: '120x75x0.3', routeId: 2 },
            { id: 7, article: 'DT-004', name: 'Полка', material: 'ДСП', size: '58x30x1.8', routeId: 3 }
        ];

        setSteps(mockSteps);
        setRouteSteps(mockRouteSteps);
        setRoutes(mockRoutes);
        setDetails(mockDetails);
    }, []);

    // Обработчик для закрытия уведомления
    const handleCloseSnackbar = () => {
        setSnackbar(prev => ({ ...prev, open: false }));
    };

    // Получаем название этапа по ID
    const getStepName = (stepId: number) => {
        const step = steps.find(s => s.id === stepId);
        return step ? step.name : 'Неизвестный этап';
    };

    // Обработчики для маршрутов
    const handleOpenRouteDialog = (route?: IProductionRoute) => {
        if (route) {
            setIsEditing(true);
            setSelectedRoute(route);
        } else {
            setIsEditing(false);
            setSelectedRoute(null);
        }
        setRouteDialogOpen(true);
    };

    const handleCloseRouteDialog = () => {
        setRouteDialogOpen(false);
    };

    const handleSaveRoute = (routeData: Partial<IProductionRoute>, selectedSteps: IRouteStep[]) => {
        // Валидация формы
        if (!routeData.name) {
            setSnackbar({
                open: true,
                message: 'Название маршрута обязательно',
                severity: 'error'
            });
            return;
        }

        if (selectedSteps.length === 0) {
            setSnackbar({
                open: true,
                message: 'Необходимо выбрать хотя бы один этап обработки',
                severity: 'error'
            });
            return;
        }

        // Проверка на уникальность названия маршрута
        const isDuplicate = routes.some(r =>
            r.name === routeData.name &&
            (!isEditing || r.id !== routeData.id)
        );

        if (isDuplicate) {
            setSnackbar({
                open: true,
                message: 'Маршрут с таким названием уже существует',
                severity: 'error'
            });
            return;
        }

        // Имитация сохранения на сервер
        if (isEditing && routeData.id) {
            // Обновление существующего маршрута
            const updatedRoute: IProductionRoute = {
                id: routeData.id,
                name: routeData.name,
                steps: null // Будет обновлено ниже
            };

            setRoutes(prev => prev.map(r =>
                r.id === updatedRoute.id ? updatedRoute : r
            ));

            // Удаляем старые связи маршрута с этапами
            setRouteSteps(prev => prev.filter(rs => rs.routeId !== routeData.id));

            // Добавляем новые связи маршрута с этапами
            const newRouteSteps = selectedSteps.map((step, index) => ({
                ...step,
                id: Math.max(...routeSteps.map(rs => rs.id), 0) + index + 1,
                routeId: routeData.id!,
                sequence: index + 1,
                processStep: steps.find(s => s.id === step.processStepId)
            }));

            setRouteSteps(prev => [...prev, ...newRouteSteps]);

            // Обновляем ссылку на этапы в маршруте
            setRoutes(prev => prev.map(r =>
                r.id === routeData.id ? { ...r, steps: newRouteSteps } : r
            ));

            setSnackbar({
                open: true,
                message: 'Маршрут успешно обновлен',
                severity: 'success'
            });
        } else {
            // Создание нового маршрута
            const newRouteId = Math.max(...routes.map(r => r.id), 0) + 1;

            // Создание нового маршрута
            const newRoute: IProductionRoute = {
                id: newRouteId,
                name: routeData.name,
                steps: null // Будет обновлено ниже
            };

            setRoutes(prev => [...prev, newRoute]);

            // Создание новых связей маршрута с этапами
            const newRouteSteps = selectedSteps.map((step, index) => ({
                ...step,
                id: Math.max(...routeSteps.map(rs => rs.id), 0) + index + 1,
                routeId: newRouteId,
                sequence: index + 1,
                processStep: steps.find(s => s.id === step.processStepId)
            }));

            setRouteSteps(prev => [...prev, ...newRouteSteps]);

            // Обновляем ссылку на этапы в маршруте
            setRoutes(prev => prev.map(r =>
                r.id === newRouteId ? { ...r, steps: newRouteSteps } : r
            ));

            setSnackbar({
                open: true,
                message: 'Маршрут успешно создан',
                severity: 'success'
            });
        }

        handleCloseRouteDialog();
    };

    const handleDeleteRoute = (id: number) => {
        // Проверка на наличие деталей с этим маршрутом
        const hasRouteDetails = details.some(detail => detail.routeId === id);
        if (hasRouteDetails) {
            setSnackbar({
                open: true,
                message: 'Невозможно удалить маршрут, назначенный деталям',
                severity: 'error'
            });
            return;
        }

        // Имитация удаления на сервере
        // Сначала удаляем связи маршрута с этапами
        setRouteSteps(prev => prev.filter(rs => rs.routeId !== id));

        // Затем удаляем сам маршрут
        setRoutes(prev => prev.filter(r => r.id !== id));

        setSnackbar({
            open: true,
            message: 'Маршрут успешно удален',
            severity: 'success'
        });

        // Если был выбран этот маршрут, снимаем выбор
        if (selectedRoute?.id === id) {
            setSelectedRoute(null);
        }
    };

    // Обработчики для этапов обработки
    const handleOpenStepDialog = (step?: IProcessStep) => {
        if (step) {
            setIsEditing(true);
            setSelectedStep(step);
        } else {
            setIsEditing(false);
            setSelectedStep(null);
        }
        setStepDialogOpen(true);
    };

    const handleCloseStepDialog = () => {
        setStepDialogOpen(false);
    };

    const handleSaveStep = (stepData: Partial<IProcessStep>) => {
        if (!stepData.name) {
            setSnackbar({
                open: true,
                message: 'Название этапа обязательно',
                severity: 'error'
            });
            return;
        }

        // Проверка на уникальность названия этапа
        const isDuplicate = steps.some(s =>
            s.name === stepData.name &&
            (!isEditing || s.id !== stepData.id)
        );

        if (isDuplicate) {
            setSnackbar({
                open: true,
                message: 'Этап с таким названием уже существует',
                severity: 'error'
            });
            return;
        }

        // Имитация сохранения на сервер
        if (isEditing && stepData.id) {
            // Обновление существующего этапа
            const updatedStep: IProcessStep = {
                id: stepData.id,
                name: stepData.name,
                sequence: stepData.sequence || 0,
                description: stepData.description || null
            };

            setSteps(prev => prev.map(s =>
                s.id === updatedStep.id ? updatedStep : s
            ));

            // Обновляем ссылки на этап в маршрутах
            setRouteSteps(prev => prev.map(rs => {
                if (rs.processStepId === stepData.id) {
                    return {
                        ...rs,
                        processStep: updatedStep
                    };
                }
                return rs;
            }));

            setSnackbar({
                open: true,
                message: 'Этап успешно обновлен',
                severity: 'success'
            });
        } else {
            // Создание нового этапа
            const newStep: IProcessStep = {
                id: Math.max(...steps.map(s => s.id), 0) + 1,
                name: stepData.name,
                sequence: stepData.sequence || 0,
                description: stepData.description || null
            };

            setSteps(prev => [...prev, newStep]);

            setSnackbar({
                open: true,
                message: 'Этап успешно создан',
                severity: 'success'
            });
        }

        handleCloseStepDialog();
    };

    const handleDeleteStep = (id: number) => {
        // Проверка на наличие маршрутов с этим этапом
        const hasStepRoutes = routeSteps.some(rs => rs.processStepId === id);
        if (hasStepRoutes) {
            setSnackbar({
                open: true,
                message: 'Невозможно удалить этап, используемый в маршрутах',
                severity: 'error'
            });
            return;
        }

        // Имитация удаления на сервере
        setSteps(prev => prev.filter(s => s.id !== id));

        setSnackbar({
            open: true,
            message: 'Этап успешно удален',
            severity: 'success'
        });

        // Если был выбран этот этап, снимаем выбор
        if (selectedStep?.id === id) {
            setSelectedStep(null);
        }
    };

    return (
        <div className={styles.routeSettings}>
            <Typography variant="h5" component="h1" className={styles.mainTitle}>
                Управление маршрутами
            </Typography>

            <Tabs
                value={activeTab}
                onChange={(_, newValue) => setActiveTab(newValue)}
                className={styles.tabs}
            >
                <Tab label="Маршруты" />
                <Tab label="Этапы обработки" />
            </Tabs>

            {activeTab === 0 ? (
                <div className={styles.routeManagement}>
                    <Grid container spacing={2} style={{ height: '100%' }}>
                        <Grid size={{ xs: 12, md: 5 }} style={{ height: '100%' }}>
                            <Paper className={styles.paper}>
                                <RouteList
                                    routes={routes}
                                    steps={steps}
                                    selectedRoute={selectedRoute}
                                    setSelectedRoute={setSelectedRoute}
                                    onEdit={handleOpenRouteDialog}
                                    onDelete={handleDeleteRoute}
                                    getStepName={getStepName}
                                />
                            </Paper>
                        </Grid>
                        <Grid size={{ xs: 12, md: 7 }} style={{ height: '100%' }} className={styles.rightColumn}>
                            <Paper className={styles.paper} style={{ height: '100%' }}>
                                <RouteDetails
                                    selectedRoute={selectedRoute}
                                    routeSteps={routeSteps.filter(rs => rs.routeId === selectedRoute?.id)}
                                    details={details.filter(d => d.routeId === selectedRoute?.id)}
                                    getStepName={getStepName}
                                />
                            </Paper>
                        </Grid>
                    </Grid>
                </div>
            ) : (
                <div className={styles.stepManagement}>
                    <Paper className={styles.paper}>
                        <StepList
                            steps={steps}
                            routeSteps={routeSteps}
                            onEdit={handleOpenStepDialog}
                            onDelete={handleDeleteStep}
                        />
                    </Paper>
                </div>
            )}

            {/* Диалог для создания/редактирования маршрута */}
            <RouteForm
                open={routeDialogOpen}
                onClose={handleCloseRouteDialog}
                onSave={handleSaveRoute}
                route={selectedRoute}
                steps={steps}
                routeSteps={routeSteps.filter(rs => rs.routeId === selectedRoute?.id)}
                isEditing={isEditing}
            />

            {/* Диалог для создания/редактирования этапа */}
            <StepForm
                open={stepDialogOpen}
                onClose={handleCloseStepDialog}
                onSave={handleSaveStep}
                step={selectedStep}
                isEditing={isEditing}
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

export default RouteSettings;