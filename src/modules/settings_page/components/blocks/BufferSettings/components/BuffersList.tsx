import React, { useState } from 'react';
import { BufferResponse } from '../types/buffers.types';
import { useBuffers, useDeleteBuffer, useCopyBuffer } from '../hooks/useBuffersQuery';

import styles from './BuffersList.module.css';

interface BuffersListProps {
  onSelectBuffer?: (buffer: BufferResponse) => void;
  onEditBuffer?: (bufferId: number) => void; 
  onBufferDeleted?: (bufferId: number) => void;
  selectedBufferId?: number;
}

const BuffersList: React.FC<BuffersListProps> = ({
  onSelectBuffer,
  onEditBuffer,
  onBufferDeleted,
  selectedBufferId
}) => {
  const [copyingBufferId, setCopyingBufferId] = useState<number | null>(null);
  const [copyFormData, setCopyFormData] = useState({
    newBufferName: '',
    newLocation: '',
    copyCells: true,
    copyStages: true
  });

  const { data: buffers = [], isLoading, error } = useBuffers();
  const deleteBufferMutation = useDeleteBuffer();
  const copyBufferMutation = useCopyBuffer();



  const handleDeleteBuffer = async (bufferId: number, bufferName: string) => {
    if (window.confirm(`Вы уверены, что хотите удалить буфер "${bufferName}"?`)) {
      try {
        await deleteBufferMutation.mutateAsync(bufferId);
        onBufferDeleted?.(bufferId);
      } catch (error) {
        console.error('Ошибка при удалении буфера:', error);
        alert('Ошибка при удалении буфера');
      }
    }
  };

  const handleCopyBuffer = (bufferId: number, bufferName: string) => {
    setCopyingBufferId(bufferId);
    setCopyFormData({
      newBufferName: `${bufferName} (копия)`,
      newLocation: '',
      copyCells: true,
      copyStages: true
    });
  };

  const handleConfirmCopy = async () => {
    if (!copyingBufferId) return;

    try {
      await copyBufferMutation.mutateAsync({
        id: copyingBufferId,
        data: copyFormData
      });
      setCopyingBufferId(null);
      setCopyFormData({
        newBufferName: '',
        newLocation: '',
        copyCells: true,
        copyStages: true
      });
    } catch (error) {
      console.error('Ошибка при копировании буфера:', error);
      alert('Ошибка при копировании буфера');
    }
  };

  const handleCancelCopy = () => {
    setCopyingBufferId(null);
    setCopyFormData({
      newBufferName: '',
      newLocation: '',
      copyCells: true,
      copyStages: true
    });
  };

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        Загрузка буферов...
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.emptyStateIcon}>⚠️</div>
        <div className={styles.emptyStateTitle}>Ошибка загрузки</div>
        <div className={styles.emptyStateDescription}>
          Не удалось загрузить список буферов
        </div>
      </div>
    );
  }

  if (buffers.length === 0) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyStateIcon}>📦</div>
        <div className={styles.emptyStateTitle}>Б��феры не найдены</div>
        <div className={styles.emptyStateDescription}>
          Создайте первый буфер для начала работы
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>Буферы</h3>
        <div className={styles.stats}>
          Всего: {buffers.length}
        </div>
      </div>

      <div className={styles.list}>
        {buffers.map((buffer) => (
          <div
            key={buffer.bufferId}
            className={`${styles.item} ${
              selectedBufferId === buffer.bufferId ? styles.selected : ''
            }`}
            onClick={() => onSelectBuffer?.(buffer)}
          >
            <div className={styles.itemContent}>
              <div className={styles.itemHeader}>
                <h4 className={styles.itemTitle}>{buffer.bufferName}</h4>
                <div className={styles.itemActions}>
                  <button
                    className={`${styles.actionButton} ${styles.editButton}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditBuffer?.(buffer.bufferId);
                    }}
                    title="Редактировать"
                  >
                    ✏️
                  </button>
                  <button
                    className={`${styles.actionButton} ${styles.copyButton}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopyBuffer(buffer.bufferId, buffer.bufferName);
                    }}
                    title="Копировать"
                  >
                    📋
                  </button>
                  <button
                    className={`${styles.actionButton} ${styles.deleteButton}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteBuffer(buffer.bufferId, buffer.bufferName);
                    }}
                    title="Удалить"
                    disabled={deleteBufferMutation.isPending}
                  >
                    🗑️
                  </button>
                </div>
              </div>
              
              <div className={styles.itemDetails}>
                <div className={styles.location}>
                  📍 {buffer.location}
                </div>
                {buffer.description && (
                  <div className={styles.description}>
                    {buffer.description}
                  </div>
                )}
                <div className={styles.itemStats}>
                  <span className={styles.statBadge}>
                    Ячеек: {buffer.cellsCount}
                  </span>
                  <span className={styles.statBadge}>
                    Этапов: {buffer.stagesCount}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Copy Modal */}
      {copyingBufferId && (
        <div className={styles.modalOverlay} onClick={handleCancelCopy}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Копирование буфера</h3>
            </div>
            
            <div className={styles.modalBody}>
              <div className={styles.field}>
                <label>Название нового буфера:</label>
                <input
                  type="text"
                  value={copyFormData.newBufferName}
                  onChange={(e) => setCopyFormData(prev => ({
                    ...prev,
                    newBufferName: e.target.value
                  }))}
                  placeholder="Введите название"
                />
              </div>
              
              <div className={styles.field}>
                <label>Новое местоположение:</label>
                <input
                  type="text"
                  value={copyFormData.newLocation}
                  onChange={(e) => setCopyFormData(prev => ({
                    ...prev,
                    newLocation: e.target.value
                  }))}
                  placeholder="Введите местоположение (опционально)"
                />
              </div>

              <div className={styles.checkboxGroup}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={copyFormData.copyCells}
                    onChange={(e) => setCopyFormData(prev => ({
                      ...prev,
                      copyCells: e.target.checked
                    }))}
                  />
                  Копировать ячейки
                </label>
                
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={copyFormData.copyStages}
                    onChange={(e) => setCopyFormData(prev => ({
                      ...prev,
                      copyStages: e.target.checked
                    }))}
                  />
                  Копировать этапы
                </label>
              </div>
            </div>

            <div className={styles.modalActions}>
              <button
                className={`${styles.button} ${styles.buttonPrimary}`}
                onClick={handleConfirmCopy}
                disabled={!copyFormData.newBufferName || copyBufferMutation.isPending}
              >
                {copyBufferMutation.isPending ? 'Копирование...' : 'Копировать'}
              </button>
              <button
                className={`${styles.button} ${styles.buttonSecondary}`}
                onClick={handleCancelCopy}
                disabled={copyBufferMutation.isPending}
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BuffersList;