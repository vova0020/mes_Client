
import React, { useState, useEffect } from 'react';
import {
    TextField,
    Button,
    Paper,
    Typography,
    Grid,
    Divider,
    List,
    ListItem,
    ListItemText,
    ListItemAvatar,
    ListItemSecondaryAction,
    IconButton,
    Tabs,
    Tab,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    SelectChangeEvent,
    Snackbar,
    Alert,
    Avatar,
    Chip,
    InputAdornment,
    ListItemButton
} from '@mui/material';
import {
    Add,
    Edit,
    Delete,
    Visibility,
    VisibilityOff,
    PersonAdd,
    AdminPanelSettings,
    Engineering,
    Construction,
    Person
} from '@mui/icons-material';
import styles from './UserSettings.module.css';

// Интерфейсы для данных (в реальном приложении получаются с бэкенда)
interface IRole {
    id: number;
    name: string;
}

interface IUserDetail {
    id: number;
    userId: number;
    fullName: string;
    phone: string | null;
    position: string | null;
    salary: number | null;
}

interface IUser {
    id: number;
    username: string;
    password: string;
    roleId: number;
    details: IUserDetail | null;
}

// Компонент настроек пользователей
const UserSettings: React.FC = () => {
    // Состояния для списков
    const [users, setUsers] = useState<IUser[]>([]);
    const [roles, setRoles] = useState<IRole[]>([]);
    const [userDetails, setUserDetails] = useState<IUserDetail[]>([]);

    // Состояние для активного таба
    const [activeTab, setActiveTab] = useState(0);

    // Состояния для выбранных элементов
    const [selectedUser, setSelectedUser] = useState<IUser | null>(null);

    // Состояния для форм
    const [userForm, setUserForm] = useState<Partial<IUser & { confirmPassword: string }>>({
        username: '',
        password: '',
        confirmPassword: '',
        roleId: 0
    });

    const [detailsForm, setDetailsForm] = useState<Partial<IUserDetail>>({
        fullName: '',
        phone: '',
        position: '',
        salary: null
    });

    const [roleForm, setRoleForm] = useState<Partial<IRole>>({
        name: ''
    });

    // Состояния для диалогов
    const [userDialogOpen, setUserDialogOpen] = useState(false);
    const [roleDialogOpen, setRoleDialogOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    // Состояние для отображения пароля
    const [showPassword, setShowPassword] = useState(false);

    // Состояние для уведомлений
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success' as 'success' | 'error' | 'info' | 'warning'
    });

    // Имитация загрузки данных с сервера
    useEffect(() => {
        // Здесь должен быть запрос к API для получения списка пользователей, ролей и деталей
        const mockRoles: IRole[] = [
            { id: 1, name: 'Администратор' },
            { id: 2, name: 'Оператор' },
            { id: 3, name: 'Мастер' }
        ];

        const mockUserDetails: IUserDetail[] = [
            { id: 1, userId: 1, fullName: 'Иванов Иван Иванович', phone: '+7(999)123-45-67', position: 'Главный администратор', salary: 150000 },
            { id: 2, userId: 2, fullName: 'Петров Петр Петрович', phone: '+7(999)234-56-78', position: 'Старший оператор', salary: 100000 },
            { id: 3, userId: 3, fullName: 'Сидоров Сидор Сидорович', phone: '+7(999)345-67-89', position: 'Мастер смены', salary: 120000 }
        ];

        const mockUsers: IUser[] = [
            { id: 1, username: 'admin', password: 'хэш_пароля_1', roleId: 1, details: mockUserDetails[0] },
            { id: 2, username: 'operator', password: 'хэш_пароля_2', roleId: 2, details: mockUserDetails[1] },
            { id: 3, username: 'master', password: 'хэш_пароля_3', roleId: 3, details: mockUserDetails[2] }
        ];

        setRoles(mockRoles);
        setUserDetails(mockUserDetails);
        setUsers(mockUsers);
    }, []);

    // Обработчики для формы пользователя
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

    const handleOpenUserDialog = (user?: IUser) => {
        if (user) {
            // Редактирование существующего пользователя
            setUserForm({
                id: user.id,
                username: user.username,
                password: '', // Пароль не загружаем для редактирования
                confirmPassword: '',
                roleId: user.roleId
            });

            const userDetail = userDetails.find(detail => detail.userId === user.id);
            if (userDetail) {
                setDetailsForm({
                    id: userDetail.id,
                    userId: userDetail.userId,
                    fullName: userDetail.fullName,
                    phone: userDetail.phone || '',
                    position: userDetail.position || '',
                    salary: userDetail.salary
                });
            } else {
                setDetailsForm({
                    fullName: '',
                    phone: '',
                    position: '',
                    salary: null
                });
            }

            setIsEditing(true);
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

            setIsEditing(false);
        }

        setUserDialogOpen(true);
    };

    const handleCloseUserDialog = () => {
        setUserDialogOpen(false);
        setUserForm({
            username: '',
            password: '',
            confirmPassword: '',
            roleId: 0
        });
        setDetailsForm({
            fullName: '',
            phone: '',
            position: '',
            salary: null
        });
        setShowPassword(false);
    };

    const handleSaveUser = () => {
        // Валидация формы
        if (!userForm.username) {
            setSnackbar({
                open: true,
                message: 'Имя пользователя обязательно',
                severity: 'error'
            });
            return;
        }

        if (!isEditing && !userForm.password) {
            setSnackbar({
                open: true,
                message: 'Пароль обязателен для нового пользователя',
                severity: 'error'
            });
            return;
        }

        if (!isEditing && userForm.password !== userForm.confirmPassword) {
            setSnackbar({
                open: true,
                message: 'Пароли не совпадают',
                severity: 'error'
            });
            return;
        }

        if (!detailsForm.fullName) {
            setSnackbar({
                open: true,
                message: 'ФИО обязательно',
                severity: 'error'
            });
            return;
        }

        if (!userForm.roleId) {
            setSnackbar({
                open: true,
                message: 'Необходимо выбрать роль',
                severity: 'error'
            });
            return;
        }

        // Проверка на уникальность имени пользователя
        const isDuplicate = users.some(u =>
            u.username === userForm.username &&
            (!isEditing || u.id !== userForm.id)
        );

        if (isDuplicate) {
            setSnackbar({
                open: true,
                message: 'Пользователь с таким именем уже существует',
                severity: 'error'
            });
            return;
        }

        // Имитация сохранения на сервер
        if (isEditing && userForm.id) {
            // Обновление существующего пользователя
            const updatedUser: IUser = {
                id: userForm.id,
                username: userForm.username!,
                password: userForm.password || users.find(u => u.id === userForm.id)!.password,
                roleId: userForm.roleId!,
                details: null // Будет обновлено ниже
            };

            setUsers(prev => prev.map(u =>
                u.id === updatedUser.id ? updatedUser : u
            ));

            // Обновление или создание деталей пользователя
            if (detailsForm.id) {
                // Обновление существующих деталей
                const updatedDetails: IUserDetail = {
                    id: detailsForm.id,
                    userId: userForm.id,
                    fullName: detailsForm.fullName!,
                    phone: detailsForm.phone || null,
                    position: detailsForm.position || null,
                    //@ts-ignore
                    salary: detailsForm.salary
                };

                setUserDetails(prev => prev.map(d =>
                    d.id === updatedDetails.id ? updatedDetails : d
                ));

                // Обновляем ссылку на детали в пользователе
                setUsers(prev => prev.map(u =>
                    u.id === userForm.id ? { ...u, details: updatedDetails } : u
                ));
            } else {
                // Создание новых деталей
                const newDetails: IUserDetail = {
                    id: Math.max(...userDetails.map(d => d.id), 0) + 1,
                    userId: userForm.id,
                    fullName: detailsForm.fullName!,
                    phone: detailsForm.phone || null,
                    position: detailsForm.position || null,
                     //@ts-ignore
                    salary: detailsForm.salary
                };

                setUserDetails(prev => [...prev, newDetails]);

                // Обновляем ссылку на детали в пользователе
                setUsers(prev => prev.map(u =>
                    u.id === userForm.id ? { ...u, details: newDetails } : u
                ));
            }

            setSnackbar({
                open: true,
                message: 'Пользователь успешно обновлен',
                severity: 'success'
            });
        } else {
            // Создание нового пользователя
            const newUserId = Math.max(...users.map(u => u.id), 0) + 1;

            // Создание деталей пользователя
            const newDetails: IUserDetail = {
                id: Math.max(...userDetails.map(d => d.id), 0) + 1,
                userId: newUserId,
                fullName: detailsForm.fullName!,
                phone: detailsForm.phone || null,
                position: detailsForm.position || null,
                 //@ts-ignore
                salary: detailsForm.salary
            };

            setUserDetails(prev => [...prev, newDetails]);

            // Создание пользователя
            const newUser: IUser = {
                id: newUserId,
                username: userForm.username!,
                password: userForm.password!, // В реальном приложении здесь был бы хэш пароля
                roleId: userForm.roleId!,
                details: newDetails
            };

            setUsers(prev => [...prev, newUser]);

            setSnackbar({
                open: true,
                message: 'Пользователь успешно создан',
                severity: 'success'
            });
        }

        handleCloseUserDialog();
    };

    const handleDeleteUser = (id: number) => {
        // Имитация удаления на сервере
        // Сначала удаляем детали пользователя
        setUserDetails(prev => prev.filter(d => d.userId !== id));

        // Затем удаляем самого пользователя
        setUsers(prev => prev.filter(u => u.id !== id));

        setSnackbar({
            open: true,
            message: 'Пользователь успешно удален',
            severity: 'success'
        });

        // Если был выбран этот пользователь, снимаем выбор
        if (selectedUser?.id === id) {
            setSelectedUser(null);
        }
    };

    // Обработчики для формы роли
    const handleRoleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setRoleForm(prev => ({ ...prev, [name]: value }));
    };

    const handleOpenRoleDialog = (role?: IRole) => {
        if (role) {
            setRoleForm({
                id: role.id,
                name: role.name
            });
            setIsEditing(true);
        } else {
            setRoleForm({
                name: ''
            });
            setIsEditing(false);
        }
        setRoleDialogOpen(true);
    };

    const handleCloseRoleDialog = () => {
        setRoleDialogOpen(false);
        setRoleForm({
            name: ''
        });
    };

    const handleSaveRole = () => {
        if (!roleForm.name) {
            setSnackbar({
                open: true,
                message: 'Название роли обязательно',
                severity: 'error'
            });
            return;
        }

        // Проверка на уникальность названия роли
        const isDuplicate = roles.some(r =>
            r.name === roleForm.name &&
            (!isEditing || r.id !== roleForm.id)
        );

        if (isDuplicate) {
            setSnackbar({
                open: true,
                message: 'Роль с таким названием уже существует',
                severity: 'error'
            });
            return;
        }

        // Имитация сохранения на сервер
        if (isEditing && roleForm.id) {
            // Обновление существующей роли
            setRoles(prev => prev.map(r =>
                r.id === roleForm.id
                    ? { ...r, ...roleForm } as IRole
                    : r
            ));
            setSnackbar({
                open: true,
                message: 'Роль успешно обновлена',
                severity: 'success'
            });
        } else {
            // Создание новой роли
            const newRole: IRole = {
                id: Math.max(...roles.map(r => r.id), 0) + 1,
                name: roleForm.name
            };
            setRoles(prev => [...prev, newRole]);
            setSnackbar({
                open: true,
                message: 'Роль успешно создана',
                severity: 'success'
            });
        }

        handleCloseRoleDialog();
    };

    const handleDeleteRole = (id: number) => {
        // Проверка на наличие пользователей с этой ролью
        const hasRoleUsers = users.some(user => user.roleId === id);
        if (hasRoleUsers) {
            setSnackbar({
                open: true,
                message: 'Невозможно удалить роль, назначенную пользователям',
                severity: 'error'
            });
            return;
        }

        // Имитация удаления на сервере
        setRoles(prev => prev.filter(r => r.id !== id));
        setSnackbar({
            open: true,
            message: 'Роль успешно удалена',
            severity: 'success'
        });
    };

    // Обработчик для закрытия уведомления
    const handleCloseSnackbar = () => {
        setSnackbar(prev => ({ ...prev, open: false }));
    };

    // Получаем имя роли по ID
    const getRoleName = (roleId: number) => {
        const role = roles.find(r => r.id === roleId);
        return role ? role.name : 'Неизвестная роль';
    };

    // Получаем иконку для роли
    const getRoleIcon = (roleName: string) => {
        switch (roleName.toLowerCase()) {
            case 'администратор':
                return <AdminPanelSettings />;
            case 'оператор':
                return <Engineering />;
            case 'мастер':
                return <Construction />;
            default:
                return <Person />;
        }
    };

    // Рендер списка пользователей
    const renderUserList = () => {
        return (
            <div className={styles.listContainer}>
                <div className={styles.listHeader}>
                    <Typography variant="h6" component="h2">
                        Список пользователей
                    </Typography>
                    <Button
                        variant="contained"
                        startIcon={<PersonAdd />}
                        onClick={() => handleOpenUserDialog()}
                        className={styles.addButton}
                    >
                        Добавить пользователя
                    </Button>
                </div>
                <Divider />
                {users.length === 0 ? (
                    <Typography className={styles.emptyMessage}>
                        Пользователи не найдены. Создайте первого пользователя.
                    </Typography>
                ) : (
                    <List>
                        {users.map((user, index) => (
                            <ListItem 
                                key={user.id} 
                                className={styles.userItem}
                                style={{ animationDelay: `${index * 0.05}s` }}
                            >
                                <ListItemButton
                                    selected={selectedUser?.id === user.id}
                                    onClick={() => setSelectedUser(user)}
                                >
                                    <ListItemAvatar>
                                        <Avatar className={styles.avatar}>
                                            {getRoleIcon(getRoleName(user.roleId))}
                                        </Avatar>
                                    </ListItemAvatar>
                                    <ListItemText
                                        primary={user.username}
                                        secondary={
                                            <>
                                                <Chip
                                                    label={getRoleName(user.roleId)}
                                                    size="small"
                                                    className={styles.roleChip}
                                                />
                                                {user.details && (
                                                    <span className={styles.secondaryText}>
                                                        {user.details.fullName}
                                                    </span>
                                                )}
                                            </>
                                        }
                                    />
                                </ListItemButton>

                                <ListItemSecondaryAction>
                                    <IconButton
                                        edge="end"
                                        onClick={() => handleOpenUserDialog(user)}
                                        size="small"
                                    >
                                        <Edit />
                                    </IconButton>
                                    <IconButton
                                        edge="end"
                                        onClick={() => handleDeleteUser(user.id)}
                                        size="small"
                                        className={styles.deleteButton}
                                    >
                                        <Delete />
                                    </IconButton>
                                </ListItemSecondaryAction>
                            </ListItem>

                        ))}
                    </List>
                )}
            </div>
        );
    };

    // Рендер детальной информации о выбранном пользователе
    const renderUserDetails = () => {
        if (!selectedUser) {
            return (
                <Typography className={styles.selectPrompt}>
                    Выберите пользователя для просмотра деталей
                </Typography>
            );
        }

        const userDetail = userDetails.find(detail => detail.userId === selectedUser.id);

        return (
            <div className={styles.userDetailsContainer}>
                <Typography variant="h6" component="h2" className={styles.detailsTitle}>
                    Информация о пользователе
                </Typography>
                <Divider className={styles.divider} />

                <div className={styles.userInfo}>
                    <div className={styles.userInfoHeader}>
                        <Avatar className={styles.largeAvatar}>
                            {getRoleIcon(getRoleName(selectedUser.roleId))}
                        </Avatar>
                        <div className={styles.userMainInfo}>
                            <Typography variant="h5">{selectedUser.username}</Typography>
                            <Chip
                                label={getRoleName(selectedUser.roleId)}
                                className={styles.roleChipLarge}
                            />
                        </div>
                    </div>

                    {userDetail ? (
                        <div className={styles.userDetailInfo}>
                            <div className={styles.detailRow}>
                                <Typography variant="subtitle2">ФИО:</Typography>
                                <Typography>{userDetail.fullName}</Typography>
                            </div>

                            {userDetail.position && (
                                <div className={styles.detailRow}>
                                    <Typography variant="subtitle2">Должность:</Typography>
                                    <Typography>{userDetail.position}</Typography>
                                </div>
                            )}

                            {userDetail.phone && (
                                <div className={styles.detailRow}>
                                    <Typography variant="subtitle2">Телефон:</Typography>
                                    <Typography>{userDetail.phone}</Typography>
                                </div>
                            )}

                            {userDetail.salary !== null && (
                                <div className={styles.detailRow}>
                                    <Typography variant="subtitle2">Оклад:</Typography>
                                    <Typography>{userDetail.salary.toLocaleString()} руб.</Typography>
                                </div>
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

    // Рендер списка ролей
    const renderRoleList = () => {
        return (
            <div className={styles.listContainer}>
                <div className={styles.listHeader}>
                    <Typography variant="h6" component="h2">
                        Управление ролями
                    </Typography>
                    <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={() => handleOpenRoleDialog()}
                        className={styles.addButton}
                    >
                        Добавить роль
                    </Button>
                </div>
                <Divider />
                {roles.length === 0 ? (
                    <Typography className={styles.emptyMessage}>
                        Роли не найдены. Создайте первую роль.
                    </Typography>
                ) : (
                    <List>
                        {roles.map((role, index) => (
                            <ListItem 
                                key={role.id} 
                                className={styles.roleItem}
                                style={{ animationDelay: `${index * 0.05}s` }}
                            >
                                <ListItemAvatar>
                                    <Avatar className={styles.avatar}>
                                        {getRoleIcon(role.name)}
                                    </Avatar>
                                </ListItemAvatar>
                                <ListItemText
                                    primary={role.name}
                                    secondary={
                                        <span className={styles.secondaryText}>
                                            Пользователей с ролью: {users.filter(u => u.roleId === role.id).length}
                                        </span>
                                    }
                                />
                                <ListItemSecondaryAction>
                                    <IconButton
                                        edge="end"
                                        onClick={() => handleOpenRoleDialog(role)}
                                        size="small"
                                    >
                                        <Edit />
                                    </IconButton>
                                    <IconButton
                                        edge="end"
                                        onClick={() => handleDeleteRole(role.id)}
                                        size="small"
                                        className={styles.deleteButton}
                                    >
                                        <Delete />
                                    </IconButton>
                                </ListItemSecondaryAction>
                            </ListItem>
                        ))}
                    </List>
                )}
            </div>
        );
    };

    return (
        <div className={styles.userSettings}>
            <Typography variant="h5" component="h1" className={styles.mainTitle}>
                Управление пользователями
            </Typography>

            <Tabs
                value={activeTab}
                onChange={(_, newValue) => setActiveTab(newValue)}
                className={styles.tabs}
            >
                <Tab label="Пользователи" />
                <Tab label="Роли" />
            </Tabs>

            {activeTab === 0 ? (
                <div className={styles.userManagement}>

                    <Grid spacing={2}>
                        <Grid size={{ xs: 12, md: 5 }}>
                            {/* Список буферов */}
                            <Paper className={styles.paper}>
                                {renderUserList()}
                            </Paper>
                        </Grid>

                        <Grid size={{ xs: 12, md: 7 }}>
                            {/* Список ячеек */}
                            <Paper className={styles.paper}>
                                {renderUserDetails()}
                            </Paper>
                        </Grid>
                    </Grid>
                </div>
            ) : (
                <div className={styles.roleManagement}>
                    <Paper className={styles.paper}>
                        {renderRoleList()}
                    </Paper>
                </div>
            )}

            {/* Диалог для создания/редактирования пользователя */}
            <Dialog
                open={userDialogOpen}
                onClose={handleCloseUserDialog}
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
                        onClick={handleCloseUserDialog} 
                        className={`${styles.dialogButton} ${styles.cancelButton}`}
                    >
                        Отмена
                    </Button>
                    <Button 
                        onClick={handleSaveUser} 
                        className={`${styles.dialogButton} ${styles.saveButton}`}
                        variant="contained"
                    >
                        Сохранить
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Диалог для создания/редактирования роли */}
            <Dialog
                open={roleDialogOpen}
                onClose={handleCloseRoleDialog}
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
                        onClick={handleCloseRoleDialog} 
                        className={`${styles.dialogButton} ${styles.cancelButton}`}
                    >
                        Отмена
                    </Button>
                    <Button 
                        onClick={handleSaveRole} 
                        className={`${styles.dialogButton} ${styles.saveButton}`}
                        variant="contained"
                    >
                        Сохранить
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Уведомления */}
            {snackbar.open && (
                <div 
                    className={snackbar.severity === 'success' ? styles.successNotification : styles.errorNotification}
                >
                    <span>{snackbar.message}</span>
                </div>
            )}
        </div>
    );
};

export default UserSettings;
