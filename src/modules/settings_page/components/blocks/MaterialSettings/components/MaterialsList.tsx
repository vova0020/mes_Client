// ================================================
// src/modules/materials/components/MaterialsList.tsx
// ================================================
import React, { useState, useEffect } from 'react';
import { getMaterials, deleteMaterial } from '../api';
import { Material } from '../types';
import styles from '../MaterialSettings.module.css';

interface MaterialsListProps {
  filterGroupId?: number;
  onMaterialEdit?: (materialId: number) => void;
}

export const MaterialsList: React.FC<MaterialsListProps> = ({ 
  filterGroupId, 
  onMaterialEdit 
}) => {
  const [list, setList] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [deletingId, setDeletingId] = useState<number>();

  const fetch = () => {
    setLoading(true);
    setError('');
    getMaterials(filterGroupId)
      .then(res => {
        setList(res.data);
        setError('');
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(fetch, [filterGroupId]);

  const handleDelete = async (material: Material) => {
    if (!window.confirm(`Удалить материал "${material.materialName}"?`)) {
      return;
    }

    setDeletingId(material.materialId);

    try {
      await deleteMaterial(material.materialId);
      fetch();
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Ошибка при удалении');
    } finally {
      setDeletingId(undefined);
    }
  };

  const handleEdit = (materialId: number) => {
    onMaterialEdit?.(materialId);
  };

  if (loading) {
    return (
      <div className={`${styles.componentBlock} ${styles.materialsListContainer}`}>
        <div className={styles.blockHeader}>
          <h2 className={styles.blockTitle}>
            Материалы
            {filterGroupId && (
              <span className={styles.badge}>Фильтр: группа {filterGroupId}</span>
            )}
          </h2>
        </div>
        <div className={styles.blockContent}>
          <div className={styles.loadingContainer}>
            <div className={styles.loadingSpinner}></div>
            <p className={styles.loadingText}>Загрузка материалов...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${styles.componentBlock} ${styles.materialsListContainer}`}>
        <div className={styles.blockHeader}>
          <h2 className={styles.blockTitle}>Материалы</h2>
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
    <div className={`${styles.componentBlock} ${styles.materialsListContainer}`}>
      <div className={styles.blockHeader}>
        <h2 className={styles.blockTitle}>
          Материалы
          {filterGroupId && (
            <span className={styles.badge}>Фильтр: группа {filterGroupId}</span>
          )}
          <span className={styles.badgeSecondary}>{list.length}</span>
        </h2>
      </div>
      <div className={styles.blockContent}>
        {list.length === 0 ? (
          <div className={styles.loadingContainer}>
            <p className={styles.loadingText}>
              {filterGroupId 
                ? 'В выбранной группе нет материалов' 
                : 'Нет материалов'
              }
            </p>
          </div>
        ) : (
          <ul className={styles.itemList}>
            {list.map((material, index) => (
              <li 
                key={material.materialId} 
                className={`${styles.listItem} ${styles.animatedItem}`}
              >
                <div className={styles.listItemContent}>
                  <div className={styles.listItemInfo}>
                    <h3 className={styles.listItemTitle}>
                      {material.materialName}
                      <span className={styles.badge}>
                        {material.unit}
                      </span>
                    </h3>
                    <p className={styles.listItemSubtitle}>
                      {material.groups && material.groups.length > 0 
                        ? `Группы: ${material.groups.map(g => g.groupName).join(', ')}`
                        : 'Без группы'
                      }
                    </p>
                    <p className={styles.listItemSubtitle}>
                      ID: {material.materialId}
                    </p>
                  </div>
                  <div className={styles.listItemActions}>
                    <button
                      onClick={() => handleEdit(material.materialId)}
                      className={`${styles.button} ${styles.buttonWarning} ${styles.buttonSmall}`}
                      title="Редактировать материал"
                      disabled={deletingId === material.materialId}
                    >
                      ✎
                    </button>
                    <button
                      onClick={() => handleDelete(material)}
                      disabled={deletingId === material.materialId}
                      className={`${styles.button} ${styles.buttonDanger} ${styles.buttonSmall}`}
                      title="Удалить материал"
                    >
                      {deletingId === material.materialId ? '...' : '🗑'}
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}

        {list.length > 0 && (
          <div className={styles.formGroup}>
            <p className={styles.listItemSubtitle}>
              Всего материалов: {list.length}
              {filterGroupId && (
                <>
                  {' '}в группе {filterGroupId}. 
                  <button 
                    onClick={() => window.location.reload()} 
                    className={`${styles.button} ${styles.buttonSecondary} ${styles.buttonSmall}`}
                    style={{ marginLeft: '8px' }}
                  >
                    Показать все
                  </button>
                </>
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};