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
    Avatar
} from '@mui/material';
import {
    Add,
    Edit,
    Delete,
    AdminPanelSettings,
    Engineering,
    Construction,
    Person
} from '@mui/icons-material';
import { IRole, IUser } from '../UserSettings';
import styles from './RoleList.module.css';

interface RoleListProps {
    roles: IRole[];
    users: IUser[];
    onEdit: (role: IRole) => void;
    onDelete: (id: number) => void;
}

const RoleList: React.FC<RoleListProps> = ({
    roles,
    users,
    onEdit,
    onDelete
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
                    Управление ролями
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => onEdit(undefined as any)}
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
                                    onClick={() => onEdit(role)}
                                    size="small"
                                >
                                    <Edit />
                                </IconButton>
                                <IconButton
                                    edge="end"
                                    onClick={() => onDelete(role.id)}
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

export default RoleList;