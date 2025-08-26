import React, { useState } from 'react';
import { useMaterials, useDeleteMaterial } from '../api';

import { Material } from '../types';
import styles from './MaterialsList.module.css';
import socketStyles from '../../../../../../styles/SocketStyles.module.css';
interface MaterialsListProps {
  filterGroupId?: number;
  onMaterialEdit?: (materialId: number) => void;
  onClearFilter?: () => void;
}

export const MaterialsList: React.FC<MaterialsListProps> = ({ 
  filterGroupId, 
  onMaterialEdit,
  onClearFilter
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  // React Query хуки
  const { data: materials = [], isLoading: loading, error } = useMaterials(filterGroupId);
  const deleteMutation = useDeleteMaterial();



  const handleDelete = async (material: Material) => {
    if (!window.confirm(`Удалить материал "${material.materialName}"?`)) {
      return;
    }

    try {
      await deleteMutation.mutateAsync(material.materialId);
      // Данные автоматически обновятся благодаря React Query и Socket.IO
    } catch (err: any) {
      console.error('Ошибка удаления материала:', err);
    }
  };

  const handleEdit = (materialId: number) => {
    onMaterialEdit?.(materialId);
  };

  // Filter materials by search term
  const filteredMaterials = materials.filter(material =>
    material.materialName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    material.unit.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (material.article && material.article.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getFilteredGroupName = () => {
    if (!filterGroupId || materials.length === 0) return null;
    const firstMaterial = materials[0];
    const group = firstMaterial.groups?.find(g => g.groupId === filterGroupId);
    return group?.groupName || `Группа ${filterGroupId}`;
  };

  const isDeletingId = deleteMutation.isPending ? deleteMutation.variables : null;

  if (loading) {
    return (
      <div className={styles.materialsCard}>
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>
            <span className={styles.cardIcon}>📋</span>
            Материалы
            {/* Socket.IO индикатор */}
           
          </h2>
        </div>
        <div className={styles.cardContent}>
          <div className={styles.loadingState}>
            <div className={styles.spinner}></div>
            <p>Загрузка материалов...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.materialsCard}>
      <div className={styles.cardHeader}>
        <div className={styles.cardTitleSection}>
          <h2 className={styles.cardTitle}>
            <span className={styles.cardIcon}>📋</span>
            Материалы
            {/* Socket.IO индикатор */}
            {/* <span 
              className={`${socketStyles.connectionDot} ${isConnected ? socketStyles.connected : socketStyles.disconnected}`}
              title={isConnected ? 'Подключено к серверу' : 'Отключено от сервера'}
            /> */}
          </h2>
          {filterGroupId && (
            <div className={styles.filterInfo}>
              <span className={styles.filterLabel}>Группа:</span>
              <span className={styles.filterValue}>{getFilteredGroupName()}</span>
              <button
                onClick={onClearFilter}
                className={`${styles.button} ${styles.buttonSecondary} ${styles.buttonMini}`}
                title="Показать все материалы"
              >
                ×
              </button>
            </div>
          )}
        </div>
        <div className={styles.badgeGroup}>
          <span className={styles.badge}>{filteredMaterials.length}</span>
          {/* {isConnected && (
            <span className={socketStyles.realtimeBadge} title="Обновления в реальном времени">
              🔄
            </span>
          )} */}
        </div>
      </div>

      <div className={styles.cardContent}>
        {/* Search and Controls */}
        <div className={styles.materialsControls}>
          <div className={styles.searchBox}>
            <span className={styles.searchIcon}>🔍</span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Поиск по артикулу, названию или единице измерения..."
              className={styles.searchInput}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className={styles.searchClear}
              >
                ×
              </button>
            )}
          </div>
          
          {/* Real-time status */}
         
        </div>

        {/* Error Message */}
        {(error || deleteMutation.error ) && (
          <div className={styles.errorMessage}>
            <span className={styles.errorIcon}>⚠️</span>
            {error?.message || deleteMutation.error?.message || 'Произошла ошибка'}
          </div>
        )}

        {/* Materials Table */}
        {filteredMaterials.length === 0 ? (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>📦</span>
            {searchTerm ? (
              <p>Материалы не найдены по запросу "{searchTerm}"</p>
            ) : filterGroupId ? (
              <p>В выбранной группе нет материалов</p>
            ) : (
              <p>Нет созданных материалов</p>
            )}
            <p className={styles.emptySubtext}>
              {!filterGroupId && !searchTerm && 'Создайте первый материал для начала работы'}
            </p>
          </div>
        ) : (
          <div className={styles.materialsTable}>
            <div className={styles.tableHeader}>
              <div className={styles.tableHeaderCell}>Артикул</div>
              <div className={styles.tableHeaderCell}>Название</div>
              <div className={styles.tableHeaderCell}>Единица</div>
              <div className={styles.tableHeaderCell}>Группы</div>
              <div className={styles.tableHeaderCell}>Действия</div>
            </div>
            <div className={styles.tableBody}>
              {filteredMaterials.map((material) => (
                <div
                  key={material.materialId}
                  className={`${styles.tableRow} ${
                    isDeletingId === material.materialId ? styles.tableRowProcessing : ''
                  }`}
                >
                  {/* Артикул */}
                  <div className={styles.tableCell}>
                    <div className={styles.materialArticle}>
                      {material.article || 'Не указан'}
                    </div>
                  </div>
                  
                  {/* Название */}
                  <div className={styles.tableCell}>
                    <div className={styles.materialName}>
                      {material.materialName}
                    </div>
                  </div>
                  
                  {/* Единица измерения */}
                  <div className={styles.tableCell}>
                    <span className={styles.unitBadge}>
                      {material.unit}
                    </span>
                  </div>
                  
                  {/* Группы */}
                  <div className={styles.tableCell}>
                    <div className={styles.groupTags}>
                      {material.groups && material.groups.length > 0 ? (
                        material.groups.map((group) => (
                          <span key={group.groupId} className={styles.groupTag}>
                            {group.groupName}
                          </span>
                        ))
                      ) : (
                        <span className={styles.noGroups}>Без группы</span>
                      )}
                    </div>
                  </div>
                  
                  {/* Действия */}
                  <div className={styles.tableCell}>
                    <div className={styles.tableActions}>
                      <button
                        onClick={() => handleEdit(material.materialId)}
                        className={`${styles.button} ${styles.buttonWarning} ${styles.buttonSmall}`}
                        disabled={isDeletingId === material.materialId}
                        title="Редактировать материал"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDelete(material)}
                        disabled={isDeletingId === material.materialId}
                        className={`${styles.button} ${styles.buttonDanger} ${styles.buttonSmall}`}
                        title="Удалить материал"
                      >
                        {isDeletingId === material.materialId ? (
                          <span className={styles.buttonSpinner}></span>
                        ) : (
                          '🗑️'
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Summary */}
        {filteredMaterials.length > 0 && (
          <div className={styles.tableSummary}>
            Показано {filteredMaterials.length} из {materials.length} материалов
            {searchTerm && (
              <span className={styles.searchSummary}>
                {' '}по запросу "{searchTerm}"
              </span>
            )}
            
          </div>
        )}
      </div>
    </div>
  );
};