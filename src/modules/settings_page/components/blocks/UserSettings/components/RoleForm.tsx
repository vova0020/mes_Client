import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button
} from '@mui/material';
import { IRole } from '../UserSettings';
import styles from './RoleForm.module.css';

interface RoleFormProps {
    open: boolean;
    onClose: () => void;
    onSave: (roleData: Partial<IRole>) => void;
    role?: IRole;
    isEditing: boolean;
}

const RoleForm: React.FC<RoleFormProps> = ({
    open,
    onClose,
    onSave,
    role,
    isEditing
}) => {
    // Состояние для формы роли
    const [roleForm, setRoleForm] = useState<Partial<IRole>>({
        name: ''
    });

    // Инициализация формы при открытии
    useEffect(() => {
        if (role && isEditing) {
            setRoleForm({
                id: role.id,
                name: role.name
            });
        } else {
            setRoleForm({
                name: ''
            });
        }
    }, [role, isEditing, open]);

    // Обработчик изменения поля формы
    const handleRoleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setRoleForm(prev => ({ ...prev, [name]: value }));
    };

    // Обработчик сохранения
    const handleSave = () => {
        onSave(roleForm);
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
        >
            <DialogTitle className={styles.dialogTitle}>
                {isEditing ? 'Редактирование роли' : 'Создание новой роли'}
            </DialogTitle>
            <DialogContent className={styles.dialogContent}>
                <TextField
                    autoFocus
                    margin="dense"
                    name="name"
                    label="Название роли"
                    type="text"
                    fullWidth
                    value={roleForm.name || ''}
                    onChange={handleRoleFormChange}
                    required
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

export default RoleForm;