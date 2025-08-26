// ================================================
// src/modules/settings_page/components/blocks/StreamsSettings/components/stages/StagesLevel1List.tsx
// ================================================
import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ProductionStageLevel1 } from '../../types/streams.types';
import { useStagesLevel1, useDeleteStageLevel1 } from '../../hooks/useStreamsQuery';
import styles from './StagesList.module.css';

interface StagesLevel1ListProps {
  onStageEdit: (stageId: number) => void;
  onCreateSubstage: (stageId: number) => void;
}

export const StagesLevel1List: React.FC<StagesLevel1ListProps> = ({
  onStageEdit,
  onCreateSubstage
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const queryClient = useQueryClient();

  // Получение этапов 1 уровня с WebSocket интеграцией
  const { 
    data: stages, 
    isLoading, 
    error, 
    refetch,
    isWebSocketConnected
  } = useStagesLevel1();

  // Мутация для удаления этапа
  const deleteStageMutation = useDeleteStageLevel1();

  // Обработчик успешного удаления
  const handleDeleteSuccess = () => {
    setDeleteConfirmId(null);
  };

  const handleDeleteError = (error: Error) => {
    alert(`Ошибка удаления операции: ${error.message}`);
  };

  // Улучшенная фильтрация этапов по поиску
  const filteredStages = stages?.filter(stage => {
    if (!searchTerm.trim()) return true;
    
    const searchTermLower = searchTerm.toLowerCase().trim();
    const stageName = stage.stageName.toLowerCase();
    const description = stage.description?.toLowerCase() || '';
    
    // Точное совпадение имеет наивысший приоритет
    if (stageName === searchTermLower || description === searchTermLower) {
      return true;
    }
    
    // Совпадение с начала строки имеет высокий приоритет
    if (stageName.startsWith(searchTermLower) || description.startsWith(searchTermLower)) {
      return true;
    }
    
    // Поиск по словам (разделенным пробелами)
    const searchWords = searchTermLower.split(/\s+/).filter(word => word.length > 0);
    const stageWords = stageName.split(/\s+/);
    const descriptionWords = description.split(/\s+/);
    
    // Проверяем, начинается ли какое-то слово в названии или описании с поискового слова
    const hasWordMatch = searchWords.every((searchWord: string) => 
      stageWords.some((word: string) => word.startsWith(searchWord)) ||
      descriptionWords.some((word: string) => word.startsWith(searchWord))
    );
    
    if (hasWordMatch) {
      return true;
    }
    
    // Если поисковый запрос длинный (больше 2 символов), разрешаем частичное совпадение
    if (searchTermLower.length > 2) {
      return stageName.includes(searchTermLower) || description.includes(searchTermLower);
    }
    
    return false;
  }) || [];

  const handleDeleteStage = (stageId: number) => {
    if (deleteConfirmId === stageId) {
      deleteStageMutation.mutate(stageId, {
        onSuccess: handleDeleteSuccess,
        onError: handleDeleteError
      });
    } else {
      setDeleteConfirmId(stageId);
    }
  };

  const handleCancelDelete = () => {
    setDeleteConfirmId(null);
  };

  if (isLoading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        Загрузка технологических операций...
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
              placeholder="Поиск по названию или описанию..."
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
            Всего операций: <strong>{filteredStages.length}</strong>
            {searchTerm && ` (найдено из ${stages?.length || 0})`}
            {isWebSocketConnected && (
              <span className={styles.realtimeIndicator}> • Live</span>
            )}
          </span>
        </div>
      </div>

      {/* Stages List */}
      <div className={styles.listContent}>
        {filteredStages.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyStateIcon}>⚙️</div>
            <h3 className={styles.emptyStateTitle}>
              {searchTerm ? 'Операции не найдены' : 'Нет технологических операций'}
            </h3>
            <p className={styles.emptyStateDescription}>
              {searchTerm 
                ? 'Попробуйте изменить критерии поиска'
                : 'Создайте первую технологическую операцию для начала работы'
              }
            </p>
          </div>
        ) : (
          <div className={styles.stagesGrid}>
            {filteredStages.map((stage) => (
              <div key={stage.stageId} className={styles.stageCard}>
                <div className={styles.stageCardHeader}>
                  <div className={styles.stageCardInfo}>
                    <h3 className={styles.stageCardTitle}>
                      <span className={styles.stageCardIcon}>
                        {stage.finalStage ? '📦' : '⚙️'}
                      </span>
                      {stage.stageName}
                      {stage.finalStage && (
                        <span className={styles.finalStageBadge}>
                          Финальный
                        </span>
                      )}
                    </h3>
                    {stage.description && (
                      <p className={styles.stageCardDescription}>
                        {stage.description}
                      </p>
                    )}
                  </div>
                  <div className={styles.stageCardActions}>
                    <button
                      onClick={() => onStageEdit(stage.stageId)}
                      className={`${styles.actionButton} ${styles.editButton}`}
                      title="Редактировать"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDeleteStage(stage.stageId)}
                      className={`${styles.actionButton} ${
                        deleteConfirmId === stage.stageId 
                          ? styles.confirmDeleteButton 
                          : styles.deleteButton
                      }`}
                      title={deleteConfirmId === stage.stageId ? "Подтвердить удаление" : "Удалить"}
                      disabled={deleteStageMutation.isPending}
                    >
                      {deleteConfirmId === stage.stageId ? '✓' : '🗑️'}
                    </button>
                    {deleteConfirmId === stage.stageId && (
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

                <div className={styles.stageCardStats}>
                  <div className={styles.statItem}>
                    <span className={styles.statIcon}>🔧</span>
                    <span className={styles.statValue}>
                      {stage.substagesCount || 0}
                    </span>
                    <span className={styles.statLabel}>подэтапов</span>
                  </div>
                  <div className={styles.statItem}>
                    <span className={styles.statIcon}>📅</span>
                    <span className={styles.statValue}>
                      {new Date(stage.createdAt).toLocaleDateString('ru-RU')}
                    </span>
                    <span className={styles.statLabel}>создано</span>
                  </div>
                </div>

                <div className={styles.stageCardFooter}>
                  <button
                    onClick={() => onCreateSubstage(stage.stageId)}
                    className={`${styles.button} ${styles.buttonSecondary} ${styles.buttonSmall}`}
                  >
                    <span className={styles.buttonIcon}>+</span>
                    Добавить подэтап
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Loading indicator for delete operation */}
      {deleteStageMutation.isPending && (
        <div className={styles.operationOverlay}>
          <div className={styles.spinner}></div>
          <p>Удаление операции...</p>
        </div>
      )}
    </div>
  );
};