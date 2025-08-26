import React, { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BufferResponse, BufferDetailResponse } from './types/buffers.types';
import BuffersList from './components/BuffersList';
import BufferForm from './components/BufferForm';
import BufferDetail from './components/BufferDetail';
import { useBuffersStatistics } from './hooks/useBuffersQuery';
import styles from './BufferSettings.module.css';

// Создаем Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 5, // 5 минут
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

const BufferSettingsContent: React.FC = () => {
  const [selectedBuffer, setSelectedBuffer] = useState<BufferResponse | null>(null);
  const [editBufferId, setEditBufferId] = useState<number>();
  const [showForm, setShowForm] = useState(false);



  const { 
    data: statistics, 
    isLoading: statisticsLoading, 
    error: statisticsError 
  } = useBuffersStatistics();

  const handleSelectBuffer = (buffer: BufferResponse) => {
    console.log('[BufferSettings] Выбран буфер:', buffer);
    setSelectedBuffer(buffer);
  };

  const handleEditBuffer = (bufferId: number) => {
    setEditBufferId(bufferId);
    setShowForm(true);
  };

  const handleCreateBuffer = () => {
    setEditBufferId(undefined);
    setShowForm(true);
  };

  const handleBufferSaved = () => {
    setEditBufferId(undefined);
    setShowForm(false);
    // Данные автоматически обновятся благодаря React Query и Socket.IO
  };

  const handleCancelEdit = () => {
    setEditBufferId(undefined);
    setShowForm(false);
  };

  const handleBufferDeleted = (deletedBufferId: number) => {
    // Если удаленный буфер был выбран, сбрасываем выбор
    if (selectedBuffer?.bufferId === deletedBufferId) {
      setSelectedBuffer(null);
    }
  };

  // Callback для обновления выбранного буфера после изменений
  const handleBufferUpdated = (updatedBuffer: BufferResponse) => {
    console.log('[BufferSettings] Получено обновление буфера:', updatedBuffer);
    if (selectedBuffer?.bufferId === updatedBuffer.bufferId) {
      setSelectedBuffer(updatedBuffer);
    }
  };

  const renderStatistics = () => {
    if (statisticsLoading) {
      return (
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          Загрузка статистики...
        </div>
      );
    }

    if (statisticsError || !statistics) {
      return null;
    }

    return (
      <div className={styles.statsContainer}>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{statistics.buffers}</div>
          <div className={styles.statLabel}>Буферов</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{statistics.bufferCells}</div>
          <div className={styles.statLabel}>Ячеек</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{statistics.availableCells}</div>
          <div className={styles.statLabel}>Доступно</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{statistics.occupiedCells}</div>
          <div className={styles.statLabel}>Занято</div>
        </div>
      </div>
    );
  };

  return (
    <div className={styles.pageContainer}>


      {/* Header */}
      <div className={styles.pageHeader}>
        <div className={styles.pageHeaderContent}>
          <h1 className={styles.pageTitle}>
            <span className={styles.pageTitleIcon}>📦</span>
            Управление буферами
          </h1>
          <p className={styles.pageSubtitle}>
            Настройка буферов, их ячеек и связей с этапами производства

          </p>
          {renderStatistics()}
        </div>
        <div className={styles.pageHeaderActions}>
          <button
            onClick={handleCreateBuffer}
            className={`${styles.button} ${styles.buttonPrimary} ${styles.buttonLarge}`}
          >
            <span className={styles.buttonIcon}>+</span>
            Создать буфер
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className={styles.mainContent}>
        {/* Left Panel - Buffers List */}
        <div className={styles.leftPanel}>
          <BuffersList 
            onSelectBuffer={handleSelectBuffer}
            onEditBuffer={handleEditBuffer}
            onBufferDeleted={handleBufferDeleted}
            selectedBufferId={selectedBuffer?.bufferId}
          />
        </div>

        {/* Right Panel - Buffer Details */}
        <div className={styles.rightPanel}>
          <BufferDetail 
            selectedBuffer={selectedBuffer}
            onBufferUpdated={handleBufferUpdated}
          />
        </div>
      </div>

      {/* Buffer Form Modal */}
      {showForm && (
        <div className={styles.modalOverlay} onClick={handleCancelEdit}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <BufferForm 
              editId={editBufferId} 
              onSaved={handleBufferSaved}
              onCancel={handleCancelEdit}
            />
          </div>
        </div>
      )}
    </div>
  );
};

const BufferSettings: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BufferSettingsContent />
    </QueryClientProvider>
  );
};

export default BufferSettings;