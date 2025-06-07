import React from 'react';
import {
    Typography,
    Avatar,
    Chip,
    Divider,
    Box
} from '@mui/material';
import {
    Build as BuildIcon,
    Settings as SettingsIcon,
    Warning as WarningIcon,
    CheckCircle as CheckCircleIcon,
    Cancel as CancelIcon,
    CalendarToday as CalendarIcon,
    Straighten as SerialNumberIcon,
    BusinessCenter as ManufacturerIcon,
    EventNote as NotesIcon,
    EventNote
} from '@mui/icons-material';
import { IMachine, IMachineDetail } from '../MachineSettings';
import styles from './MachineDetails.module.css';

interface MachineDetailsProps {
    selectedMachine: IMachine | null;
    machineDetails: IMachineDetail[];
    getTypeName: (typeId: number) => string;
}

const MachineDetails: React.FC<MachineDetailsProps> = ({
    selectedMachine,
    machineDetails,
    getTypeName
}) => {
    if (!selectedMachine) {
        return (
            <Typography className={styles.selectPrompt}>
                Выберите станок для просмо��ра деталей
            </Typography>
        );
    }

    // Получаем иконку для статуса станка
    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'active':
                return <CheckCircleIcon />;
            case 'maintenance':
                return <BuildIcon />;
            case 'inactive':
                return <CancelIcon />;
            default:
                return <WarningIcon />;
        }
    };

    // Получаем текст статуса станка
    const getStatusText = (status: string) => {
        switch (status) {
            case 'active':
                return 'Активен';
            case 'maintenance':
                return 'На обслуживании';
            case 'inactive':
                return 'Неактивен';
            default:
                return 'Неизвестно';
        }
    };

    // Получаем цвет для статуса
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active':
                return '#4caf50';
            case 'maintenance':
                return '#ff9800';
            case 'inactive':
                return '#f44336';
            default:
                return '#9e9e9e';
        }
    };

    const machineDetail = machineDetails.find(detail => detail.machineId === selectedMachine.id);
    const typeName = getTypeName(selectedMachine.machineTypeId);

    return (
        <div className={styles.machineDetailsContainer}>
            <Typography variant="h6" component="h2" className={styles.detailsTitle}>
                Информация о станке
            </Typography>
            <Divider className={styles.divider} />

            <div className={styles.machineInfo}>
                <div className={styles.machineInfoHeader}>
                    <Avatar className={styles.largeAvatar} style={{ backgroundColor: getStatusColor(selectedMachine.status) }}>
                        {getStatusIcon(selectedMachine.status)}
                    </Avatar>
                    <div className={styles.machineMainInfo}>
                        <Typography variant="h5">{selectedMachine.name}</Typography>
                        <Chip
                            label={typeName}
                            className={styles.typeChipLarge}
                        />
                        <Chip
                            label={getStatusText(selectedMachine.status)}
                            className={styles.statusChip}
                            style={{ backgroundColor: getStatusColor(selectedMachine.status), color: 'white' }}
                        />
                    </div>
                </div>

                {machineDetail ? (
                    <div className={styles.machineDetailInfo}>
                        <div className={styles.detailRow}>
                            <Typography variant="subtitle2" className={styles.detailLabel}>
                                <SerialNumberIcon className={styles.detailIcon} /> Серийный номер:
                            </Typography>
                            <Typography>{machineDetail.serialNumber}</Typography>
                        </div>

                        {machineDetail.manufacturer && (
                            <div className={styles.detailRow}>
                                <Typography variant="subtitle2" className={styles.detailLabel}>
                                    <ManufacturerIcon className={styles.detailIcon} /> Производитель:
                                </Typography>
                                <Typography>{machineDetail.manufacturer}</Typography>
                            </div>
                        )}

                        {machineDetail.purchaseDate && (
                            <div className={styles.detailRow}>
                                <Typography variant="subtitle2" className={styles.detailLabel}>
                                    <CalendarIcon className={styles.detailIcon} /> Дата приобретения:
                                </Typography>
                                <Typography>{new Date(machineDetail.purchaseDate).toLocaleDateString('ru-RU')}</Typography>
                            </div>
                        )}

                        {machineDetail.lastMaintenance && (
                            <div className={styles.detailRow}>
                                <Typography variant="subtitle2" className={styles.detailLabel}>
                                    <BuildIcon className={styles.detailIcon} /> Последнее ТО:
                                </Typography>
                                <Typography>{new Date(machineDetail.lastMaintenance).toLocaleDateString('ru-RU')}</Typography>
                            </div>
                        )}

                        {machineDetail.nextMaintenance && (
                            <div className={styles.detailRow}>
                                <Typography variant="subtitle2" className={styles.detailLabel}>
                                    <CalendarIcon className={styles.detailIcon} /> Следующее ТО:
                                </Typography>
                                <Typography>{new Date(machineDetail.nextMaintenance).toLocaleDateString('ru-RU')}</Typography>
                            </div>
                        )}

                        {machineDetail.notes && (
                            <Box className={styles.notesBox}>
                                <Typography variant="subtitle2" className={styles.detailLabel}>
                                    <EventNote className={styles.detailIcon} /> Примечания:
                                </Typography>
                                <Typography className={styles.notesText}>
                                    {machineDetail.notes}
                                </Typography>
                            </Box>
                        )}
                    </div>
                ) : (
                    <Typography className={styles.noDetails}>
                        Дополнительная информация отсутствует
                    </Typography>
                )}
            </div>
        </div>
    );
};

export default MachineDetails;