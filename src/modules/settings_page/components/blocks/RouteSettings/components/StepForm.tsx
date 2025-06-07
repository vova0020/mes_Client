import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    InputAdornment
} from '@mui/material';
import { IProcessStep } from '../RouteSettings';
import styles from './StepForm.module.css';

interface StepFormProps {
    open: boolean;
    onClose: () => void;
    onSave: (stepData: Partial<IProcessStep>) => void;
    step?: IProcessStep | null;
    isEditing: boolean;
}

const StepForm: React.FC<StepFormProps> = ({
    open,
    onClose,
    onSave,
    step,
    isEditing
}) => {
    // Состояние для формы этапа
    const [stepForm, setStepForm] = useState<Partial<IProcessStep>>({
        name: '',
        sequence: 0,
        description: null
    });

    // Инициализация формы при открытии
    useEffect(() => {
        if (step && isEditing) {
            setStepForm({
                id: step.id,
                name: step.name,
                sequence: step.sequence,
                description: step.description
            });
        } else {
            setStepForm({
                name: '',
                sequence: 0,
                description: null
            });
        }
    }, [step, isEditing, open]);

    // Обработчик изменения текстовых полей
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setStepForm(prev => ({ ...prev, [name]: value }));
    };

    // Обработчик изменения числового поля
    const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(e.target.value);
        if (!isNaN(value) && value >= 0) {
            setStepForm(prev => ({ ...prev, sequence: value }));
        }
    };

    // Обработчик сохранения
    const handleSave = () => {
        onSave(stepForm);
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
        >
            <DialogTitle className={styles.dialogTitle}>
                {isEditing ? 'Редактирование этапа обработки' : 'Создание нового этапа обработки'}
            </DialogTitle>
            <DialogContent className={styles.dialogContent}>
                <TextField
                    autoFocus
                    margin="dense"
                    name="name"
                    label="Название этапа"
                    type="text"
                    fullWidth
                    value={stepForm.name || ''}
                    onChange={handleChange}
                    required
                    variant="outlined"
                    className={styles.formField}
                />
                
                <TextField
                    margin="dense"
                    name="sequence"
                    label="Порядковый номер"
                    type="number"
                    fullWidth
                    value={stepForm.sequence || 0}
                    onChange={handleNumberChange}
                    variant="outlined"
                    className={styles.formField}
                    InputProps={{
                        startAdornment: <InputAdornment position="start">#</InputAdornment>,
                    }}
                />
                
                <TextField
                    margin="dense"
                    name="description"
                    label="Описание этапа"
                    type="text"
                    fullWidth
                    multiline
                    rows={4}
                    value={stepForm.description || ''}
                    onChange={handleChange}
                    variant="outlined"
                    className={styles.formField}
                    placeholder="Введите описание этапа обработки..."
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
                    disabled={!stepForm.name}
                >
                    Сохранить
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default StepForm;