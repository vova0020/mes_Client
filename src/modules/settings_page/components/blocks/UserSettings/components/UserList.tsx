import React from 'react';
import {
    Typography,
    Button,
    Divider,
    List,
    ListItem,
    ListItemText,
    ListItemAvatar,
    ListItemSecondaryAction,
    IconButton,
    Avatar,
    Chip,
    ListItemButton
} from '@mui/material';
import {
    PersonAdd,
    Edit,
    Delete,
    AdminPanelSettings,
    Engineering,
    Construction,
    Person
} from '@mui/icons-material';
import { IUser, IRole } from '../UserSettings';
import styles from './UserList.module.css';

interface UserListProps {
    users: IUser[];
    roles: IRole[];
    selectedUser: IUser | null;
    setSelectedUser: (user: IUser) => void;
    onEdit: (user: IUser) => void;
    onDelete: (id: number) => void;
    getRoleName: (roleId: number) => string;
}

const UserList: React.FC<UserListProps> = ({
    users,
    roles,
    selectedUser,
    setSelectedUser,
    onEdit,
    onDelete,
    getRoleName
}) => {
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

    return (
        <div className={styles.listContainer}>
            <div className={styles.listHeader}>
                <Typography variant="h6" component="h2">
                    Список пользователей
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<PersonAdd />}
                    onClick={() => onEdit(undefined as any)}
                    className={styles.addButton}
                >
                    Добавить пользователя
                </Button>
            </div>
            <Divider />
            {users.length === 0 ? (
                <Typography className={styles.emptyMessage}>
                    Пользователи не найдены. Создайте первого пользовате��я.
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
                                    onClick={() => onEdit(user)}
                                    size="small"
                                >
                                    <Edit />
                                </IconButton>
                                <IconButton
                                    edge="end"
                                    onClick={() => onDelete(user.id)}
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

export default UserList;