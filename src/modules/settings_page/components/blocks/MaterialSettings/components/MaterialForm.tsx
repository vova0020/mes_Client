// ================================================
// src/modules/materials/components/MaterialForm.tsx
// ================================================
import React, { useState, useEffect } from 'react';
import { getMaterialGroups, getMaterialById, createMaterial, updateMaterial } from '../api';
import { MaterialGroup, CreateMaterialDto, UpdateMaterialDto } from '../types';
import styles from '../MaterialSettings.module.css';

interface MaterialFormProps {
  editId?: number;
  onSaved?: () => void;
}

export const MaterialForm: React.FC<MaterialFormProps> = ({ editId, onSaved }) => {
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('');
  const [groups, setGroups] = useState<MaterialGroup[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [groupsLoading, setGroupsLoading] = useState(true);
  const [error, setError] = useState<string>('');

  const fetchGroups = () => {
    setGroupsLoading(true);
    getMaterialGroups()
      .then(res => {
        setGroups(res.data);
        setError('');
      })
      .catch(err => setError(err.message))
      .finally(() => setGroupsLoading(false));
  };

  const fetchMaterial = () => {
    if (editId) {
      setLoading(true);
      getMaterialById(editId)
        .then(res => {
          setName(res.data.materialName);
          setUnit(res.data.unit);
          setSelected(res.data.groups?.map(g => g.groupId) || []);
          setError('');
        })
        .catch(err => setError(err.message))
        .finally(() => setLoading(false));
    } else {
      setName('');
      setUnit('');
      setSelected([]);
    }
  };

  useEffect(fetchGroups, []);
  useEffect(fetchMaterial, [editId]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('Введите название материала');
      return;
    }
    if (!unit.trim()) {
      setError('Введите единицу измерения');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const dto: CreateMaterialDto | UpdateMaterialDto = { 
        materialName: name.trim(), 
        unit: unit.trim(), 
        groupIds: selected 
      };
      
      const action = editId 
        ? updateMaterial(editId, dto as UpdateMaterialDto) 
        : createMaterial(dto as CreateMaterialDto);
      
      await action;
      
      setName('');
      setUnit('');
      setSelected([]);
      setError('');
      
      onSaved?.();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Ошибка при сохранении');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const values = Array.from(e.target.selectedOptions).map(option => +option.value);
    setSelected(values);
  };

  const handleCancel = () => {
    setName('');
    setUnit('');
    setSelected([]);
    setError('');
    onSaved?.();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleSubmit();
    }
  };

  return (
    <div className={`${styles.componentBlock} ${styles.materialFormContainer}`}>
      <div className={styles.blockHeader}>
        <h2 className={styles.blockTitle}>
          {editId ? 'Редактировать материал' : 'Новый материал'}
        </h2>
      </div>
      <div className={styles.blockContent}>
        {error && (
          <div className={styles.errorContainer}>
            <p className={styles.errorText}>{error}</p>
          </div>
        )}

        <div className={styles.formGroup}>
          <input
            className={styles.formInput}
            placeholder="Название материала"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={loading}
            aria-label="Название материала"
          />
        </div>

        <div className={styles.formGroup}>
          <input
            className={styles.formInput}
            placeholder="Единица измерения (кг, м, шт и т.д.)"
            value={unit}
            onChange={e => setUnit(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={loading}
            aria-label="Единица измерения"
          />
        </div>

        <div className={styles.formGroup}>
          {groupsLoading ? (
            <div className={styles.loadingContainer}>
              <div className={styles.loadingSpinner}></div>
              <p className={styles.loadingText}>Загрузка групп...</p>
            </div>
          ) : (
            <>
              <label className={styles.fieldGroupLabel}>
                Группы материалов:
              </label>
              <select
                multiple
                className={`${styles.formSelect} ${styles.materialFormMultiSelect}`}
                value={selected.map(String)}
                onChange={handleSelectChange}
                disabled={loading}
                aria-label="Выберите группы материалов"
              >
                {groups.map(g => (
                  <option key={g.groupId} value={g.groupId}>
                    {g.groupName} ({g.materialsCount || 0} мат.)
                  </option>
                ))}
              </select>
              <p className={styles.listItemSubtitle}>
                Удерживайте Ctrl для выбора нескольких групп
              </p>
            </>
          )}
        </div>

        <div className={styles.buttonGroup}>
          <button
            onClick={handleSubmit}
            disabled={loading || !name.trim() || !unit.trim()}
            className={`${styles.button} ${styles.buttonSuccess} ${styles.buttonMedium}`}
          >
            {loading ? 'Сохраняю...' : 'Сохранить'}
          </button>
          
          {editId && (
            <button
              onClick={handleCancel}
              disabled={loading}
              className={`${styles.button} ${styles.buttonSecondary} ${styles.buttonMedium}`}
            >
              Отмена
            </button>
          )}
        </div>

        <div className={styles.formGroup}>
          <p className={styles.listItemSubtitle}>
            {editId 
              ? 'Редактируйте данные материала и нажмите "Сохранить"' 
              : 'Заполните все поля и нажмите "Сохранить" или Ctrl+Enter'
            }
          </p>
        </div>
      </div>
    </div>
  );
};