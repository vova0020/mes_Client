import React, { useState, useEffect } from 'react';
import {
  getMaterialGroups,
  createMaterialGroup,
  updateMaterialGroup,
  deleteMaterialGroup,
} from '../api';
import { MaterialGroup, CreateMaterialGroupDto, UpdateMaterialGroupDto } from '../types';
import styles from '../MaterialSettings.module.css';

interface MaterialGroupsProps {
  onGroupSelect?: (groupId: number) => void;
}

export const MaterialGroups: React.FC<MaterialGroupsProps> = ({ onGroupSelect }) => {
  const [groups, setGroups] = useState<MaterialGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [newName, setNewName] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState<number>();

  const fetch = () => {
    setLoading(true);
    setError('');
    getMaterialGroups()
      .then(res => {
        setGroups(res.data);
        setError('');
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(fetch, []);

  const handleCreate = () => {
    if (!newName.trim()) return;
    
    const dto: CreateMaterialGroupDto = { groupName: newName.trim() };
    createMaterialGroup(dto)
      .then(() => { 
        setNewName(''); 
        fetch(); 
      })
      .catch(err => alert(err.response?.data?.message || err.message));
  };

  const handleUpdate = (group: MaterialGroup) => {
    const name = prompt('Новое название группы:', group.groupName);
    if (name && name.trim() && name.trim() !== group.groupName) {
      const dto: UpdateMaterialGroupDto = { groupName: name.trim() };
      updateMaterialGroup(group.groupId, dto)
        .then(fetch)
        .catch(err => alert(err.response?.data?.message || err.message));
    }
  };

  const handleDelete = (group: MaterialGroup) => {
    if (window.confirm(`Удалить группу "${group.groupName}"?`)) {
      deleteMaterialGroup(group.groupId)
        .then(fetch)
        .catch(err => alert(err.response?.data?.message || err.message));
    }
  };

  const handleGroupClick = (groupId: number) => {
    setSelectedGroupId(groupId);
    onGroupSelect?.(groupId);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCreate();
    }
  };

  if (loading) {
    return (
      <div className={`${styles.componentBlock} ${styles.materialGroupsContainer}`}>
        <div className={styles.blockHeader}>
          <h2 className={styles.blockTitle}>Группы материалов</h2>
        </div>
        <div className={styles.blockContent}>
          <div className={styles.loadingContainer}>
            <div className={styles.loadingSpinner}></div>
            <p className={styles.loadingText}>Загрузка групп...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${styles.componentBlock} ${styles.materialGroupsContainer}`}>
        <div className={styles.blockHeader}>
          <h2 className={styles.blockTitle}>Группы материалов</h2>
        </div>
        <div className={styles.blockContent}>
          <div className={styles.errorContainer}>
            <p className={styles.errorText}>Ошибка: {error}</p>
          </div>
          <button 
            onClick={fetch}
            className={`${styles.button} ${styles.buttonPrimary} ${styles.buttonMedium}`}
          >
            Повторить
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.componentBlock} ${styles.materialGroupsContainer}`}>
      <div className={styles.blockHeader}>
        <h2 className={styles.blockTitle}>Группы материалов</h2>
      </div>
      <div className={styles.blockContent}>
        <div className={styles.addForm}>
          <input
            className={`${styles.formInput} ${styles.addFormInput}`}
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Название новой группы"
            aria-label="Название новой группы"
          />
          <button
            onClick={handleCreate}
            disabled={!newName.trim()}
            className={`${styles.button} ${styles.buttonPrimary} ${styles.buttonMedium} ${styles.addFormButton}`}
          >
            Добавить
          </button>
        </div>
        
        {groups.length === 0 ? (
          <div className={styles.loadingContainer}>
            <p className={styles.loadingText}>Нет групп материалов</p>
          </div>
        ) : (
          <ul className={styles.itemList}>
            {groups.map((group, index) => (
              <li 
                key={group.groupId} 
                className={`${styles.listItem} ${styles.animatedItem} ${
                  selectedGroupId === group.groupId ? styles.listItemSelected : ''
                }`}
                onClick={() => handleGroupClick(group.groupId)}
                style={{ cursor: 'pointer' }}
              >
                <div className={styles.listItemContent}>
                  <div className={styles.listItemInfo}>
                    <h3 className={styles.listItemTitle}>
                      {group.groupName}
                      <span className={styles.badge}>
                        {group.materialsCount || 0}
                      </span>
                    </h3>
                    <p className={styles.listItemSubtitle}>
                      Материалов в группе: {group.materialsCount || 0}
                    </p>
                  </div>
                  <div className={styles.listItemActions}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUpdate(group);
                      }}
                      className={`${styles.button} ${styles.buttonWarning} ${styles.buttonSmall}`}
                      title="Редактировать группу"
                    >
                      ✎
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(group);
                      }}
                      className={`${styles.button} ${styles.buttonDanger} ${styles.buttonSmall}`}
                      title="Удалить группу"
                    >
                      🗑
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};