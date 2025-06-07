import React, { useState, useEffect } from 'react';
import {
    Typography,
    Tabs,
    Tab,
    Paper,
    Grid
} from '@mui/material';
import styles from './UserSettings.module.css';

// Компоненты
import UserList from './components/UserList';
import UserDetails from './components/UserDetails';
import RoleList from './components/RoleList';
import UserForm from './components/UserForm';
import RoleForm from './components/RoleForm';
import Notification, { NotificationSeverity } from './components/common/Notification';

// Интерфейсы для данных (в реальном приложении получаются с бэкенда)
export interface IRole {
    id: number;
    name: string;
}

export interface IUserDetail {
    id: number;
    userId: number;
    fullName: string;
    phone: string | null;
    position: string | null;
    salary: number | null;
}

export interface IUser {
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

    // Состояния для диалогов
    const [userDialogOpen, setUserDialogOpen] = useState(false);
    const [roleDialogOpen, setRoleDialogOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    // Состояние для уведомлений
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success' as NotificationSeverity
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

    // Обработчик для з��крытия уведомления
    const handleCloseSnackbar = () => {
        setSnackbar(prev => ({ ...prev, open: false }));
    };

    // Получаем имя роли по ID
    const getRoleName = (roleId: number) => {
        const role = roles.find(r => r.id === roleId);
        return role ? role.name : 'Неизвестная роль';
    };

    // Обработчики для пользователей
    const handleOpenUserDialog = (user?: IUser) => {
        if (user) {
            setIsEditing(true);
        } else {
            setIsEditing(false);
        }
        setUserDialogOpen(true);
    };

    const handleCloseUserDialog = () => {
        setUserDialogOpen(false);
    };

    const handleSaveUser = (userData: Partial<IUser>, detailsData: Partial<IUserDetail>) => {
        // Валидация формы
        if (!userData.username) {
            setSnackbar({
                open: true,
                message: 'Имя пользователя обязательно',
                severity: 'error'
            });
            return;
        }

        if (!isEditing && !userData.password) {
            setSnackbar({
                open: true,
                message: 'Пароль обязателен для нового пользователя',
                severity: 'error'
            });
            return;
        }

        if (!detailsData.fullName) {
            setSnackbar({
                open: true,
                message: 'ФИО обязательно',
                severity: 'error'
            });
            return;
        }

        if (!userData.roleId) {
            setSnackbar({
                open: true,
                message: 'Необходимо выбрать роль',
                severity: 'error'
            });
            return;
        }

        // Проверка на уникальность имени пользователя
        const isDuplicate = users.some(u =>
            u.username === userData.username &&
            (!isEditing || u.id !== userData.id)
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
        if (isEditing && userData.id) {
            // Обновление существующего пользователя
            const updatedUser: IUser = {
                id: userData.id,
                username: userData.username!,
                password: userData.password || users.find(u => u.id === userData.id)!.password,
                roleId: userData.roleId!,
                details: null // Будет обновлено ниже
            };

            setUsers(prev => prev.map(u =>
                u.id === updatedUser.id ? updatedUser : u
            ));

            // Обновление или создание деталей пользователя
            if (detailsData.id) {
                // Обновление существующих деталей
                const updatedDetails: IUserDetail = {
                    id: detailsData.id,
                    userId: userData.id,
                    fullName: detailsData.fullName!,
                    phone: detailsData.phone || null,
                    position: detailsData.position || null,
                    salary: detailsData.salary || null  
                };

                setUserDetails(prev => prev.map(d =>
                    d.id === updatedDetails.id ? updatedDetails : d
                ));

                // Обновляем ссылку на детали в пользователе
                setUsers(prev => prev.map(u =>
                    u.id === userData.id ? { ...u, details: updatedDetails } : u
                ));
            } else {
                // Создание новых деталей
                const newDetails: IUserDetail = {
                    id: Math.max(...userDetails.map(d => d.id), 0) + 1,
                    userId: userData.id,
                    fullName: detailsData.fullName!,
                    phone: detailsData.phone || null,
                    position: detailsData.position || null,
                    salary: detailsData.salary || null 
                };

                setUserDetails(prev => [...prev, newDetails]);

                // Обновляем ссылку на детали в пользователе
                setUsers(prev => prev.map(u =>
                    u.id === userData.id ? { ...u, details: newDetails } : u
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
                fullName: detailsData.fullName!,
                phone: detailsData.phone || null,
                position: detailsData.position || null,
                salary: detailsData.salary || null 
            };

            setUserDetails(prev => [...prev, newDetails]);

            // Создание пользователя
            const newUser: IUser = {
                id: newUserId,
                username: userData.username!,
                password: userData.password!, // В реальном приложении здесь был бы хэш пароля
                roleId: userData.roleId!,
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

    // Обработчики для ролей
    const handleOpenRoleDialog = (role?: IRole) => {
        if (role) {
            setIsEditing(true);
        } else {
            setIsEditing(false);
        }
        setRoleDialogOpen(true);
    };

    const handleCloseRoleDialog = () => {
        setRoleDialogOpen(false);
    };

    const handleSaveRole = (roleData: Partial<IRole>) => {
        if (!roleData.name) {
            setSnackbar({
                open: true,
                message: 'Название роли обязательно',
                severity: 'error'
            });
            return;
        }

        // Проверка на уникальность названия роли
        const isDuplicate = roles.some(r =>
            r.name === roleData.name &&
            (!isEditing || r.id !== roleData.id)
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
        if (isEditing && roleData.id) {
            // Обновление существующей роли
            setRoles(prev => prev.map(r =>
                r.id === roleData.id
                    ? { ...r, ...roleData } as IRole
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
                name: roleData.name
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
                            <Paper className={styles.paper}>
                                <UserList 
                                    users={users}
                                    roles={roles}
                                    selectedUser={selectedUser}
                                    setSelectedUser={setSelectedUser}
                                    onEdit={handleOpenUserDialog}
                                    onDelete={handleDeleteUser}
                                    getRoleName={getRoleName}
                                />
                            </Paper>
                        </Grid>

                        <Grid size={{ xs: 12, md: 7 }}>
                            <Paper className={styles.paper}>
                                <UserDetails 
                                    selectedUser={selectedUser}
                                    userDetails={userDetails}
                                    getRoleName={getRoleName}
                                />
                            </Paper>
                        </Grid>
                    </Grid>
                </div>
            ) : (
                <div className={styles.roleManagement}>
                    <Paper className={styles.paper}>
                        <RoleList 
                            roles={roles}
                            users={users}
                            onEdit={handleOpenRoleDialog}
                            onDelete={handleDeleteRole}
                        />
                    </Paper>
                </div>
            )}

            {/* Диалог для создания/редактирования пользователя */}
            <UserForm 
                open={userDialogOpen}
                onClose={handleCloseUserDialog}
                onSave={handleSaveUser}
                user={isEditing ? users.find(u => u.id === selectedUser?.id) : undefined}
                userDetails={userDetails.find(d => d.userId === selectedUser?.id)}
                roles={roles}
                isEditing={isEditing}
            />

            {/* Диалог для создания/редактирования роли */}
            <RoleForm 
                open={roleDialogOpen}
                onClose={handleCloseRoleDialog}
                onSave={handleSaveRole}
                role={isEditing ? roles.find(r => r.id === selectedUser?.roleId) : undefined}
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

export default UserSettings;