// ================================================
// src/modules/materials/MaterialSettingsPage.tsx
// ================================================
import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MaterialGroups } from './components/MaterialGroups';
import { MaterialsList } from './components/MaterialsList';
import { MaterialForm } from './components/MaterialForm';
import { MaterialUploadModal } from './components/MaterialUploadModal';
import styles from './MaterialSettingsPage.module.css';

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

const MaterialSettingsContent: React.FC = () => {
  const [selectedGroup, setSelectedGroup] = useState<number>();
  const [editMaterialId, setEditMaterialId] = useState<number>();
  const [showForm, setShowForm] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);



  const handleGroupSelect = (groupId: number) => {
    setSelectedGroup(groupId === 0 ? undefined : groupId);
  };

  const handleClearGroupFilter = () => {
    setSelectedGroup(undefined);
  };

  const handleMaterialEdit = (materialId: number) => {
    setEditMaterialId(materialId);
    setShowForm(true);
  };

  const handleCreateMaterial = () => {
    setEditMaterialId(undefined);
    setShowForm(true);
  };

  const handleMaterialSaved = () => {
    setEditMaterialId(undefined);
    setShowForm(false);
    // Данные автоматически обновятся благодаря React Query и Socket.IO
  };

  const handleCancelEdit = () => {
    setEditMaterialId(undefined);
    setShowForm(false);
  };

  return (
    <div className={styles.pageContainer}>


      {/* Header */}
      <div className={styles.pageHeader}>
        <div className={styles.pageHeaderContent}>
          <h1 className={styles.pageTitle}>
            <span className={styles.pageTitleIcon}>📦</span>
            Управление материалами
            {/* {isConnected && (
              <span className={styles.connectionStatus} title="Подключено к серверу">
                🟢
              </span>
            )} */}
          </h1>
          <p className={styles.pageSubtitle}>
            Настройка справочников материалов и их группировка
            {/* {isConnected && (
              <span className={styles.realtimeIndicator}>
                • Обновления в реальном времени
              </span>
            )} */}
          </p>
        </div>
        <div className={styles.pageHeaderActions}>
          <button
            onClick={() => setShowUploadModal(true)}
            className={`${styles.button} ${styles.buttonSecondary} ${styles.buttonLarge}`}
          >
            <span className={styles.buttonIcon}>📤</span>
            Загрузить из Excel
          </button>
          <button
            onClick={handleCreateMaterial}
            className={`${styles.button} ${styles.buttonPrimary} ${styles.buttonLarge}`}
          >
            <span className={styles.buttonIcon}>+</span>
            Создать материал
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className={styles.mainContent}>
        {/* Left Panel - Groups */}
        <div className={styles.leftPanel}>
          <MaterialGroups 
            onGroupSelect={handleGroupSelect}
            selectedGroupId={selectedGroup}
          />
        </div>

        {/* Right Panel - Materials List */}
        <div className={styles.rightPanel}>
          <MaterialsList 
            filterGroupId={selectedGroup} 
            onMaterialEdit={handleMaterialEdit}
            onClearFilter={handleClearGroupFilter}
          />
        </div>
      </div>

      {/* Material Form Modal */}
      {showForm && (
        <div className={styles.modalOverlay} onClick={handleCancelEdit}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <MaterialForm 
              editId={editMaterialId} 
              onSaved={handleMaterialSaved}
              onCancel={handleCancelEdit}
            />
          </div>
        </div>
      )}

      {/* Material Upload Modal */}
      {showUploadModal && (
        <MaterialUploadModal onClose={() => setShowUploadModal(false)} />
      )}
    </div>
  );
};

export const MaterialSettingsPage: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <MaterialSettingsContent />
    </QueryClientProvider>
  );
};