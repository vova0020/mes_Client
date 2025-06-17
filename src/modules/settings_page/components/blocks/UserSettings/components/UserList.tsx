import React, { useState } from 'react';
import { useUsers, useDeleteUser } from '../hooks/useUsersQuery';
import { User } from '../services/usersApi';
import styles from './UserList.module.css';

interface UserListProps {
  onUserSelect: (user: User) => void;
  onUserEdit: (userId: number) => void;
  onUserDeleted: (userId: number) => void;
  selectedUserId?: number;
}

export const UserList: React.FC<UserListProps> = ({
  onUserSelect,
  onUserEdit,
  onUserDeleted,
  selectedUserId,
}) => {
  const [filter, setFilter] = useState<{
    search?: string;
    position?: string;
  }>({});

  const { data: users = [], isLoading, error } = useUsers();
  const deleteMutation = useDeleteUser();

  // Фильтрация пользователей
  const filteredUsers = users.filter(user => {
    if (filter.search) {
      const searchLower = filter.search.toLowerCase();
      const fullName = `${user.userDetail.firstName} ${user.userDetail.lastName}`.toLowerCase();
      const loginMatch = user.login.toLowerCase().includes(searchLower);
      const nameMatch = fullName.includes(searchLower);
      
      if (!loginMatch && !nameMatch) {
        return false;
      }
    }
    
    if (filter.position && user.userDetail.position !== filter.position) {
      return false;
    }
    
    return true;
  });

  // Получаем уникальные должности для фильтра
  const uniquePositions = Array.from(new Set(
    users
      .map(user => user.userDetail.position)
      .filter((position): position is string => position !== null && position !== undefined && position.trim() !== '')
  ));

  const handleDeleteUser = async (userId: number, userLogin: string) => {
    if (window.confirm(`Вы уверены, что хотите удалить пользователя "${userLogin}"?`)) {
      try {
        await deleteMutation.mutateAsync(userId);
        onUserDeleted(userId);
      } catch (error) {
        console.error('Ошибка удаления пользователя:', error);
        alert('Ошибка удаления пользователя. Попробуйте еще раз.');
      }
    }
  };

  const formatCreatedDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatSalary = (salary?: number) => {
    if (!salary) return 'Не указана';
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0
    }).format(salary);
  };

  if (isLoading) {
    return (
      <div className={styles.userListContainer}>
        <div className={styles.listHeader}>
          <h2 className={styles.title}>Пользователи</h2>
        </div>
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p>Загрузка пользователей...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.userListContainer}>
        <div className={styles.listHeader}>
          <h2 className={styles.title}>Пользователи</h2>
        </div>
        <div className={styles.errorContainer}>
          <p>Ошибка загрузки: {error.message}</p>
          <button 
            onClick={() => window.location.reload()} 
            className={styles.retryButton}
          >
            Попробовать снова
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.userListContainer}>
      <div className={styles.listHeader}>
        <div className={styles.searchContainer}>
          <span className={styles.searchIcon}>🔍</span>
          <input
            type="text"
            placeholder="Поиск по имени или логину..."
            value={filter.search || ''}
            onChange={(e) => setFilter(prev => ({ ...prev, search: e.target.value }))}
            className={styles.searchInput}
          />
        </div>
        
        <div className={styles.resultsCount}>
          Найдено: {filteredUsers.length} из {users.length}
        </div>
        
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>👥</div>
            <div className={styles.statInfo}>
              <div className={styles.statValue}>{users.length}</div>
              <div className={styles.statLabel}>всего пользователей</div>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>💼</div>
            <div className={styles.statInfo}>
              <div className={styles.statValue}>{uniquePositions.length}</div>
              <div className={styles.statLabel}>должностей</div>
            </div>
          </div>
        </div>
      </div>

      {/* Фильтры */}
      <div className={styles.filtersContainer}>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Фильтр по должности:</label>
          <select
            value={filter.position || ''}
            onChange={(e) => setFilter(prev => ({ 
              ...prev, 
              position: e.target.value || undefined 
            }))}
            className={styles.filterSelect}
          >
            <option value="">Все должности</option>
            {uniquePositions.map(position => (
              <option key={position} value={position}>
                {position}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Список пользователей */}
      <div className={styles.usersList}>
        {filteredUsers.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyStateIcon}>👥</div>
            <h3 className={styles.emptyStateTitle}>Пользователи не найдены</h3>
            <p className={styles.emptyStateDescription}>
              {filter.search || filter.position 
                ? 'Попробуйте изменить фильтры поиска'
                : 'Добавьте первого пользователя, нажав кнопку "Создать пользователя"'
              }
            </p>
          </div>
        ) : (
          filteredUsers.map((user) => (
            <div
              key={user.userId}
              className={`${styles.userCard} ${
                selectedUserId === user.userId ? styles.userSelected : ''
              }`}
              onClick={() => onUserSelect(user)}
            >
              <div className={styles.userInfo}>
                <div className={styles.userHeader}>
                  <div className={styles.userAvatar}>
                    {user.userDetail.firstName[0]}{user.userDetail.lastName[0]}
                  </div>
                  <div className={styles.userBasicInfo}>
                    <h3 className={styles.userName}>
                      {user.userDetail.firstName} {user.userDetail.lastName}
                    </h3>
                    <div className={styles.userLogin}>@{user.login}</div>
                  </div>
                </div>

                <div className={styles.userDetails}>
                  {user.userDetail.position && (
                    <div className={styles.userPosition}>
                      <span className={styles.positionLabel}>Должность:</span>
                      <span className={styles.positionValue}>
                        {user.userDetail.position}
                      </span>
                    </div>
                  )}
                  
                  {user.userDetail.phone && (
                    <div className={styles.userPhone}>
                      <span className={styles.phoneLabel}>Телефон:</span>
                      <span className={styles.phoneValue}>
                        {user.userDetail.phone}
                      </span>
                    </div>
                  )}

                  <div className={styles.userSalary}>
                    <span className={styles.salaryLabel}>Зарплата:</span>
                    <span className={styles.salaryValue}>
                      {formatSalary(user.userDetail.salary)}
                    </span>
                  </div>

                  <div className={styles.userCreated}>
                    <span className={styles.createdLabel}>Создан:</span>
                    <span className={styles.createdValue}>
                      {formatCreatedDate(user.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className={styles.userActions}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onUserEdit(user.userId);
                  }}
                  className={`${styles.actionButton} ${styles.editButton}`}
                  title="Редактировать"
                >
                  ✏️ Изменить
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteUser(user.userId, user.login);
                  }}
                  className={`${styles.actionButton} ${styles.deleteButton}`}
                  title="Удалить"
                  disabled={deleteMutation.isPending}
                >
                  {deleteMutation.isPending ? '⏳' : '🗑️'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};