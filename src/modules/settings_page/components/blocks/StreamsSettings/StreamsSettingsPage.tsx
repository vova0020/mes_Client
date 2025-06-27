// ================================================
// src/modules/settings_page/components/blocks/StreamsSettings/StreamsSettingsPage.tsx
// ================================================
import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SocketProvider } from '../../../../../contexts/SocketContext';
import { SocketConnectionIndicator } from '../../../../../components/SocketConnectionIndicator/SocketConnectionIndicator';
import { StreamsList } from './components/StreamsList';
import { StreamForm } from './components/StreamForm';
import { StagesManagement } from './components/stages/StagesManagement';
import { useStreamsSocket } from './hooks/useStreamsSocket';
import styles from './StreamsSettingsPage.module.css';
import { API_URL } from '../../../../api/config';
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

type TabType = 'streams' | 'stages';

const StreamsSettingsContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('streams');
  const [editStreamId, setEditStreamId] = useState<number>();
  const [showForm, setShowForm] = useState(false);

  // Подключаем Socket.IO обработчики
  const { isConnected } = useStreamsSocket();

  const handleStreamEdit = (streamId: number) => {
    setEditStreamId(streamId);
    setShowForm(true);
  };

  const handleCreateStream = () => {
    setEditStreamId(undefined);
    setShowForm(true);
  };

  const handleStreamSaved = () => {
    setEditStreamId(undefined);
    setShowForm(false);
    // Данные автоматически обновятся благодаря React Query и Socket.IO
  };

  const handleCancelEdit = () => {
    setEditStreamId(undefined);
    setShowForm(false);
  };

  const tabs = [
    {
      id: 'streams' as TabType,
      label: 'Управление потоками',
      icon: '🏭',
      description: 'Настройка производственных линий и привязка материалов'
    },
    {
      id: 'stages' as TabType,
      label: 'Управление этапами',
      icon: '⚙️',
      description: 'Создание и редактирование технологических операций'
    }
  ];

  return (
    <div className={styles.pageContainer}>
      {/* Socket.IO Connection Indicator */}
      <SocketConnectionIndicator 
        position="bottom-right" 
        showDetails={true} 
      />

      {/* Header */}
      <div className={styles.pageHeader}>
        <div className={styles.pageHeaderContent}>
          <h1 className={styles.pageTitle}>
            <span className={styles.pageTitleIcon}>
              {tabs.find(tab => tab.id === activeTab)?.icon}
            </span>
            {tabs.find(tab => tab.id === activeTab)?.label}
          </h1>
          <p className={styles.pageSubtitle}>
            {tabs.find(tab => tab.id === activeTab)?.description}
            {/* {isConnected && (
              <span className={styles.realtimeIndicator}>
                • Обновления в реальном времени
              </span>
            )} */}
          </p>
        </div>
        <div className={styles.pageHeaderActions}>
          {activeTab === 'streams' && (
            <button
              onClick={handleCreateStream}
              className={`${styles.button} ${styles.buttonPrimary} ${styles.buttonLarge}`}
            >
              <span className={styles.buttonIcon}>+</span>
              Создать поток
            </button>
          )}
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className={styles.tabsContainer}>
        <nav className={styles.tabsNav}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`${styles.tabButton} ${
                activeTab === tab.id ? styles.tabButtonActive : ''
              }`}
            >
              <span className={styles.tabIcon}>{tab.icon}</span>
              <span className={styles.tabLabel}>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className={styles.mainContent}>
        <div className={styles.contentPanel}>
          {activeTab === 'streams' && (
            <StreamsList onStreamEdit={handleStreamEdit} />
          )}
          {activeTab === 'stages' && (
            <StagesManagement />
          )}
        </div>
      </div>

      {/* Stream Form Modal */}
      {showForm && (
        <div className={styles.modalOverlay} onClick={handleCancelEdit}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <StreamForm 
              editId={editStreamId} 
              onSaved={handleStreamSaved}
              onCancel={handleCancelEdit}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export const StreamsSettingsPage: React.FC = () => {
  return (
    <SocketProvider serverUrl={API_URL} autoConnect={true}>
      <QueryClientProvider client={queryClient}>
        <StreamsSettingsContent />
      </QueryClientProvider>
    </SocketProvider>
  );
};