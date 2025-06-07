import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Grid,
    Typography,
    SelectChangeEvent
} from '@mui/material';
import { IMachine, IMachineDetail, IMachineType } from '../MachineSettings';
import styles from './MachineForm.module.css';

interface MachineFormProps {
    open: boolean;
    onClose: () => void;
    onSave: (machineData: Partial<IMachine>, detailsData: Partial<IMachineDetail>) => void;
    machine?: IMachine;
    machineDetails?: IMachineDetail;
    machineTypes: IMachineType[];
    isEditing: boolean;
}

const MachineForm: React.FC<MachineFormProps> = ({
    open,
    onClose,
    onSave,
    machine,
    machineDetails,
    machineTypes,
    isEditing
}) => {
    // Состояние для фор��ы станка
    const [machineForm, setMachineForm] = useState<Partial<IMachine>>({
        name: '',
        status: 'inactive',
        machineTypeId: 0
    });

    // Состояние для формы деталей станка
    const [detailsForm, setDetailsForm] = useState<Partial<IMachineDetail>>({
        serialNumber: '',
        manufacturer: '',
        purchaseDate: '',
        lastMaintenance: '',
        nextMaintenance: '',
        notes: ''
    });

    // Инициализация формы при открытии
    useEffect(() => {
        if (machine && isEditing) {
            // Редактирование существующего станка
            setMachineForm({
                id: machine.id,
                name: machine.name,
                status: machine.status,
                machineTypeId: machine.machineTypeId
            });

            if (machineDetails) {
                setDetailsForm({
                    id: machineDetails.id,
                    machineId: machineDetails.machineId,
                    serialNumber: machineDetails.serialNumber,
                    manufacturer: machineDetails.manufacturer || '',
                    purchaseDate: machineDetails.purchaseDate || '',
                    lastMaintenance: machineDetails.lastMaintenance || '',
                    nextMaintenance: machineDetails.nextMaintenance || '',
                    notes: machineDetails.notes || ''
                });
            } else {
                setDetailsForm({
                    serialNumber: '',
                    manufacturer: '',
                    purchaseDate: '',
                    lastMaintenance: '',
                    nextMaintenance: '',
                    notes: ''
                });
            }
        } else {
            // Создание нового станка
            setMachineForm({
                name: '',
                status: 'inactive',
                machineTypeId: machineTypes.length > 0 ? machineTypes[0].id : 0
            });

            setDetailsForm({
                serialNumber: '',
                manufacturer: '',
                purchaseDate: '',
                lastMaintenance: '',
                nextMaintenance: '',
                notes: ''
            });
        }
    }, [machine, machineDetails, machineTypes, isEditing, open]);

    // Обработчики изменения полей формы
    const handleMachineFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setMachineForm(prev => ({ ...prev, [name]: value }));
    };

    const handleStatusChange = (e: SelectChangeEvent<string>) => {
        setMachineForm(prev => ({ ...prev, status: e.target.value as 'active' | 'inactive' | 'maintenance' }));
    };

    const handleTypeChange = (e: SelectChangeEvent<number>) => {
        setMachineForm(prev => ({ ...prev, machineTypeId: e.target.value as number }));
    };

    const handleDetailsFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setDetailsForm(prev => ({ ...prev, [name]: value }));
    };

    // Обработчик сохранения
    const handleSave = () => {
        onSave(machineForm, detailsForm);
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
        >
            <DialogTitle className={styles.dialogTitle}>
                {isEditing ? 'Редактирование станка' : 'Добавление нового станка'}
            </DialogTitle>
            <DialogContent className={styles.dialogContent}>
                <Grid container spacing={2}>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Typography variant="subtitle1" gutterBottom className={styles.formSectionTitle}>
                            Основная информация
                        </Typography>

                        <TextField
                            autoFocus
                            margin="dense"
                            name="name"
                            label="Название станка"
                            type="text"
                            fullWidth
                            value={machineForm.name || ''}
                            onChange={handleMachineFormChange}
                            required
                            variant="outlined"
                            className={styles.formField}
                        />

                        <FormControl fullWidth variant="outlined" className={styles.formField}>
                            <InputLabel id="status-select-label">Статус</InputLabel>
                            <Select
                                labelId="status-select-label"
                                id="status-select"
                                value={machineForm.status || 'inactive'}
                                onChange={handleStatusChange}
                                label="Статус"
                                required
                            >
                                <MenuItem value="active">Активен</MenuItem>
                                <MenuItem value="maintenance">На обслуживании</MenuItem>
                                <MenuItem value="inactive">Неактивен</MenuItem>
                            </Select>
                        </FormControl>

                        <FormControl fullWidth variant="outlined" className={styles.formField}>
                            <InputLabel id="type-select-label">Тип станка</InputLabel>
                            <Select
                                labelId="type-select-label"
                                id="type-select"
                                value={machineForm.machineTypeId || ''}
                                onChange={handleTypeChange}
                                label="Тип станка"
                                required
                            >
                                {machineTypes.map(type => (
                                    <MenuItem key={type.id} value={type.id}>
                                        {type.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <Typography variant="subtitle1" gutterBottom className={styles.formSectionTitle}>
                            Технические данные
                        </Typography>

                        <TextField
                            margin="dense"
                            name="serialNumber"
                            label="Серийный номер"
                            type="text"
                            fullWidth
                            value={detailsForm.serialNumber || ''}
                            onChange={handleDetailsFormChange}
                            required
                            variant="outlined"
                            className={styles.formField}
                        />

                        <TextField
                            margin="dense"
                            name="manufacturer"
                            label="Производитель"
                            type="text"
                            fullWidth
                            value={detailsForm.manufacturer || ''}
                            onChange={handleDetailsFormChange}
                            variant="outlined"
                            className={styles.formField}
                        />

                        <TextField
                            margin="dense"
                            name="purchaseDate"
                            label="Дата приобретения"
                            type="date"
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                            value={detailsForm.purchaseDate || ''}
                            onChange={handleDetailsFormChange}
                            variant="outlined"
                            className={styles.formField}
                        />

                        <TextField
                            margin="dense"
                            name="lastMaintenance"
                            label="Дата последнего ТО"
                            type="date"
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                            value={detailsForm.lastMaintenance || ''}
                            onChange={handleDetailsFormChange}
                            variant="outlined"
                            className={styles.formField}
                        />

                        <TextField
                            margin="dense"
                            name="nextMaintenance"
                            label="Дата следующего ТО"
                            type="date"
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                            value={detailsForm.nextMaintenance || ''}
                            onChange={handleDetailsFormChange}
                            variant="outlined"
                            className={styles.formField}
                        />

                        <TextField
                            margin="dense"
                            name="notes"
                            label="Примечания"
                            multiline
                            rows={4}
                            fullWidth
                            value={detailsForm.notes || ''}
                            onChange={handleDetailsFormChange}
                            variant="outlined"
                            className={styles.formField}
                        />
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions className={styles.dialogActions}>
                <Button 
                    onClick={onClose} 
                    className={`${styles.dialogButton} ${styles.cancelButton}`}
                >
                    Отмена
                </Button>
                <Button 
                    onClick={handleSave} 
                    className={`${styles.dialogButton} ${styles.saveButton}`}
                    variant="contained"
                >
                    Сохранить
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default MachineForm;