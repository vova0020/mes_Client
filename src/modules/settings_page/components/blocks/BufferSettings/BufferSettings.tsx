import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SocketProvider } from '../../../../../contexts/SocketContext';
import { BufferResponse, BufferDetailResponse } from './types/buffers.types';
import BuffersList from './components/BuffersList';
import BufferForm from './components/BufferForm';
import BufferDetail from './components/BufferDetail';
import { useBuffersStatistics } from './hooks/useBuffersQuery';
import { useBuffersSocket } from './hooks/useBuffersSocket';
import styles from './BufferSettings.module.css';

type ViewMode = 'list' | 'create' | 'edit' | 'detail';

interface BufferSettingsState {
  viewMode: ViewMode;
  selectedBuffer?: BufferResponse | BufferDetailResponse;
}

// Создаем локальный QueryClient для BufferSettings
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 1000 * 60 * 5, // 5 минут
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

// Внутренний компонент с хуками React Query и Socket
const BufferSettingsContent: React.FC = () => {
  const [state, setState] = useState<BufferSettingsState>({
    viewMode: 'list'
  });

  // Подключаем WebSocket для real-time обновлений
  const { isConnected } = useBuffersSocket();

  const { 
    data: statistics, 
    isLoading: statisticsLoading, 
    error: statisticsError 
  } = useBuffersStatistics();

  const handleSelectBuffer = (buffer: BufferResponse) => {
    setState({
      viewMode: 'detail',
      selectedBuffer: buffer
    });
  };

  const handleEditBuffer = (buffer: BufferResponse) => {
    setState({
      viewMode: 'edit',
      selectedBuffer: buffer
    });
  };

  const handleCreateBuffer = () => {
    setState({
      viewMode: 'create',
      selectedBuffer: undefined
    });
  };

  const handleBackToList = () => {
    setState({
      viewMode: 'list',
      selectedBuffer: undefined
    });
  };

  const handleFormSuccess = () => {
    setState({
      viewMode: 'list',
      selectedBuffer: undefined
    });
  };

  const renderContent = () => {
    switch (state.viewMode) {
      case 'create':
        return (
          <BufferForm
            onSuccess={handleFormSuccess}
            onCancel={handleBackToList}
          />
        );

      case 'edit':
        return (
          <BufferForm
            buffer={state.selectedBuffer as BufferDetailResponse}
            onSuccess={handleFormSuccess}
            onCancel={handleBackToList}
          />
        );

      case 'detail':
        return (
          <BufferDetail
            buffer={state.selectedBuffer as BufferResponse}
            onEdit={() => handleEditBuffer(state.selectedBuffer as BufferResponse)}
            onBack={handleBackToList}
          />
        );

      case 'list':
      default:
        return (
          <BuffersList
            onSelectBuffer={handleSelectBuffer}
            onEditBuffer={handleEditBuffer}
            selectedBufferId={state.selectedBuffer?.bufferId}
          />
        );
    }
  };

  const renderStatistics = () => {
    if (statisticsLoading) {
      return (
        <div className={styles.statisticsLoading}>
          <span className={styles.loadingSpinner}></span>
          Загрузка статистики...
        </div>
      );
    }

    if (statisticsError) {
      return (
        <div className={styles.statisticsError}>
          Ошибка загрузки статистики
        </div>
      );
    }

    if (!statistics) {
      return null;
    }

    return (
      <div className={styles.statistics}>
        <div className={styles.stat}>
          <span className={styles.statValue}>{statistics.buffers}</span>
          <span className={styles.statLabel}>Буферов</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue}>{statistics.bufferCells}</span>
          <span className={styles.statLabel}>Ячеек</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue}>{statistics.availableCells}</span>
          <span className={styles.statLabel}>Доступно</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue}>{statistics.occupiedCells}</span>
          <span className={styles.statLabel}>Занято</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue}>{statistics.reservedCells}</span>
          <span className={styles.statLabel}>Зарезервировано</span>
        </div>
      </div>
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.titleSection}>
            <h2>Управление буферами</h2>
            {!isConnected && (
              <div className={styles.connectionStatus}>
                <span className={styles.connectionDot} />
                Соединение потеряно
              </div>
            )}
          </div>
          
          {renderStatistics()}
        </div>

        <div className={styles.headerActions}>
          {state.viewMode === 'list' && (
            <button
              className={styles.createButton}
              onClick={handleCreateBuffer}
            >
              + Создать буфер
            </button>
          )}
          
          {state.viewMode !== 'list' && (
            <button
              className={styles.backButton}
              onClick={handleBackToList}
            >
              ← Назад к списку
            </button>
          )}
        </div>
      </div>

      <div className={styles.content}>
        {renderContent()}
      </div>
    </div>
  );
};

// Промежуточный компонент с QueryClientProvider
const BufferSettingsWithQuery: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BufferSettingsContent />
    </QueryClientProvider>
  );
};

// Основной компонент с обоими провайдерами
const BufferSettings: React.FC = () => {
  return (
    <SocketProvider 
      serverUrl="http://localhost:5000" 
      autoConnect={true}
    >
      <BufferSettingsWithQuery />
    </SocketProvider>
  );
};

export default BufferSettings;