import React, { useState } from 'react';
import {
  useMaterialGroups,
  useCreateMaterialGroup,
  useUpdateMaterialGroup,
  useDeleteMaterialGroup,
} from '../api';

import { MaterialGroup, CreateMaterialGroupDto, UpdateMaterialGroupDto } from '../types';
import styles from './MaterialGroups.module.css';

interface MaterialGroupsProps {
  onGroupSelect?: (groupId: number) => void;
  selectedGroupId?: number;
}

export const MaterialGroups: React.FC<MaterialGroupsProps> = ({
  onGroupSelect,
  selectedGroupId
}) => {
  const [newName, setNewName] = useState('');
  const [editingGroup, setEditingGroup] = useState<MaterialGroup | null>(null);
  const [editName, setEditName] = useState('');

  // React Query хуки
  const { data: groups = [], isLoading: loading, error } = useMaterialGroups();
  const createMutation = useCreateMaterialGroup();
  const updateMutation = useUpdateMaterialGroup();
  const deleteMutation = useDeleteMaterialGroup();



  const handleCreate = async () => {
    if (!newName.trim()) return;

    try {
      const dto: CreateMaterialGroupDto = { groupName: newName.trim() };
      await createMutation.mutateAsync(dto);
      setNewName('');
      // Данные автоматически обновятся благодаря React Query и Socket.IO
    } catch (err: any) {
      console.error('Ошибка создания группы:', err);
    }
  };

  const handleStartEdit = (group: MaterialGroup) => {
    setEditingGroup(group);
    setEditName(group.groupName);
  };

  const handleSaveEdit = async () => {
    if (!editingGroup || !editName.trim()) return;

    try {
      const dto: UpdateMaterialGroupDto = { groupName: editName.trim() };
      await updateMutation.mutateAsync({ id: editingGroup.groupId, dto });
      setEditingGroup(null);
      setEditName('');
      // Данные автоматически обновятся благодаря React Query и Socket.IO
    } catch (err: any) {
      console.error('Ошибка обновления группы:', err);
    }
  };

  const handleCancelEdit = () => {
    setEditingGroup(null);
    setEditName('');
  };

  const handleDelete = async (group: MaterialGroup) => {
    const message = group.materialsCount && group.materialsCount > 0
      ? `Удалить группу "${group.groupName}"? В группе ${group.materialsCount} материалов. Все связи будут удалены.`
      : `Удалить группу "${group.groupName}"?`;

    if (!window.confirm(message)) {
      return;
    }

    try {
      await deleteMutation.mutateAsync(group.groupId);
      if (selectedGroupId === group.groupId) {
        onGroupSelect?.(0); // Reset selection
      }
      // Данные автоматически обновятся благодаря React Query и Socket.IO
    } catch (err: any) {
      console.error('Ошибка удаления группы:', err);
    }
  };

  const handleGroupClick = (groupId: number) => {
    if (selectedGroupId === groupId) {
      onGroupSelect?.(0); // Deselect if clicking on selected group
    } else {
      onGroupSelect?.(groupId);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCreate();
    }
  };

  const handleEditKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveEdit();
    }
    if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  // Определяем, какая операция выполняется
  const isCreating = createMutation.isPending;
  const isUpdating = updateMutation.isPending;
  const isDeletingId = deleteMutation.isPending ? deleteMutation.variables : null;
  const processingId = isUpdating ? editingGroup?.groupId : isDeletingId;

  if (loading) {
    return (
      <div className={styles.groupsCard}>
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>
            <span className={styles.cardIcon}>📁</span>
            Группы материалов
            {/* Socket.IO индикатор */}

          </h2>
        </div>
        <div className={styles.cardContent}>
          <div className={styles.loadingState}>
            <div className={styles.spinner}></div>
            <p>Загрузка групп...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.groupsCard}>
      <div className={styles.cardHeader}>
        <div className={styles.cardTitleSection}>
          <h2 className={styles.cardTitle}>
            <span className={styles.cardIcon}>📁</span>
            Группы материалов
            {/* Socket.IO индикатор */}

          </h2>
        </div>
        <div className={styles.badgeGroup}>
          <span className={styles.badge}>{groups.length}</span>
          {/* {isConnected && (
            <span className={styles.realtimeBadge} title="Обновления в реальном времени">
              🔄
            </span>
          )} */}
        </div>
      </div>

      <div className={styles.cardContent}>
        {/* Create New Group */}
        <div className={styles.createGroupForm}>
          <div className={styles.inputGroup}>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Название новой группы"
              className={styles.input}
              disabled={isCreating}
            />
            <button
              onClick={handleCreate}
              disabled={!newName.trim() || isCreating}
              className={`${styles.button} ${styles.buttonPrimary} ${styles.buttonSmall}`}
            >
              {isCreating ? (
                <span className={styles.buttonSpinner}></span>
              ) : (
                <span className={styles.buttonIcon}>+</span>
              )}
            </button>
          </div>

          {/* Real-time status */}

        </div>

        {/* Error Message */}
        {(error || createMutation.error || updateMutation.error || deleteMutation.error ) && (
          <div className={styles.errorMessage}>
            <span className={styles.errorIcon}>⚠️</span>
           
          </div>
        )}

        {/* Groups List */}
        <div className={styles.groupsList}>
          {groups.length === 0 ? (
            <div className={styles.emptyState}>
              <span className={styles.emptyIcon}>📁</span>
              <p>Нет созданных групп</p>
              <p className={styles.emptySubtext}>Создайте первую группу для организации материалов</p>
            </div>
          ) : (
            <div className={styles.groupsGrid}>
              {groups.map((group) => (
                <div
                  key={group.groupId}
                  className={`${styles.groupItem} ${selectedGroupId === group.groupId ? styles.groupItemSelected : ''
                    } ${processingId === group.groupId ? styles.groupItemProcessing : ''}`}
                  onClick={() => !editingGroup && handleGroupClick(group.groupId)}
                >
                  {editingGroup?.groupId === group.groupId ? (
                    <div className={styles.editForm} onClick={(e) => e.stopPropagation()}>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyPress={handleEditKeyPress}
                        className={styles.editInput}
                        autoFocus
                      />
                      <div className={styles.editActions}>
                        <button
                          onClick={handleSaveEdit}
                          className={`${styles.button} ${styles.buttonSuccess} ${styles.buttonMini}`}
                          disabled={!editName.trim() || isUpdating}
                        >
                          {isUpdating ? (
                            <span className={styles.buttonSpinner}></span>
                          ) : (
                            '✓'
                          )}
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className={`${styles.button} ${styles.buttonSecondary} ${styles.buttonMini}`}
                          disabled={isUpdating}
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className={styles.groupInfo}>
                        <h3 className={styles.groupName}>
                          {group.groupName}
                          {selectedGroupId === group.groupId && (
                            <span style={{ marginLeft: '8px', fontSize: '14px' }}>📌</span>
                          )}
                        </h3>
                        <p className={styles.groupCount}>
                          {group.materialsCount || 0} материалов
                        </p>
                      </div>
                      <div className={styles.groupActions} onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleStartEdit(group)}
                          className={`${styles.button} ${styles.buttonWarning} ${styles.buttonMini}`}
                          disabled={processingId === group.groupId}
                          title="Редактировать"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDelete(group)}
                          className={`${styles.button} ${styles.buttonDanger} ${styles.buttonMini}`}
                          disabled={processingId === group.groupId}
                          title="Удалить"
                        >
                          🗑️
                        </button>
                      </div>
                      {processingId === group.groupId && (
                        <div className={styles.processingOverlay}>
                          <div className={styles.spinner}></div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Help Text */}
        {groups.length > 0 && (
          <div className={styles.formHelp}>
            <div className={styles.helpText}>
              <span className={styles.helpIcon}>💡</span>
              Нажмите на группу чтобы отфильтровать материалы. Повторный клик снимает фильтр.
            </div>
            
          </div>
        )}
      </div>
    </div>
  );
};