// ================================================
// src/modules/settings_page/components/blocks/StreamsSettings/components/StreamsList.tsx
// ================================================
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { streamsApi } from '../api/streamsApi';
import { ProductionLine } from '../types/streams.types';
import { Material } from '../types/materials.types';
import styles from './StreamsList.module.css';

interface StreamsListProps {
  onStreamEdit: (streamId: number) => void;
}

// Хук для получения материалов конкретного потока
const useStreamMaterials = (streamId: number) => {
  return useQuery<Material[], Error>({
    queryKey: ['stream-materials', streamId],
    queryFn: () => streamsApi.getStreamMaterials(streamId),
    staleTime: 1000 * 60 * 2, // 2 минуты
  });
};

// Хук для получения этапов конкретного поток��
const useStreamStages = (streamId: number) => {
  return useQuery<any[], Error>({
    queryKey: ['stream-stages', streamId],
    queryFn: () => streamsApi.getStreamStages(streamId),
    staleTime: 1000 * 60 * 2, // 2 минуты
  });
};

// Компонент карточки потока с автообновляющимися данными
const StreamCard: React.FC<{
  stream: ProductionLine;
  onEdit: (streamId: number) => void;
  onDelete: (streamId: number) => void;
  isDeleteConfirm: boolean;
  onCancelDelete: () => void;
}> = ({ stream, onEdit, onDelete, isDeleteConfirm, onCancelDelete }) => {
  // Получаем актуальные данные о материалах и этапах
  const { data: materials = [] } = useStreamMaterials(stream.lineId);
  const { data: stages = [] } = useStreamStages(stream.lineId);

  return (
    <div key={stream.lineId} className={styles.streamCard}>
      <div className={styles.streamInfo}>
        <div className={styles.streamHeader}>
          <h3 className={styles.streamName}>{stream.lineName}</h3>
          <span className={styles.streamType}>{stream.lineType}</span>
        </div>

        <div className={styles.streamDetails}>
          <div className={styles.materialsInfo}>
            <span className={styles.materialsLabel}>Материалы:</span>
            <span className={styles.materialsCount}>
              {materials.length} шт.
            </span>
          </div>

          <div className={styles.stagesInfo}>
            <span className={styles.stagesLabel}>Этапы:</span>
            <span className={styles.stagesCount}>
              {stages.length} шт.
            </span>
          </div>
        </div>

        {/* Materials Preview */}
        {materials.length > 0 && (
          <div className={styles.materialsPreview}>
            <span className={styles.previewLabel}>Привязанные материалы:</span>
            <div className={styles.materialsTags}>
              {materials.slice(0, 3).map((material) => (
                <span key={material.materialId} className={styles.materialTag}>
                  {material.materialName}
                </span>
              ))}
              {materials.length > 3 && (
                <span className={styles.materialTag}>
                  +{materials.length - 3} еще
                </span>
              )}
            </div>
          </div>
        )}

        {/* Stages Preview */}
        {stages.length > 0 && (
          <div className={styles.stagesPreview}>
            <span className={styles.previewLabel}>Привязанные этапы:</span>
            <div className={styles.stagesTags}>
              {stages.slice(0, 3).map((stage, index, arr) => (
                <span key={stage.stageId} className={styles.stageTag}>
                  {stage.stageName}{index < arr.length - 1 ? ',\u00A0' : ''}
                </span>
              ))}
              {stages.length > 3 && (
                <span className={styles.stageTag}>
                  +{stages.length - 3} еще
                </span>
              )}
            </div>
          </div>

        )}
      </div>

      <div className={styles.streamActions}>
        <button
          onClick={() => onEdit(stream.lineId)}
          className={`${styles.actionButton} ${styles.editButton}`}
          title="Редактировать поток"
        >
          ✏️
        </button>

        <button
          onClick={() => onDelete(stream.lineId)}
          className={`${styles.actionButton} ${isDeleteConfirm
              ? styles.confirmDeleteButton
              : styles.deleteButton
            }`}
          title={
            isDeleteConfirm
              ? "Подтвердить удаление"
              : "Удалить поток"
          }
        >
          {isDeleteConfirm ? '✓' : '🗑️'}
        </button>

        {isDeleteConfirm && (
          <button
            onClick={onCancelDelete}
            className={`${styles.actionButton} ${styles.cancelButton}`}
            title="Отменить удаление"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
};

export const StreamsList: React.FC<StreamsListProps> = ({ onStreamEdit }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const queryClient = useQueryClient();

  // Получение списка потоков с правильной типизацией
  const {
    data: streams = [],
    isLoading,
    error
  } = useQuery<ProductionLine[], Error>({
    queryKey: ['streams'],
    queryFn: () => streamsApi.getStreams(),
    staleTime: 1000 * 60 * 2, // 2 минуты
  });

  // Мутация для удаления потока
  const deleteMutation = useMutation({
    mutationFn: streamsApi.deleteStream,
    onSuccess: (_, streamId) => {
      // Инвалидируем основной кеш потоков
      queryClient.invalidateQueries({ queryKey: ['streams'] });

      // Удаляем кеш материалов и этапов удаленного потока
      queryClient.removeQueries({ queryKey: ['stream-materials', streamId] });
      queryClient.removeQueries({ queryKey: ['stream-stages', streamId] });
      queryClient.removeQueries({ queryKey: ['stream', streamId] });

      setDeleteConfirmId(null);
    },
  });

  // Фильтрация потоков по поисковому запросу
  const filteredStreams = streams.filter((stream: ProductionLine) =>
    stream.lineName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    stream.lineType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = (streamId: number) => {
    if (deleteConfirmId === streamId) {
      deleteMutation.mutate(streamId);
    } else {
      setDeleteConfirmId(streamId);
    }
  };

  const handleCancelDelete = () => {
    setDeleteConfirmId(null);
  };

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Загрузка потоков...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <p>Ошибка загрузки потоков: {error.message}</p>
        <button
          onClick={() => queryClient.invalidateQueries({ queryKey: ['streams'] })}
          className={styles.retryButton}
        >
          Повторить
        </button>
      </div>
    );
  }

  return (
    <div className={styles.streamsListContainer}>
      {/* Header with search */}
      <div className={styles.listHeader}>
        <div className={styles.searchContainer}>
          <input
            type="text"
            placeholder="Поиск по названию или типу потока..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
          <span className={styles.searchIcon}>🔍</span>
        </div>
        <div className={styles.resultsCount}>
          Найдено: {filteredStreams.length} из {streams.length}
        </div>
      </div>

      {/* Streams List */}
      <div className={styles.streamsList}>
        {filteredStreams.length === 0 ? (
          <div className={styles.emptyState}>
            <p>
              {searchTerm
                ? 'По вашему запросу потоки не найдены'
                : 'Потоки не созданы'
              }
            </p>
          </div>
        ) : (
          filteredStreams.map((stream: ProductionLine) => (
            <StreamCard
              key={stream.lineId}
              stream={stream}
              onEdit={onStreamEdit}
              onDelete={handleDelete}
              isDeleteConfirm={deleteConfirmId === stream.lineId}
              onCancelDelete={handleCancelDelete}
            />
          ))
        )}
      </div>

      {/* Loading indicator for delete operation */}
      {deleteMutation.isPending && (
        <div className={styles.operationOverlay}>
          <div className={styles.spinner}></div>
          <p>Удаление потока...</p>
        </div>
      )}
    </div>
  );
};