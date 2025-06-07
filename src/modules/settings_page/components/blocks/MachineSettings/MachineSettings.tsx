import React, { useState, useEffect } from 'react';
import {
    Typography,
    Tabs,
    Tab,
    Paper,
    Grid
} from '@mui/material';
import styles from './MachineSettings.module.css';

// Компоненты
import MachineList from './components/MachineList';
import MachineDetails from './components/MachineDetails';
import MachineTypeList from './components/MachineTypeList';
import MachineForm from './components/MachineForm';
import MachineTypeForm from './components/MachineTypeForm';
import Notification, { NotificationSeverity } from './components/common/Notification';

// Интерфейсы для данных (в реальном приложении получаются с бэкенда)
export interface IMachineType {
    id: number;
    name: string;
    description: string | null;
}

export interface IMachineDetail {
    id: number;
    machineId: number;
    serialNumber: string;
    manufacturer: string | null;
    purchaseDate: string | null;
    lastMaintenance: string | null;
    nextMaintenance: string | null;
    notes: string | null;
}

export interface IMachine {
    id: number;
    name: string;
    status: 'active' | 'inactive' | 'maintenance';
    machineTypeId: number;
    details: IMachineDetail | null;
}

// Компонент настроек станков
const MachineSettings: React.FC = () => {
    // Состояния для списков
    const [machines, setMachines] = useState<IMachine[]>([]);
    const [machineTypes, setMachineTypes] = useState<IMachineType[]>([]);
    const [machineDetails, setMachineDetails] = useState<IMachineDetail[]>([]);

    // Состояние для активного таба
    const [activeTab, setActiveTab] = useState(0);

    // Состояния для выбранных элементов
    const [selectedMachine, setSelectedMachine] = useState<IMachine | null>(null);

    // Состояния для диалогов
    const [machineDialogOpen, setMachineDialogOpen] = useState(false);
    const [machineTypeDialogOpen, setMachineTypeDialogOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    // Состояние для уведомлений
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success' as NotificationSeverity
    });

    // Имитация загрузки данных с сервера
    useEffect(() => {
        // Здесь должен быть запрос к API для получения списка станков, типов и деталей
        const mockMachineTypes: IMachineType[] = [
            { id: 1, name: 'Токарный станок', description: 'Станок для обработки тел вращения' },
            { id: 2, name: 'Фрезерный станок', description: 'Станок для обработки плоскостей и пазов' },
            { id: 3, name: 'Сверлильный станок', description: 'Станок для сверления отверстий' }
        ];

        const mockMachineDetails: IMachineDetail[] = [
            { 
                id: 1, 
                machineId: 1, 
                serialNumber: 'TS-1234-5678', 
                manufacturer: 'ТокарьПром', 
                purchaseDate: '2021-05-15', 
                lastMaintenance: '2023-03-20', 
                nextMaintenance: '2023-09-20',
                notes: 'Требуется регулярная проверка подшипников'
            },
            { 
                id: 2, 
                machineId: 2, 
                serialNumber: 'FS-8765-4321', 
                manufacturer: 'ФрезаСтрой', 
                purchaseDate: '2022-02-10', 
                lastMaintenance: '2023-04-15', 
                nextMaintenance: '2023-10-15',
                notes: null
            },
            { 
                id: 3, 
                machineId: 3, 
                serialNumber: 'DS-9876-5432', 
                manufacturer: 'СверлоМаш', 
                purchaseDate: '2020-11-05', 
                lastMaintenance: '2023-02-10', 
                nextMaintenance: '2023-08-10',
                notes: 'Заменить комплект свёрл при следующем ТО'
            }
        ];

        const mockMachines: IMachine[] = [
            { id: 1, name: 'Токарный ТС-100', status: 'active', machineTypeId: 1, details: mockMachineDetails[0] },
            { id: 2, name: 'Фрезерный ФС-200', status: 'maintenance', machineTypeId: 2, details: mockMachineDetails[1] },
            { id: 3, name: 'Сверлильный СС-150', status: 'inactive', machineTypeId: 3, details: mockMachineDetails[2] }
        ];

        setMachineTypes(mockMachineTypes);
        setMachineDetails(mockMachineDetails);
        setMachines(mockMachines);
    }, []);

    // Обработчик для закрытия уведомления
    const handleCloseSnackbar = () => {
        setSnackbar(prev => ({ ...prev, open: false }));
    };

    // Получаем название типа станка по ID
    const getMachineTypeName = (typeId: number) => {
        const type = machineTypes.find(t => t.id === typeId);
        return type ? type.name : 'Неизвестный тип';
    };

    // Обработчики для станков
    const handleOpenMachineDialog = (machine?: IMachine) => {
        if (machine) {
            setIsEditing(true);
        } else {
            setIsEditing(false);
        }
        setMachineDialogOpen(true);
    };

    const handleCloseMachineDialog = () => {
        setMachineDialogOpen(false);
    };

    const handleSaveMachine = (machineData: Partial<IMachine>, detailsData: Partial<IMachineDetail>) => {
        // Валидация формы
        if (!machineData.name) {
            setSnackbar({
                open: true,
                message: 'Название станка обязательно',
                severity: 'error'
            });
            return;
        }

        if (!machineData.machineTypeId) {
            setSnackbar({
                open: true,
                message: 'Необходимо выбрать тип станка',
                severity: 'error'
            });
            return;
        }

        if (!detailsData.serialNumber) {
            setSnackbar({
                open: true,
                message: 'Серийный номер обязателен',
                severity: 'error'
            });
            return;
        }

        // Проверка на уникальность названия станка
        const isDuplicate = machines.some(m =>
            m.name === machineData.name &&
            (!isEditing || m.id !== machineData.id)
        );

        if (isDuplicate) {
            setSnackbar({
                open: true,
                message: 'Станок с таким названием уже существует',
                severity: 'error'
            });
            return;
        }

        // Имитация сохранения на сервер
        if (isEditing && machineData.id) {
            // Обновление существующего станка
            const updatedMachine: IMachine = {
                id: machineData.id,
                name: machineData.name!,
                status: machineData.status || 'inactive',
                machineTypeId: machineData.machineTypeId!,
                details: null // Будет обновлено ниже
            };

            setMachines(prev => prev.map(m =>
                m.id === updatedMachine.id ? updatedMachine : m
            ));

            // Обновление или создание деталей станка
            if (detailsData.id) {
                // Обновление существующих деталей
                const updatedDetails: IMachineDetail = {
                    id: detailsData.id,
                    machineId: machineData.id,
                    serialNumber: detailsData.serialNumber!,
                    manufacturer: detailsData.manufacturer || null,
                    purchaseDate: detailsData.purchaseDate || null,
                    lastMaintenance: detailsData.lastMaintenance || null,
                    nextMaintenance: detailsData.nextMaintenance || null,
                    notes: detailsData.notes || null
                };

                setMachineDetails(prev => prev.map(d =>
                    d.id === updatedDetails.id ? updatedDetails : d
                ));

                // Обновляем ссылку на детали в станке
                setMachines(prev => prev.map(m =>
                    m.id === machineData.id ? { ...m, details: updatedDetails } : m
                ));
            } else {
                // Создание новых деталей
                const newDetails: IMachineDetail = {
                    id: Math.max(...machineDetails.map(d => d.id), 0) + 1,
                    machineId: machineData.id,
                    serialNumber: detailsData.serialNumber!,
                    manufacturer: detailsData.manufacturer || null,
                    purchaseDate: detailsData.purchaseDate || null,
                    lastMaintenance: detailsData.lastMaintenance || null,
                    nextMaintenance: detailsData.nextMaintenance || null,
                    notes: detailsData.notes || null
                };

                setMachineDetails(prev => [...prev, newDetails]);

                // Обновляем ссылку на детали в станке
                setMachines(prev => prev.map(m =>
                    m.id === machineData.id ? { ...m, details: newDetails } : m
                ));
            }

            setSnackbar({
                open: true,
                message: 'Станок успешно обновлен',
                severity: 'success'
            });
        } else {
            // Создание нового станка
            const newMachineId = Math.max(...machines.map(m => m.id), 0) + 1;

            // Создание деталей станка
            const newDetails: IMachineDetail = {
                id: Math.max(...machineDetails.map(d => d.id), 0) + 1,
                machineId: newMachineId,
                serialNumber: detailsData.serialNumber!,
                manufacturer: detailsData.manufacturer || null,
                purchaseDate: detailsData.purchaseDate || null,
                lastMaintenance: detailsData.lastMaintenance || null,
                nextMaintenance: detailsData.nextMaintenance || null,
                notes: detailsData.notes || null
            };

            setMachineDetails(prev => [...prev, newDetails]);

            // Создание станка
            const newMachine: IMachine = {
                id: newMachineId,
                name: machineData.name!,
                status: machineData.status || 'inactive',
                machineTypeId: machineData.machineTypeId!,
                details: newDetails
            };

            setMachines(prev => [...prev, newMachine]);

            setSnackbar({
                open: true,
                message: 'Станок успешно создан',
                severity: 'success'
            });
        }

        handleCloseMachineDialog();
    };

    const handleDeleteMachine = (id: number) => {
        // Имитация удаления на сервере
        // Сначала удаляем детали станка
        setMachineDetails(prev => prev.filter(d => d.machineId !== id));

        // Затем удаляем сам станок
        setMachines(prev => prev.filter(m => m.id !== id));

        setSnackbar({
            open: true,
            message: 'Станок успешно удален',
            severity: 'success'
        });

        // Если был выбран этот станок, снимаем выбор
        if (selectedMachine?.id === id) {
            setSelectedMachine(null);
        }
    };

    // Обработчики для типов станков
    const handleOpenMachineTypeDialog = (machineType?: IMachineType) => {
        if (machineType) {
            setIsEditing(true);
        } else {
            setIsEditing(false);
        }
        setMachineTypeDialogOpen(true);
    };

    const handleCloseMachineTypeDialog = () => {
        setMachineTypeDialogOpen(false);
    };

    const handleSaveMachineType = (typeData: Partial<IMachineType>) => {
        if (!typeData.name) {
            setSnackbar({
                open: true,
                message: 'Название типа станка обязательно',
                severity: 'error'
            });
            return;
        }

        // Проверка на уникальность названия типа
        const isDuplicate = machineTypes.some(t =>
            t.name === typeData.name &&
            (!isEditing || t.id !== typeData.id)
        );

        if (isDuplicate) {
            setSnackbar({
                open: true,
                message: 'Тип с таким названием уже существует',
                severity: 'error'
            });
            return;
        }

        // Имитация сохранения на сервер
        if (isEditing && typeData.id) {
            // Обновление существующего типа
            setMachineTypes(prev => prev.map(t =>
                t.id === typeData.id
                    ? { ...t, ...typeData } as IMachineType
                    : t
            ));
            setSnackbar({
                open: true,
                message: 'Тип станка успешно обновлен',
                severity: 'success'
            });
        } else {
            // Создание нового типа
            const newType: IMachineType = {
                id: Math.max(...machineTypes.map(t => t.id), 0) + 1,
                name: typeData.name,
                description: typeData.description || null
            };
            setMachineTypes(prev => [...prev, newType]);
            setSnackbar({
                open: true,
                message: 'Тип станка успешно создан',
                severity: 'success'
            });
        }

        handleCloseMachineTypeDialog();
    };

    const handleDeleteMachineType = (id: number) => {
        // Проверка на наличие станков этого типа
        const hasTypesMachines = machines.some(machine => machine.machineTypeId === id);
        if (hasTypesMachines) {
            setSnackbar({
                open: true,
                message: 'Невозможно удалить тип, назначенный станкам',
                severity: 'error'
            });
            return;
        }

        // Имитация удаления на сервере
        setMachineTypes(prev => prev.filter(t => t.id !== id));
        setSnackbar({
            open: true,
            message: 'Тип станка успешно удален',
            severity: 'success'
        });
    };

    return (
        <div className={styles.machineSettings}>
            <Typography variant="h5" component="h1" className={styles.mainTitle}>
                Управление станками
            </Typography>

            <Tabs
                value={activeTab}
                onChange={(_, newValue) => setActiveTab(newValue)}
                className={styles.tabs}
            >
                <Tab label="Станки" />
                <Tab label="Типы станков" />
            </Tabs>

            {activeTab === 0 ? (
                <div className={styles.machineManagement}>
                    <Grid spacing={2}>
                        <Grid size={{ xs: 12, md: 5 }}>
                            <Paper className={styles.paper}>
                                <MachineList 
                                    machines={machines}
                                    machineTypes={machineTypes}
                                    selectedMachine={selectedMachine}
                                    setSelectedMachine={setSelectedMachine}
                                    onEdit={handleOpenMachineDialog}
                                    onDelete={handleDeleteMachine}
                                    getTypeName={getMachineTypeName}
                                />
                            </Paper>
                        </Grid>

                        <Grid size={{ xs: 12, md: 7 }}>
                            <Paper className={styles.paper}>
                                <MachineDetails 
                                    selectedMachine={selectedMachine}
                                    machineDetails={machineDetails}
                                    getTypeName={getMachineTypeName}
                                />
                            </Paper>
                        </Grid>
                    </Grid>
                </div>
            ) : (
                <div className={styles.typeManagement}>
                    <Paper className={styles.paper}>
                        <MachineTypeList 
                            machineTypes={machineTypes}
                            machines={machines}
                            onEdit={handleOpenMachineTypeDialog}
                            onDelete={handleDeleteMachineType}
                        />
                    </Paper>
                </div>
            )}

            {/* Диалог для создания/редактирования станка */}
            <MachineForm 
                open={machineDialogOpen}
                onClose={handleCloseMachineDialog}
                onSave={handleSaveMachine}
                machine={isEditing ? machines.find(m => m.id === selectedMachine?.id) : undefined}
                machineDetails={machineDetails.find(d => d.machineId === selectedMachine?.id)}
                machineTypes={machineTypes}
                isEditing={isEditing}
            />

            {/* Диалог для создания/редактирования типа станка */}
            <MachineTypeForm 
                open={machineTypeDialogOpen}
                onClose={handleCloseMachineTypeDialog}
                onSave={handleSaveMachineType}
                machineType={isEditing ? machineTypes.find(t => t.id === selectedMachine?.machineTypeId) : undefined}
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

export default MachineSettings;