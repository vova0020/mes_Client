import React from 'react';
import {
    Typography,
    Avatar,
    Chip,
    Divider
} from '@mui/material';
import {
    AdminPanelSettings,
    Engineering,
    Construction,
    Person
} from '@mui/icons-material';
import { IUser, IUserDetail } from '../UserSettings';
import styles from './UserDetails.module.css';

interface UserDetailsProps {
    selectedUser: IUser | null;
    userDetails: IUserDetail[];
    getRoleName: (roleId: number) => string;
}

const UserDetails: React.FC<UserDetailsProps> = ({
    selectedUser,
    userDetails,
    getRoleName
}) => {
    if (!selectedUser) {
        return (
            <Typography className={styles.selectPrompt}>
                Выберите пользователя для просмотра деталей
            </Typography>
        );
    }

    // Получаем иконку для роли
    const getRoleIcon = (roleName: string) => {
        switch (roleName.toLowerCase()) {
            case 'администр��тор':
                return <AdminPanelSettings />;
            case 'оператор':
                return <Engineering />;
            case 'мастер':
                return <Construction />;
            default:
                return <Person />;
        }
    };

    const userDetail = userDetails.find(detail => detail.userId === selectedUser.id);
    const roleName = getRoleName(selectedUser.roleId);

    return (
        <div className={styles.userDetailsContainer}>
            <Typography variant="h6" component="h2" className={styles.detailsTitle}>
                Информация о пользователе
            </Typography>
            <Divider className={styles.divider} />

            <div className={styles.userInfo}>
                <div className={styles.userInfoHeader}>
                    <Avatar className={styles.largeAvatar}>
                        {getRoleIcon(roleName)}
                    </Avatar>
                    <div className={styles.userMainInfo}>
                        <Typography variant="h5">{selectedUser.username}</Typography>
                        <Chip
                            label={roleName}
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

export default UserDetails;