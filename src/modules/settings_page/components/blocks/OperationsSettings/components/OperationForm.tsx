import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    FormControl,
    FormHelperText
} from '@mui/material';
import { IProcessStep } from '../OperationsSettings';
import styles from './OperationForm.module.css';

interface OperationFormProps {
    open: boolean;
    onClose: () => void;
    onSave: (operationData: Partial<IProcessStep>) => void;
    operation: IProcessStep | null;
    isEditing: boolean;
}

const OperationForm: React.FC<OperationFormProps> = ({
    open,
    onClose,
    onSave,
    operation,
    isEditing
}) => {
    // Состояния для полей формы
    const [name, setName] = useState('');
    const [sequence, setSequence] = useState<number>(0);
    const [description, setDescription] = useState('');

    // Состояния для ошибок валидации
    const [nameError, setNameError] = useState('');
    const [sequenceError, setSequenceError] = useState('');

    // При открытии диалога загружаем данные операции, если редактируем
    useEffect(() => {
        if (open) {
            if (isEditing && operation) {
                setName(operation.name);
                setSequence(operation.sequence);
                setDescription(operation.description || '');
            } else {
                setName('');
                setSequence(0);
                setDescription('');
            }
            // Сбрасываем ошибки
            setNameError('');
            setSequenceError('');
        }
    }, [open, isEditing, operation]);

    // Валидация формы
    const validateForm = (): boolean => {
        let isValid = true;

        if (!name.trim()) {
            setNameError('Название операции обязательно');
            isValid = false;
        } else {
            setNameError('');
        }

        if (sequence < 0) {
            setSequenceError('Порядковый номер должен быть положительным числом');
            isValid = false;
        } else {
            setSequenceError('');
        }

        return isValid;
    };

    // Обработчик отправки формы
    const handleSubmit = () => {
        if (validateForm()) {
            const operationData: Partial<IProcessStep> = {
                id: isEditing && operation ? operation.id : undefined,
                name,
                sequence,
                description: description.trim() || null
            };
            
            onSave(operationData);
        }
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            aria-labelledby="operation-form-dialog-title"
            fullWidth
            maxWidth="sm"
        >
            <DialogTitle id="operation-form-dialog-title">
                {isEditing ? 'Редактирование операции' : 'Создание новой операции'}
            </DialogTitle>
            <DialogContent>
                <FormControl fullWidth className={styles.formField} error={!!nameError}>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Название операции"
                        type="text"
                        fullWidth
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        error={!!nameError}
                        required
                    />
                    {nameError && <FormHelperText>{nameError}</FormHelperText>}
                </FormControl>

                <FormControl fullWidth className={styles.formField} error={!!sequenceError}>
                    <TextField
                        margin="dense"
                        label="Порядковый номер"
                        type="number"
                        fullWidth
                        value={sequence}
                        onChange={(e) => setSequence(Number(e.target.value))}
                        error={!!sequenceError}
                        inputProps={{ min: 0 }}
                    />
                    {sequenceError && <FormHelperText>{sequenceError}</FormHelperText>}
                </FormControl>

                <FormControl fullWidth className={styles.formField}>
                    <TextField
                        margin="dense"
                        label="Описание"
                        type="text"
                        fullWidth
                        multiline
                        rows={3}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                </FormControl>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} color="primary">
                    Отмена
                </Button>
                <Button onClick={handleSubmit} color="primary">
                    {isEditing ? 'Сохранить' : 'Создать'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default OperationForm;