
import React, { useState, useEffect } from 'react';
import { 
  useUserRoles, 
  useAvailableRoles,
  useAssignGlobalRole,
  useRemoveGlobalRole,
  useCreateRoleBinding,
  useRemoveRoleBinding,
  useContextMachines,
  useContextStages,
  useContextPickers,
  useUsers,
  usePickerByUserId,
  useCreatePickerWithRole,
  useDeletePicker
} from '../hooks/useUsersQuery';
import { User, CreateRoleBindingDto } from '../services/usersApi';
import { PRODUCTION_TYPE_LABELS } from '@/types/production';
import styles from './UserDetails.module.css';

interface UserDetailsProps {
  selectedUser: User | null;
  onUserUpdated?: (updatedUser: User) => void;
}

type ContextType = 'MACHINE' | 'STAGE_LEVEL1' | 'ORDER_PICKER';

export const UserDetails: React.FC<UserDetailsProps> = ({ 
  selectedUser, 
  onUserUpdated 
}) => {
  const [activeTab, setActiveTab] = useState<'info' | 'roles' | 'picker'>('info');
  const [showAddRoleModal, setShowAddRoleModal] = useState(false);
  const [showAddBindingModal, setShowAddBindingModal] = useState(false);
  const [selectedContextType, setSelectedContextType] = useState<ContextType>('MACHINE');
  const [showCreatePickerModal, setShowCreatePickerModal] = useState(false);

  const { data: userRoles } = useUserRoles(selectedUser?.userId);
  const { data: availableRoles } = useAvailableRoles();
  const { data: contextMachines = [] } = useContextMachines();
  const { data: contextStages = [] } = useContextStages();
  const { data: contextPickers = [] } = useContextPickers();
  const { data: users = [] } = useUsers();
  const { data: userPicker, error: pickerError } = usePickerByUserId(selectedUser?.userId);
  
  const assignGlobalRoleMutation = useAssignGlobalRole();
  const removeGlobalRoleMutation = useRemoveGlobalRole();
  const createBindingMutation = useCreateRoleBinding();
  const removeBindingMutation = useRemoveRoleBinding();
  const createPickerWithRoleMutation = useCreatePickerWithRole();
  const deletePickerMutation = useDeletePicker();

  // Получаем актуальные данные пользователя из списка
  const currentUser = selectedUser 
    ? users.find(u => u.userId === selectedUser.userId) || selectedUser
    : null;

  // Проверяем, есть ли у пользователя комплектовщик
  const hasPickerRole = userRoles?.globalRoles.includes('orderPicker') || 
    userRoles?.roleBindings.some(binding => binding.role === 'orderPicker');

  // Уведомляем родительский компонент об обновлении
  useEffect(() => {
    if (currentUser && onUserUpdated && selectedUser) {
      if (JSON.stringify(currentUser) !== JSON.stringify(selectedUser)) {
        console.log('[UserDetails] Обнаружено обновление пользователя, уведомляем родителя');
        onUserUpdated(currentUser);
      }
    }
  }, [currentUser, selectedUser, onUserUpdated]);

  const handleAssignGlobalRole = async (role: string) => {
    if (!currentUser) return;
    
    try {
      console.log('[UserDetails] Назначаем глобальную роль:', role);
      await assignGlobalRoleMutation.mutateAsync({
        userId: currentUser.userId,
        role
      });
      setShowAddRoleModal(false);
      console.log('[UserDetails] Глобальная роль успешно назначена');
    } catch (error) {
      console.error('Ошибка назначения глобальной роли:', error);
      alert('Ошибка назначения глобальной роли. Попробуйте еще раз.');
    }
  };

  const handleRemoveGlobalRole = async (role: string) => {
    if (!currentUser) return;
    
    if (window.confirm(`Удалить глобальную роль "${role}"?`)) {
      try {
        console.log('[UserDetails] Удаляем глобальную роль:', role);
        await removeGlobalRoleMutation.mutateAsync({
          userId: currentUser.userId,
          role
        });
        console.log('[UserDetails] Глобальная роль успешно удалена');
      } catch (error) {
        console.error('Ошибка удаления глобальной роли:', error);
        alert('Ошибка удаления глобальной роли. Попробуйте еще раз.');
      }
    }
  };

  const handleCreateRoleBinding = async (role: string, contextId: number) => {
    if (!currentUser) return;
    
    try {
      console.log('[UserDetails] Создаем контекстную привязку:', { role, contextType: selectedContextType, contextId });
      await createBindingMutation.mutateAsync({
        userId: currentUser.userId,
        role,
        contextType: selectedContextType,
        contextId
      });
      setShowAddBindingModal(false);
      console.log('[UserDetails] Контекстная привязка успешно создана');
    } catch (error) {
      console.error('Ошибка создания контекстной привязки:', error);
      alert('Ошибка создания контекстной привязки. Попробуйте еще раз.');
    }
  };

  const handleRemoveRoleBinding = async (bindingId: number, bindingName: string) => {
    if (!currentUser) return;
    
    if (window.confirm(`Удалить контекстную привязку "${bindingName}"?`)) {
      try {
        console.log('[UserDetails] Удаляем контекстную привязку:', bindingId);
        await removeBindingMutation.mutateAsync({
          bindingId,
          userId: currentUser.userId
        });
        console.log('[UserDetails] Контекстная привязка успешно удалена');
      } catch (error) {
        console.error('Ошибка удаления контекстной привязки:', error);
        alert('Ошибка удаления контекстной привязки. Попробуйте еще раз.');
      }
    }
  };

  const handleCreatePicker = async () => {
    if (!currentUser) return;
    
    try {
      console.log('[UserDetails] Создаем комплектовщика для пользователя:', currentUser.userId);
      await createPickerWithRoleMutation.mutateAsync({
        userId: currentUser.userId,
        assignRole: true
      });
      setShowCreatePickerModal(false);
      console.log('[UserDetails] Комплектовщик успешно создан');
    } catch (error) {
      console.error('Ошибка создания комплектовщика:', error);
      alert('Ошибка создания комплектовщика. Попробуйте еще раз.');
    }
  };

  const handleDeletePicker = async () => {
    if (!currentUser || !userPicker) return;
    
    if (window.confirm('Вы уверены, что хотите удалить комплектовщика? Это действие нельзя отменить.')) {
      try {
        console.log('[UserDetails] Удаляем комплектовщика:', userPicker.pickerId);
        await deletePickerMutation.mutateAsync(userPicker.pickerId);
        console.log('[UserDetails] Комплектовщик успешно удален');
      } catch (error) {
        console.error('Ошибка удаления комплектовщика:', error);
        alert('Ошибка удаления комплектовщика. Попробуйте еще раз.');
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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

  const getRoleDisplayName = (role: string) => {
    const roleNames: { [key: string]: string } = {
      admin: 'Администратор',
      management: 'Менеджмент',
      technologist: 'Технолог',
      master: 'Мастер',
      operator: 'Оператор',
      orderPicker: 'Комплектовщик заказов',
      workplace: 'Рабочее место'
    };
    return roleNames[role] || role;
  };

  const getContextTypeDisplayName = (contextType: string) => {
    const contextNames: { [key: string]: string } = {
      MACHINE: 'Станок',
      STAGE_LEVEL1: 'Этап',
      ORDER_PICKER: 'Комплектовщик'
    };
    return contextNames[contextType] || contextType;
  };

  const getAvailableGlobalRoles = () => {
    if (!availableRoles || !userRoles) return [];
    return availableRoles.roles.filter(role => !userRoles.globalRoles.includes(role));
  };

  const getContextOptions = () => {
    switch (selectedContextType) {
      case 'MACHINE':
        return contextMachines.map(m => ({ id: m.machineId, name: m.machineName }));
      case 'STAGE_LEVEL1':
        return contextStages.map(s => ({ id: s.stageId, name: s.stageName }));
      case 'ORDER_PICKER':
        return contextPickers.map(p => ({ id: p.pickerId, name: p.pickerName }));
      default:
        return [];
    }
  };

  const getAvailableRolesForContext = (contextType: ContextType) => {
    if (!availableRoles) return [];
    
    switch (contextType) {
      case 'MACHINE':
        return ['workplace'];
      case 'STAGE_LEVEL1':
        return ['master', 'operator'];
      case 'ORDER_PICKER':
        return ['orderPicker'];
      default:
        return [];
    }
  };

  if (!currentUser) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>👤</div>
          <h3>Выберите пользователя</h3>
          <p>Выберите пользователя из списка для просмотра детальной информации</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <div className={styles.userAvatar}>
            {currentUser.userDetail.firstName[0]}{currentUser.userDetail.lastName[0]}
          </div>
          <div className={styles.userInfo}>
            <h2 className={styles.title}>
              {currentUser.userDetail.firstName} {currentUser.userDetail.lastName}
            </h2>
            <div className={styles.userLogin}>@{currentUser.login}</div>
            {userPicker && (
              <div className={styles.userBadge}>
                🏷️ Комплектовщик ID: {userPicker.pickerId}
              </div>
            )}
          </div>
        </div>
        
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'info' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('info')}
          >
            Информация
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'roles' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('roles')}
          >
            Роли и привязки
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'picker' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('picker')}
          >
            Комплектовщик
            {userPicker && <span className={styles.tabBadge}>✓</span>}
          </button>
        </div>
      </div>

      <div className={styles.content}>
        {activeTab === 'info' && (
          <div className={styles.infoTab}>
            <div className={styles.infoGrid}>
              <div className={styles.infoCard}>
                <h3 className={styles.infoCardTitle}>Основная информация</h3>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>ID:</span>
                  <span className={styles.infoValue}>{currentUser.userId}</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Логин:</span>
                  <span className={styles.infoValue}>{currentUser.login}</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Имя:</span>
                  <span className={styles.infoValue}>{currentUser.userDetail.firstName}</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Фамилия:</span>
                  <span className={styles.infoValue}>{currentUser.userDetail.lastName}</span>
                </div>
              </div>

              <div className={styles.infoCard}>
                <h3 className={styles.infoCardTitle}>Контактная информация</h3>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Телефон:</span>
                  <span className={styles.infoValue}>
                    {currentUser.userDetail.phone || 'Не указан'}
                  </span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Должность:</span>
                  <span className={styles.infoValue}>
                    {currentUser.userDetail.position || 'Не указана'}
                  </span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Зарплата:</span>
                  <span className={styles.infoValue}>
                    {formatSalary(currentUser.userDetail.salary)}
                  </span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Тип производства:</span>
                  <span className={styles.infoValue}>
                    {currentUser.productionType ? PRODUCTION_TYPE_LABELS[currentUser.productionType] : 'Не указан'}
                  </span>
                </div>
              </div>

              <div className={styles.infoCard}>
                <h3 className={styles.infoCardTitle}>Системная информация</h3>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Создан:</span>
                  <span className={styles.infoValue}>
                    {formatDate(currentUser.createdAt)}
                  </span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Обновлен:</span>
                  <span className={styles.infoValue}>
                    {formatDate(currentUser.updatedAt)}
                  </span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Глобальных ролей:</span>
                  <span className={styles.infoValue}>
                    {userRoles?.globalRoles.length || 0}
                  </span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Контекстных привязок:</span>
                  <span className={styles.infoValue}>
                    {userRoles?.roleBindings.length || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'roles' && (
          <div className={styles.rolesTab}>
            {/* Глобальные роли */}
            <div className={styles.globalRolesSection}>
              <div className={styles.sectionHeader}>
                <h3 className={styles.sectionTitle}>Глобальные роли</h3>
                <button
                  onClick={() => setShowAddRoleModal(true)}
                  className={styles.addButton}
                  disabled={getAvailableGlobalRoles().length === 0}
                >
                  + Добавить роль
                </button>
              </div>
              
              <div className={styles.rolesList}>
                {(!userRoles?.globalRoles || userRoles.globalRoles.length === 0) ? (
                  <div className={styles.emptyList}>
                    <p>Глобальные роли не назначены</p>
                  </div>
                ) : (
                  userRoles.globalRoles.map((role) => (
                    <div key={role} className={styles.roleItem}>
                      <div className={styles.roleInfo}>
                        <h4 className={styles.roleName}>{getRoleDisplayName(role)}</h4>
                        <p className={styles.roleCode}>({role})</p>
                      </div>
                      <button
                        onClick={() => handleRemoveGlobalRole(role)}
                        className={styles.removeButton}
                        disabled={removeGlobalRoleMutation.isPending}
                      >
                        {removeGlobalRoleMutation.isPending ? '⏳' : '🗑️'}
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Контекстные привязки */}
            <div className={styles.bindingsSection}>
              <div className={styles.sectionHeader}>
                <h3 className={styles.sectionTitle}>Контекстные привязки</h3>
                <button
                  onClick={() => setShowAddBindingModal(true)}
                  className={styles.addButton}
                >
                  + Добавить привязку
                </button>
              </div>
              
              <div className={styles.bindingsList}>
                {(!userRoles?.roleBindings || userRoles.roleBindings.length === 0) ? (
                  <div className={styles.emptyList}>
                    <p>Контекстные привязки не созданы</p>
                  </div>
                ) : (
                  userRoles.roleBindings.map((binding) => (
                    <div key={binding.id} className={styles.bindingItem}>
                      <div className={styles.bindingInfo}>
                        <h4 className={styles.bindingRole}>{getRoleDisplayName(binding.role)}</h4>
                        <p className={styles.bindingContext}>
                          {getContextTypeDisplayName(binding.contextType)}: {binding.contextName}
                        </p>
                        <span className={styles.bindingId}>ID: {binding.id}</span>
                      </div>
                      <button
                        onClick={() => handleRemoveRoleBinding(binding.id, `${binding.role} - ${binding.contextName}`)}
                        className={styles.removeButton}
                        disabled={removeBindingMutation.isPending}
                      >
                        {removeBindingMutation.isPending ? '⏳' : '🗑️'}
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'picker' && (
          <div className={styles.pickerTab}>
            <div className={styles.pickerSection}>
              <div className={styles.sectionHeader}>
                <h3 className={styles.sectionTitle}>Комплектовщик</h3>
                {!userPicker ? (
                  <button
                    onClick={() => setShowCreatePickerModal(true)}
                    className={styles.addButton}
                  >
                    + Создать комплектовщика
                  </button>
                ) : (
                  <button
                    onClick={handleDeletePicker}
                    className={styles.deleteButton}
                    disabled={deletePickerMutation.isPending}
                  >
                    {deletePickerMutation.isPending ? '⏳ Удаление...' : '🗑️ Удалить комплектовщика'}
                  </button>
                )}
              </div>
              
              {!userPicker ? (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}>📦</div>
                  <h4>Комплектовщик не создан</h4>
                  <p>Этот пользователь пока не является комплектовщиком</p>
                  <p className={styles.hint}>
                    Создайте комплектовщика, чтобы пользователь мог работать с заказами
                  </p>
                </div>
              ) : (
                <div className={styles.pickerInfo}>
                  <div className={styles.pickerCard}>
                    <div className={styles.pickerHeader}>
                      <div className={styles.pickerIcon}>📦</div>
                      <div className={styles.pickerTitleSection}>
                        <h4 className={styles.pickerTitle}>
                          Комплектовщик #{userPicker.pickerId}
                        </h4>
                        <p className={styles.pickerSubtitle}>
                          {userPicker.user.userDetail.firstName} {userPicker.user.userDetail.lastName}
                        </p>
                      </div>
                      <div className={styles.pickerStatus}>
                        <span className={styles.statusBadge}>
                          {hasPickerRole ? '✅ Активен' : '⚠️ Нет роли'}
                        </span>
                      </div>
                    </div>
                    
                    <div className={styles.pickerDetails}>
                      <div className={styles.pickerRow}>
                        <span className={styles.pickerLabel}>ID комплектовщика:</span>
                        <span className={styles.pickerValue}>{userPicker.pickerId}</span>
                      </div>
                      <div className={styles.pickerRow}>
                        <span className={styles.pickerLabel}>ID пользователя:</span>
                        <span className={styles.pickerValue}>{userPicker.userId}</span>
                      </div>
                      <div className={styles.pickerRow}>
                        <span className={styles.pickerLabel}>Логин:</span>
                        <span className={styles.pickerValue}>{userPicker.user.login}</span>
                      </div>
                      <div className={styles.pickerRow}>
                        <span className={styles.pickerLabel}>Создан:</span>
                        <span className={styles.pickerValue}>
                          {formatDate(userPicker.createdAt)}
                        </span>
                      </div>
                      <div className={styles.pickerRow}>
                        <span className={styles.pickerLabel}>Роль назначена:</span>
                        <span className={styles.pickerValue}>
                          {hasPickerRole ? 'Да' : 'Нет (требуется назначить роль orderPicker)'}
                        </span>
                      </div>
                    </div>

                    {!hasPickerRole && (
                      <div className={styles.pickerWarning}>
                        <p>⚠️ Комплектовщик создан, но роль не назначена</p>
                        <p>Перейдите на вкладку "Роли и привязки", чтобы назначить роль orderPicker</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Модальное окно добавления глобальной роли */}
      {showAddRoleModal && (
        <div className={styles.modalOverlay} onClick={() => setShowAddRoleModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Добавить глобальную роль</h3>
              <button 
                onClick={() => setShowAddRoleModal(false)}
                className={styles.closeButton}
              >
                ✕
              </button>
            </div>
            <div className={styles.modalContent}>
              <div className={styles.roleOptions}>
                {getAvailableGlobalRoles().map((role) => (
                  <div key={role} className={styles.roleOption}>
                    <div className={styles.roleOptionInfo}>
                      <h4>{getRoleDisplayName(role)}</h4>
                      <p>({role})</p>
                    </div>
                    <button
                      onClick={() => handleAssignGlobalRole(role)}
                      className={styles.selectButton}
                      disabled={assignGlobalRoleMutation.isPending}
                    >
                      {assignGlobalRoleMutation.isPending ? 'Назначение...' : 'Назначить'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно добавления контекстной привязки */}
      {showAddBindingModal && (
        <div className={styles.modalOverlay} onClick={() => setShowAddBindingModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Добавить контекстную привязку</h3>
              <button 
                onClick={() => setShowAddBindingModal(false)}
                className={styles.closeButton}
              >
                ✕
              </button>
            </div>
            <div className={styles.modalContent}>
              <div className={styles.contextTypeSelector}>
                <label className={styles.selectLabel}>Тип контекста:</label>
                <select
                  value={selectedContextType}
                  onChange={(e) => setSelectedContextType(e.target.value as ContextType)}
                  className={styles.select}
                >
                  <option value="MACHINE">Станок</option>
                  <option value="STAGE_LEVEL1">Этап</option>
                  <option value="ORDER_PICKER">Комплектовщик</option>
                </select>
              </div>

              <div className={styles.bindingOptions}>
                {getAvailableRolesForContext(selectedContextType).map((role) => (
                  <div key={role} className={styles.roleSection}>
                    <h4 className={styles.roleSectionTitle}>{getRoleDisplayName(role)}</h4>
                    <div className={styles.contextOptions}>
                      {getContextOptions().map((context) => (
                        <div key={context.id} className={styles.contextOption}>
                          <div className={styles.contextOptionInfo}>
                            <span>{context.name}</span>
                            <small>ID: {context.id}</small>
                          </div>
                          <button
                            onClick={() => handleCreateRoleBinding(role, context.id)}
                            className={styles.selectButton}
                            disabled={createBindingMutation.isPending}
                          >
                            {createBindingMutation.isPending ? 'Создание...' : 'Создать'}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно создания комплектовщика */}
      {showCreatePickerModal && (
        <div className={styles.modalOverlay} onClick={() => setShowCreatePickerModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Создать комплектовщика</h3>
              <button 
                onClick={() => setShowCreatePickerModal(false)}
                className={styles.closeButton}
              >
                ✕
              </button>
            </div>
            <div className={styles.modalContent}>
              <div className={styles.confirmationContent}>
                <div className={styles.confirmationIcon}>📦</div>
                <h4>Создать комплектовщика для пользователя?</h4>
                <p>
                  Пользователь <strong>{currentUser.userDetail.firstName} {currentUser.userDetail.lastName}</strong> 
                  станет комплектовщиком с автоматически назначенной роль orderPicker.
                </p>
                <div className={styles.confirmationActions}>
                  <button
                    onClick={() => setShowCreatePickerModal(false)}
                    className={styles.cancelButton}
                  >
                    Отмена
                  </button>
                  <button
                    onClick={handleCreatePicker}
                    className={styles.confirmButton}
                    disabled={createPickerWithRoleMutation.isPending}
                  >
                    {createPickerWithRoleMutation.isPending ? 'Создание...' : 'Создать комплектовщика'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
