// ================================================
// src/modules/settings_page/components/blocks/StreamsSettings/components/stages/StagesLevel2List.tsx
// ================================================
import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ProductionStageLevel2 } from '../../types/streams.types';
import { useStagesLevel1, useStagesLevel2, useDeleteStageLevel2 } from '../../hooks/useStreamsQuery';
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

  // Получение списка подэтапов 2 уровня с WebSocket интеграцией
  const { 
    data: substages = [], 
    isLoading, 
    error, 
    refetch,
    isWebSocketConnected
  } = useStagesLevel2();

  // Получение списка этапов 1 уровня для отображения родительских операций
  const { data: parentStages = [] } = useStagesLevel1();

  // Мутация для удаления подэтапа
  const deleteSubstageMutation = useDeleteStageLevel2();

  // Обработчики успешного удаления и ошибки
  const handleDeleteSuccess = () => {
    setDeleteConfirmId(null);
  };

  const handleDeleteError = (error: Error) => {
    alert(`Ошибка удаления подэтапа: ${error.message}`);
  };

  // Создаем map для быстрого поиска родительских операций
  const parentStagesMap = parentStages.reduce((acc, stage) => {
    acc[stage.stageId] = stage;
    return acc;
  }, {} as Record<number, any>);

  // Улучшенная фильтрация подэтапов по поиску
  const filteredSubstages = substages.filter(substage => {
    if (!searchTerm.trim()) return true;
    
    const searchTermLower = searchTerm.toLowerCase().trim();
    const substageName = substage.substageName.toLowerCase();
    const description = substage.description?.toLowerCase() || '';
    const parentStage = parentStagesMap[substage.stageId];
    const parentStageName = parentStage?.stageName.toLowerCase() || '';
    
    // Точное совпадение имеет наивысший приоритет
    if (substageName === searchTermLower || 
        description === searchTermLower || 
        parentStageName === searchTermLower) {
      return true;
    }
    
    // Совпадение с начала строки имеет высокий приоритет
    if (substageName.startsWith(searchTermLower) || 
        description.startsWith(searchTermLower) || 
        parentStageName.startsWith(searchTermLower)) {
      return true;
    }
    
    // Поиск по словам (разделенным пробелами)
    const searchWords = searchTermLower.split(/\s+/).filter(word => word.length > 0);
    const substageWords = substageName.split(/\s+/);
    const descriptionWords = description.split(/\s+/);
    const parentStageWords = parentStageName.split(/\s+/);
    
    // Проверяем, начинается ли какое-то слово в названии, описании или родительской операции с поискового слова
    const hasWordMatch = searchWords.every((searchWord: string) => 
      substageWords.some((word: string) => word.startsWith(searchWord)) ||
      descriptionWords.some((word: string) => word.startsWith(searchWord)) ||
      parentStageWords.some((word: string) => word.startsWith(searchWord))
    );
    
    if (hasWordMatch) {
      return true;
    }
    
    // Если поисковый запрос длинный (больше 2 символов), разрешаем частичное совпадение
    if (searchTermLower.length > 2) {
      return substageName.includes(searchTermLower) || 
             description.includes(searchTermLower) || 
             parentStageName.includes(searchTermLower);
    }
    
    return false;
  });

  const handleDeleteSubstage = (substageId: number) => {
    if (deleteConfirmId === substageId) {
      deleteSubstageMutation.mutate(substageId, {
        onSuccess: handleDeleteSuccess,
        onError: handleDeleteError
      });
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
            {isWebSocketConnected && (
              <span className={styles.realtimeIndicator}> • Live</span>
            )}
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
                         Описание: {substage.description}
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

                  {/* <div className={styles.substageCardStats}>
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
                  </div> */}
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