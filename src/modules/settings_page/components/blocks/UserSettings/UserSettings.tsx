
import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SocketProvider } from '../../../../../contexts/SocketContext';
import { SocketConnectionIndicator } from '../../../../../components/SocketConnectionIndicator/SocketConnectionIndicator';
import { useUsers } from './hooks/useUsersQuery';
import { useUsersSocket } from './hooks/useUsersSocket';
import { UserList } from './components/UserList';
import { UserForm } from './components/UserForm';
import { UserDetails } from './components/UserDetails';
import { User } from './services/usersApi';
import styles from './UserSettings.module.css';
import { API_URL } from '../../../../api/config';


// Создаем Query Client для управления пользователями
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 5, // 5 минут
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

interface UserSettingsContentProps {
  className?: string;
}

const UserSettingsContent: React.FC<UserSettingsContentProps> = ({ className }) => {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isCreateMode, setIsCreateMode] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  // Подключаем хуки
  const { data: users, isLoading, error } = useUsers();
  useUsersSocket(); // Подключаем WebSocket для обновлений в реальном времени

  const handleUserSelect = (user: User) => {
    setSelectedUser(user);
    setIsCreateMode(false);
    setIsEditMode(false);
  };

  const handleCreateUser = () => {
    setSelectedUser(null);
    setIsCreateMode(true);
    setIsEditMode(false);
  };

  const handleEditUser = (userId: number) => {
    const user = users?.find(u => u.userId === userId);
    if (user) {
      setSelectedUser(user);
      setIsCreateMode(false);
      setIsEditMode(true);
    }
  };

  const handleCancelEdit = () => {
    setIsCreateMode(false);
    setIsEditMode(false);
  };

  const handleUserCreated = () => {
    setIsCreateMode(false);
    setIsEditMode(false);
    // Список обновится автоматически через React Query
  };

  const handleUserUpdated = () => {
    setIsCreateMode(false);
    setIsEditMode(false);
    // Обновляем выбранного пользователя после редактирования
    if (selectedUser && users) {
      const updatedUser = users.find(u => u.userId === selectedUser.userId);
      if (updatedUser) {
        setSelectedUser(updatedUser);
      }
    }
  };

  const handleUserDeleted = (userId: number) => {
    // Если удаленный пользователь был выбран, сбрасываем выбор
    if (selectedUser && selectedUser.userId === userId) {
      setSelectedUser(null);
    }
    setIsCreateMode(false);
    setIsEditMode(false);
  };

  const handleUserDetailsUpdated = (updatedUser: User) => {
    setSelectedUser(updatedUser);
  };

  if (isLoading) {
    return (
      <div className={`${styles.userSettings} ${className || ''}`}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <span>Загрузка пользователей...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${styles.userSettings} ${className || ''}`}>
        <div className={styles.error}>
          <h3>Ошибка загрузки</h3>
          <p>{error.message}</p>
          <button onClick={() => window.location.reload()}>
            Попробовать снова
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.userSettings} ${className || ''}`}>
      {/* Socket.IO Connection Indicator */}
      <SocketConnectionIndicator 
        position="bottom-right" 
        showDetails={true} 
      />

      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h2 className={styles.headerTitle}>
            <span className={styles.headerIcon}>👥</span>
            Управление пользователями
          </h2>
          <p className={styles.headerSubtitle}>
            Настройка пользователей системы и управление их ролями 
            <span className={styles.realtimeIndicator}>
               • Обновления в реальном времени
            </span>
          </p>
        </div>
        <button 
          className={styles.createButton}
          onClick={handleCreateUser}
          disabled={isCreateMode || isEditMode}
        >
          + Создать пользователя
        </button>
      </div>

      <div className={styles.content}>
        <div className={styles.leftPanel}>
          <UserList
            onUserSelect={handleUserSelect}
            onUserEdit={handleEditUser}
            onUserDeleted={handleUserDeleted}
            selectedUserId={selectedUser?.userId}
          />
        </div>

        <div className={styles.rightPanel}>
          {isCreateMode && (
            <div className={styles.formContainer}>
              <UserForm
                onSaved={handleUserCreated}
                onCancel={handleCancelEdit}
              />
            </div>
          )}

          {isEditMode && selectedUser && (
            <div className={styles.formContainer}>
              <UserForm
                editId={selectedUser.userId}
                onSaved={handleUserUpdated}
                onCancel={handleCancelEdit}
              />
            </div>
          )}

          {!isCreateMode && !isEditMode && (
            <div className={styles.detailsContainer}>
              <UserDetails
                selectedUser={selectedUser}
                onUserUpdated={handleUserDetailsUpdated}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface UserSettingsProps {
  className?: string;
}

export const UserSettings: React.FC<UserSettingsProps> = ({ className }) => {
  return (
    <SocketProvider serverUrl={API_URL} autoConnect={true}>
      <QueryClientProvider client={queryClient}>
        <UserSettingsContent className={className} />
      </QueryClientProvider>
    </SocketProvider>
  );
};
