import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    FormHelperText
} from '@mui/material';
import { IProcessStep } from '../OperationsSettings';
import styles from './RelationForm.module.css';

interface RelationFormProps {
    open: boolean;
    onClose: () => void;
    onSave: (parentId: number, childId: number) => void;
    operations: IProcessStep[];
}

const RelationForm: React.FC<RelationFormProps> = ({
    open,
    onClose,
    onSave,
    operations
}) => {
    // Состояния для выбранных операций
    const [parentId, setParentId] = useState<number>(0);
    const [childId, setChildId] = useState<number>(0);

    // Состояния для ошибок валидации
    const [parentError, setParentError] = useState('');
    const [childError, setChildError] = useState('');
    const [generalError, setGeneralError] = useState('');

    // При открытии диалога сбрасываем форму
    useEffect(() => {
        if (open) {
            setParentId(0);
            setChildId(0);
            setParentError('');
            setChildError('');
            setGeneralError('');
        }
    }, [open]);

    // Сортировка операций по порядковому номеру
    const sortedOperations = [...operations].sort((a, b) => a.sequence - b.sequence);

    // Валидация формы
    const validateForm = (): boolean => {
        let isValid = true;

        if (!parentId) {
            setParentError('Выберите предшествующую операцию');
            isValid = false;
        } else {
            setParentError('');
        }

        if (!childId) {
            setChildError('Выберите последующую операцию');
            isValid = false;
        } else {
            setChildError('');
        }

        if (parentId && childId && parentId === childId) {
            setGeneralError('Предшествующая и последующая операции должны различаться');
            isValid = false;
        } else {
            setGeneralError('');
        }

        return isValid;
    };

    // Обработчик отправки формы
    const handleSubmit = () => {
        if (validateForm()) {
            onSave(parentId, childId);
        }
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            aria-labelledby="relation-form-dialog-title"
            fullWidth
            maxWidth="sm"
        >
            <DialogTitle id="relation-form-dialog-title">
                Добавление связи между операциями
            </DialogTitle>
            <DialogContent>
                {generalError && (
                    <FormHelperText error style={{ marginBottom: '16px', fontSize: '14px' }}>
                        {generalError}
                    </FormHelperText>
                )}

                <FormControl fullWidth className={styles.formField} error={!!parentError}>
                    <InputLabel id="parent-operation-label">Предшествующая операция</InputLabel>
                    <Select
                        labelId="parent-operation-label"
                        value={parentId}
                        onChange={(e) => setParentId(Number(e.target.value))}
                        label="Предшествующая операция"
                    >
                        <MenuItem value={0} disabled>Выберите операцию</MenuItem>
                        {sortedOperations.map(operation => (
                            <MenuItem key={operation.id} value={operation.id}>
                                {operation.name} (№{operation.sequence})
                            </MenuItem>
                        ))}
                    </Select>
                    {parentError && <FormHelperText>{parentError}</FormHelperText>}
                </FormControl>

                <FormControl fullWidth className={styles.formField} error={!!childError}>
                    <InputLabel id="child-operation-label">Последующая операция</InputLabel>
                    <Select
                        labelId="child-operation-label"
                        value={childId}
                        onChange={(e) => setChildId(Number(e.target.value))}
                        label="Последующая операция"
                    >
                        <MenuItem value={0} disabled>Выберите операцию</MenuItem>
                        {sortedOperations.map(operation => (
                            <MenuItem 
                                key={operation.id} 
                                value={operation.id} 
                                disabled={operation.id === parentId}
                            >
                                {operation.name} (№{operation.sequence})
                            </MenuItem>
                        ))}
                    </Select>
                    {childError && <FormHelperText>{childError}</FormHelperText>}
                </FormControl>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} color="primary">
                    Отмена
                </Button>
                <Button onClick={handleSubmit} color="primary">
                    Сохранить
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default RelationForm;