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
    InputAdornment,
    IconButton,
    SelectChangeEvent
} from '@mui/material';
import {
    Visibility,
    VisibilityOff
} from '@mui/icons-material';
import { IUser, IUserDetail, IRole } from '../UserSettings';
import styles from './UserForm.module.css';

interface UserFormProps {
    open: boolean;
    onClose: () => void;
    onSave: (userData: Partial<IUser>, detailsData: Partial<IUserDetail>) => void;
    user?: IUser;
    userDetails?: IUserDetail;
    roles: IRole[];
    isEditing: boolean;
}

const UserForm: React.FC<UserFormProps> = ({
    open,
    onClose,
    onSave,
    user,
    userDetails,
    roles,
    isEditing
}) => {
    // Состояние для формы пользователя
    const [userForm, setUserForm] = useState<Partial<IUser & { confirmPassword: string }>>({
        username: '',
        password: '',
        confirmPassword: '',
        roleId: 0
    });

    // Состояние для формы деталей пользователя
    const [detailsForm, setDetailsForm] = useState<Partial<IUserDetail>>({
        fullName: '',
        phone: '',
        position: '',
        salary: null
    });

    // Состояние для отображения пароля
    const [showPassword, setShowPassword] = useState(false);

    // Инициализация формы при открытии
    useEffect(() => {
        if (user && isEditing) {
            // Редактирование существующего пользователя
            setUserForm({
                id: user.id,
                username: user.username,
                password: '', // Пароль не загружаем для редактирования
                confirmPassword: '',
                roleId: user.roleId
            });

            if (userDetails) {
                setDetailsForm({
                    id: userDetails.id,
                    userId: userDetails.userId,
                    fullName: userDetails.fullName,
                    phone: userDetails.phone || '',
                    position: userDetails.position || '',
                    salary: userDetails.salary
                });
            } else {
                setDetailsForm({
                    fullName: '',
                    phone: '',
                    position: '',
                    salary: null
                });
            }
        } else {
            // Создание нового пользователя
            setUserForm({
                username: '',
                password: '',
                confirmPassword: '',
                roleId: roles.length > 0 ? roles[0].id : 0
            });

            setDetailsForm({
                fullName: '',
                phone: '',
                position: '',
                salary: null
            });
        }
    }, [user, userDetails, roles, isEditing, open]);

    // Обработчики изменения полей формы
    const handleUserFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setUserForm(prev => ({ ...prev, [name]: value }));
    };

    const handleRoleChange = (e: SelectChangeEvent<number>) => {
        setUserForm(prev => ({ ...prev, roleId: e.target.value as number }));
    };

    const handleDetailsFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setDetailsForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSalaryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value === '' ? null : parseFloat(e.target.value);
        setDetailsForm(prev => ({ ...prev, salary: value }));
    };

    // Обработчик сохранения
    const handleSave = () => {
        onSave(userForm, detailsForm);
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
        >
            <DialogTitle className={styles.dialogTitle}>
                {isEditing ? 'Редактирование пользователя' : 'Создание нового пользователя'}
            </DialogTitle>
            <DialogContent className={styles.dialogContent}>
                <Grid container spacing={2}>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Typography variant="subtitle1" gutterBottom className={styles.formSectionTitle}>
                            Учетные данные
                        </Typography>

                        <TextField
                            autoFocus
                            margin="dense"
                            name="username"
                            label="Имя пользователя"
                            type="text"
                            fullWidth
                            value={userForm.username || ''}
                            onChange={handleUserFormChange}
                            required
                            variant="outlined"
                            className={styles.formField}
                        />

                        <TextField
                            margin="dense"
                            name="password"
                            label={isEditing ? "Новый пароль (оставьте пустым, чтобы не менять)" : "Пароль"}
                            type={showPassword ? "text" : "password"}
                            fullWidth
                            value={userForm.password || ''}
                            onChange={handleUserFormChange}
                            required={!isEditing}
                            variant="outlined"
                            className={styles.formField}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            onClick={() => setShowPassword(!showPassword)}
                                            edge="end"
                                        >
                                            {showPassword ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                )
                            }}
                        />

                        <TextField
                            margin="dense"
                            name="confirmPassword"
                            label="Подтвердите пароль"
                            type={showPassword ? "text" : "password"}
                            fullWidth
                            value={userForm.confirmPassword || ''}
                            onChange={handleUserFormChange}
                            required={!isEditing}
                            variant="outlined"
                            className={styles.formField}
                            error={userForm.password !== userForm.confirmPassword && userForm.confirmPassword !== ''}
                            helperText={userForm.password !== userForm.confirmPassword && userForm.confirmPassword !== '' ? "Пароли не совпадают" : ""}
                        />

                        <FormControl fullWidth variant="outlined" className={styles.formField}>
                            <InputLabel id="role-select-label">Роль</InputLabel>
                            <Select
                                labelId="role-select-label"
                                id="role-select"
                                value={userForm.roleId || ''}
                                onChange={handleRoleChange}
                                label="Роль"
                                required
                            >
                                {roles.map(role => (
                                    <MenuItem key={role.id} value={role.id}>
                                        {role.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }} >
                        <Typography variant="subtitle1" gutterBottom className={styles.formSectionTitle}>
                            Персональные данные
                        </Typography>

                        <TextField
                            margin="dense"
                            name="fullName"
                            label="ФИО"
                            type="text"
                            fullWidth
                            value={detailsForm.fullName || ''}
                            onChange={handleDetailsFormChange}
                            required
                            variant="outlined"
                            className={styles.formField}
                        />

                        <TextField
                            margin="dense"
                            name="position"
                            label="Должность"
                            type="text"
                            fullWidth
                            value={detailsForm.position || ''}
                            onChange={handleDetailsFormChange}
                            variant="outlined"
                            className={styles.formField}
                        />

                        <TextField
                            margin="dense"
                            name="phone"
                            label="Телефон"
                            type="text"
                            fullWidth
                            value={detailsForm.phone || ''}
                            onChange={handleDetailsFormChange}
                            variant="outlined"
                            className={styles.formField}
                        />

                        <TextField
                            margin="dense"
                            name="salary"
                            label="Оклад (руб.)"
                            type="number"
                            fullWidth
                            value={detailsForm.salary === null ? '' : detailsForm.salary}
                            onChange={handleSalaryChange}
                            variant="outlined"
                            className={styles.formField}
                            InputProps={{
                                inputProps: { min: 0 }
                            }}
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

export default UserForm;