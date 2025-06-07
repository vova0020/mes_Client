import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button
} from '@mui/material';
import { IMachineType } from '../MachineSettings';
import styles from './MachineTypeForm.module.css';

interface MachineTypeFormProps {
    open: boolean;
    onClose: () => void;
    onSave: (typeData: Partial<IMachineType>) => void;
    machineType?: IMachineType;
    isEditing: boolean;
}

const MachineTypeForm: React.FC<MachineTypeFormProps> = ({
    open,
    onClose,
    onSave,
    machineType,
    isEditing
}) => {
    // Состояние для формы типа станка
    const [typeForm, setTypeForm] = useState<Partial<IMachineType>>({
        name: '',
        description: ''
    });

    // Инициализация формы при открытии
    useEffect(() => {
        if (machineType && isEditing) {
            setTypeForm({
                id: machineType.id,
                name: machineType.name,
                description: machineType.description || ''
            });
        } else {
            setTypeForm({
                name: '',
                description: ''
            });
        }
    }, [machineType, isEditing, open]);

    // Обработчик изменения поля формы
    const handleTypeFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setTypeForm(prev => ({ ...prev, [name]: value }));
    };

    // Обработчик сохранения
    const handleSave = () => {
        onSave(typeForm);
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
        >
            <DialogTitle className={styles.dialogTitle}>
                {isEditing ? 'Редактирование типа станка' : 'Создание нового типа станка'}
            </DialogTitle>
            <DialogContent className={styles.dialogContent}>
                <TextField
                    autoFocus
                    margin="dense"
                    name="name"
                    label="Название типа станка"
                    type="text"
                    fullWidth
                    value={typeForm.name || ''}
                    onChange={handleTypeFormChange}
                    required
                    variant="outlined"
                    className={styles.formField}
                />
                <TextField
                    margin="dense"
                    name="description"
                    label="Описание"
                    type="text"
                    fullWidth
                    multiline
                    rows={4}
                    value={typeForm.description || ''}
                    onChange={handleTypeFormChange}
                    variant="outlined"
                    className={styles.formField}
                />
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

export default MachineTypeForm;