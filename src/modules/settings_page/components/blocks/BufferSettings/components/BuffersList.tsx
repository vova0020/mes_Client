import React, { useState } from 'react';
import { BufferResponse } from '../types/buffers.types';
import { useBuffers, useDeleteBuffer, useCopyBuffer } from '../hooks/useBuffersQuery';
import { useBuffersSocket } from '../hooks/useBuffersSocket';
import styles from './BuffersList.module.css';

interface BuffersListProps {
  onSelectBuffer?: (buffer: BufferResponse) => void;
  onEditBuffer?: (buffer: BufferResponse) => void; 
  selectedBufferId?: number;
}

const BuffersList: React.FC<BuffersListProps> = ({
  onSelectBuffer,
  onEditBuffer,
  selectedBufferId
}) => {
  const [copyingBufferId, setCopyingBufferId] = useState<number | null>(null);
  const [copyFormData, setCopyFormData] = useState({
    newBufferName: '',
    newLocation: '',
    copyCells: true,
    copyStages: true
  });

  const { data: buffers, isLoading, error } = useBuffers();
  const deleteBufferMutation = useDeleteBuffer();
  const copyBufferMutation = useCopyBuffer();

  // Подключаем WebSocket
  useBuffersSocket();

  const handleDeleteBuffer = async (bufferId: number) => {
    if (window.confirm('Вы уверены, что хотите удалить этот буфер?')) {
      try {
        await deleteBufferMutation.mutateAsync(bufferId);
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
    return <div className={styles.loading}>Загрузка буферов...</div>;
  }

  if (error) {
    return <div className={styles.error}>Ошибка при загрузке буферов</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3>Список буферов</h3>
        <div className={styles.stats}>
          Всего буферов: {buffers?.length || 0}
        </div>
      </div>

      <div className={styles.list}>
        {buffers?.map((buffer) => (
          <div
            key={buffer.bufferId}
            className={`${styles.item} ${
              selectedBufferId === buffer.bufferId ? styles.selected : ''
            }`}
            onClick={() => onSelectBuffer?.(buffer)}
          >
            <div className={styles.itemContent}>
              <div className={styles.itemHeader}>
                <h4>{buffer.bufferName}</h4>
                <div className={styles.actions}>
                  <button
                    className={styles.editButton}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditBuffer?.(buffer);
                    }}
                    title="Редактировать"
                  >
                    ✏️
                  </button>
                  <button
                    className={styles.copyButton}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopyBuffer(buffer.bufferId, buffer.bufferName);
                    }}
                    title="Копировать"
                  >
                    📋
                  </button>
                  <button
                    className={styles.deleteButton}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteBuffer(buffer.bufferId);
                    }}
                    title="Удалить"
                    disabled={deleteBufferMutation.isPending}
                  >
                    🗑️
                  </button>
                </div>
              </div>
              
              <div className={styles.itemInfo}>
                <div className={styles.location}>📍 {buffer.location}</div>
                {buffer.description && (
                  <div className={styles.description}>{buffer.description}</div>
                )}
                <div className={styles.stats}>
                  <span>Ячеек: {buffer.cellsCount}</span>
                  <span>Этапов: {buffer.stagesCount}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {copyingBufferId && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h3>Копирование буфера</h3>
            <div className={styles.form}>
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
                <label>Новое местоположение (опционально):</label>
                <input
                  type="text"
                  value={copyFormData.newLocation}
                  onChange={(e) => setCopyFormData(prev => ({
                    ...prev,
                    newLocation: e.target.value
                  }))}
                  placeholder="Введите местоположение"
                />
              </div>

              <div className={styles.checkboxGroup}>
                <label>
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
                
                <label>
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

              <div className={styles.buttons}>
                <button
                  className={styles.confirmButton}
                  onClick={handleConfirmCopy}
                  disabled={!copyFormData.newBufferName || copyBufferMutation.isPending}
                >
                  {copyBufferMutation.isPending ? 'Копирование...' : 'Копировать'}
                </button>
                <button
                  className={styles.cancelButton}
                  onClick={handleCancelCopy}
                  disabled={copyBufferMutation.isPending}
                >
                  Отмена
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BuffersList;