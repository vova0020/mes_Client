// ================================================
// src/modules/settings_page/components/blocks/StreamsSettings/components/stages/StagesLevel2List.tsx
// ================================================
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { streamsApi } from '../../api/streamsApi';
import { ProductionStageLevel2 } from '../../types/streams.types';
import styles from './StagesList.module.css';

interface StagesLevel2ListProps {
  onSubstageEdit: (substageId: number) => void;
  onCreateNew?: (preselectedStageId?: number) => void;
}

export const StagesLevel2List: React.FC<StagesLevel2ListProps> = ({ 
  onSubstageEdit, 
  onCreateNew 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const queryClient = useQueryClient();

  // Получение списка подэтапов 2 уровня
  const { 
    data: substages = [], 
    isLoading, 
    error, 
    refetch 
  } = useQuery({
    queryKey: ['production-stages-level2'],
    queryFn: () => streamsApi.getProductionStagesLevel2(),
  });

  // Получение списка этапов 1 уровня для отображения родительских операций
  const { data: parentStages = [] } = useQuery({
    queryKey: ['production-stages-level1'],
    queryFn: () => streamsApi.getProductionStagesLevel1(),
  });

  // Мутация для удаления подэтапа
  const deleteSubstageMutation = useMutation({
    mutationFn: (substageId: number) => streamsApi.deleteProductionStageLevel2(substageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['production-stages-level2'] });
      queryClient.invalidateQueries({ queryKey: ['production-stages-level1'] }); // Обновляем счетчики
      setDeleteConfirmId(null);
    },
    onError: (error: Error) => {
      alert(`Ошибка удаления подэтапа: ${error.message}`);
    }
  });

  // Создаем map для быстрого поиска родительских операций
  const parentStagesMap = parentStages.reduce((acc, stage) => {
    acc[stage.stageId] = stage;
    return acc;
  }, {} as Record<number, any>);

  // Фильтрация подэтапов по поиску
  const filteredSubstages = substages.filter(substage => {
    const parentStage = parentStagesMap[substage.stageId];
    const searchLower = searchTerm.toLowerCase();
    
    return substage.substageName.toLowerCase().includes(searchLower) ||
           substage.description?.toLowerCase().includes(searchLower) ||
           parentStage?.stageName.toLowerCase().includes(searchLower);
  });

  const handleDeleteSubstage = (substageId: number) => {
    if (deleteConfirmId === substageId) {
      deleteSubstageMutation.mutate(substageId);
    } else {
      setDeleteConfirmId(substageId);
    }
  };

  const handleCancelDelete = () => {
    setDeleteConfirmId(null);
  };

  if (isLoading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        Загрузка подэтапов операций...
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.error}>
        <div className={styles.errorContent}>
          <h3>Ошибка загрузки</h3>
          <p>{error instanceof Error ? error.message : 'Неизвестная ошибка'}</p>
          <button onClick={() => refetch()} className={styles.retryButton}>
            Повторить попытку
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.listContainer}>
      {/* Search and Filters */}
      <div className={styles.listHeader}>
        <div className={styles.searchSection}>
          <div className={styles.searchInputGroup}>
            <span className={styles.searchIcon}>🔍</span>
            <input
              type="text"
              placeholder="Поиск по названию подэтапа, описанию или родительской операции..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className={styles.clearSearchButton}
              >
                ✕
              </button>
            )}
          </div>
        </div>
        
        <div className={styles.listStats}>
          <span className={styles.statsText}>
            Всего подэтапов: <strong>{filteredSubstages.length}</strong>
            {searchTerm && ` (найдено из ${substages.length})`}
          </span>
        </div>
      </div>

      {/* Substages List */}
      <div className={styles.listContent}>
        {filteredSubstages.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyStateIcon}>🔧</div>
            <h3 className={styles.emptyStateTitle}>
              {searchTerm ? 'Подэтапы не найдены' : 'Нет подэтапов операций'}
            </h3>
            <p className={styles.emptyStateDescription}>
              {searchTerm 
                ? 'Попробуйте изменить критерии поиска'
                : 'Создайте первый подэтап для начала работы'
              }
            </p>
          </div>
        ) : (
          <div className={styles.substagesGrid}>
            {filteredSubstages.map((substage) => {
              const parentStage = parentStagesMap[substage.stageId];
              
              return (
                <div key={substage.substageId} className={styles.substageCard}>
                  <div className={styles.substageCardHeader}>
                    <div className={styles.substageCardInfo}>
                      {/* Родительская операция */}
                      <div className={styles.substageParent}>
                        <span className={styles.parentIcon}>⚙️</span>
                        <span className={styles.parentName}>
                          {parentStage?.stageName || `ID: ${substage.stageId}`}
                        </span>
                      </div>
                      
                      {/* Название подэтапа */}
                      <h3 className={styles.substageCardTitle}>
                        <span className={styles.substageCardIcon}>🔧</span>
                        {substage.substageName}
                      </h3>
                      
                      {/* Описание подэтапа */}
                      {substage.description && (
                        <p className={styles.substageCardDescription}>
                          {substage.description}
                        </p>
                      )}
                    </div>
                    
                    <div className={styles.substageCardActions}>
                      <button
                        onClick={() => onSubstageEdit(substage.substageId)}
                        className={`${styles.actionButton} ${styles.editButton}`}
                        title="Редактировать"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDeleteSubstage(substage.substageId)}
                        className={`${styles.actionButton} ${
                          deleteConfirmId === substage.substageId 
                            ? styles.confirmDeleteButton 
                            : styles.deleteButton
                        }`}
                        title={deleteConfirmId === substage.substageId ? "Подтвердить удаление" : "Удалить"}
                        disabled={deleteSubstageMutation.isPending}
                      >
                        {deleteConfirmId === substage.substageId ? '✓' : '🗑️'}
                      </button>
                      {deleteConfirmId === substage.substageId && (
                        <button
                          onClick={handleCancelDelete}
                          className={`${styles.actionButton} ${styles.cancelButton}`}
                          title="Отменить удаление"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>

                  <div className={styles.substageCardStats}>
                    <div className={styles.statItem}>
                      <span className={styles.statIcon}>📏</span>
                      <span className={styles.statValue}>
                        {substage.allowance} мм
                      </span>
                      <span className={styles.statLabel}>допуск</span>
                    </div>
                    <div className={styles.statItem}>
                      <span className={styles.statIcon}>🆔</span>
                      <span className={styles.statValue}>
                        {substage.substageId}
                      </span>
                      <span className={styles.statLabel}>ID родителя</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Loading indicator for delete operation */}
      {deleteSubstageMutation.isPending && (
        <div className={styles.operationOverlay}>
          <div className={styles.spinner}></div>
          <p>Удаление подэтапа...</p>
        </div>
      )}
    </div>
  );
};