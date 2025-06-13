// ================================================
// src/modules/settings_page/components/blocks/StreamsSettings/components/stages/StagesManagement.tsx
// ================================================
import React, { useState } from 'react';
import { StagesLevel1List } from './StagesLevel1List';
import { StagesLevel2List } from './StagesLevel2List';
import { StageLevel1Form } from './StageLevel1Form';
import { StageLevel2Form } from './StageLevel2Form';
import styles from '../../StreamsSettingsPage.module.css';

type StageTabType = 'level1' | 'level2';

export const StagesManagement: React.FC = () => {
  const [activeStageTab, setActiveStageTab] = useState<StageTabType>('level1');
  const [editStageLevel1Id, setEditStageLevel1Id] = useState<number>();
  const [editStageLevel2Id, setEditStageLevel2Id] = useState<number>();
  const [showLevel1Form, setShowLevel1Form] = useState(false);
  const [showLevel2Form, setShowLevel2Form] = useState(false);
  const [selectedStageLevel1Id, setSelectedStageLevel1Id] = useState<number>();

  const stageTabs = [
    {
      id: 'level1' as StageTabType,
      label: 'Технологические операции',
      icon: '⚙️',
      description: 'Основные этапы производства'
    },
    {
      id: 'level2' as StageTabType,
      label: 'Подэтапы операций',
      icon: '🔧',
      description: 'Детализация технологических операций'
    }
  ];

  // Обработчики для этапов 1 уровня
  const handleCreateStageLevel1 = () => {
    setEditStageLevel1Id(undefined);
    setShowLevel1Form(true);
  };

  const handleEditStageLevel1 = (stageId: number) => {
    setEditStageLevel1Id(stageId);
    setShowLevel1Form(true);
  };

  const handleStageLevel1Saved = () => {
    setEditStageLevel1Id(undefined);
    setShowLevel1Form(false);
  };

  const handleCancelLevel1Edit = () => {
    setEditStageLevel1Id(undefined);
    setShowLevel1Form(false);
  };

  // Обработчики для этапов 2 уровня
  const handleCreateStageLevel2 = (stageId?: number) => {
    setEditStageLevel2Id(undefined);
    setSelectedStageLevel1Id(stageId);
    setShowLevel2Form(true);
  };

  const handleEditStageLevel2 = (substageId: number) => {
    setEditStageLevel2Id(substageId);
    setSelectedStageLevel1Id(undefined);
    setShowLevel2Form(true);
  };

  const handleStageLevel2Saved = () => {
    setEditStageLevel2Id(undefined);
    setSelectedStageLevel1Id(undefined);
    setShowLevel2Form(false);
  };

  const handleCancelLevel2Edit = () => {
    setEditStageLevel2Id(undefined);
    setSelectedStageLevel1Id(undefined);
    setShowLevel2Form(false);
  };

  return (
    <div className={styles.stagesContainer}>
      {/* Stages Tabs */}
      <div className={styles.stagesHeader}>
        <div className={styles.stagesTabsNav}>
          {stageTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveStageTab(tab.id)}
              className={`${styles.stageTabButton} ${
                activeStageTab === tab.id ? styles.stageTabButtonActive : ''
              }`}
            >
              <span className={styles.tabIcon}>{tab.icon}</span>
              <span className={styles.tabLabel}>{tab.label}</span>
            </button>
          ))}
        </div>
        
        <div className={styles.stagesActions}>
          {activeStageTab === 'level1' && (
            <button
              onClick={handleCreateStageLevel1}
              className={`${styles.button} ${styles.buttonPrimary}`}
            >
              <span className={styles.buttonIcon}>+</span>
              Создать операцию
            </button>
          )}
          {activeStageTab === 'level2' && (
            <button
              onClick={() => handleCreateStageLevel2()}
              className={`${styles.button} ${styles.buttonPrimary}`}
            >
              <span className={styles.buttonIcon}>+</span>
              Создать подэтап
            </button>
          )}
        </div>
      </div>

      {/* Stage Tab Description */}
      <div className={styles.stageTabDescription}>
        <p>{stageTabs.find(tab => tab.id === activeStageTab)?.description}</p>
      </div>

      {/* Stages Content */}
      <div className={styles.stagesContent}>
        {activeStageTab === 'level1' && (
          <StagesLevel1List 
            onStageEdit={handleEditStageLevel1}
            onCreateSubstage={handleCreateStageLevel2}
          />
        )}
        {activeStageTab === 'level2' && (
          <StagesLevel2List 
            onSubstageEdit={handleEditStageLevel2}
          />
        )}
      </div>

      {/* Level 1 Form Modal */}
      {showLevel1Form && (
        <div className={styles.modalOverlay} onClick={handleCancelLevel1Edit}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <StageLevel1Form 
              editId={editStageLevel1Id} 
              onSaved={handleStageLevel1Saved}
              onCancel={handleCancelLevel1Edit}
            />
          </div>
        </div>
      )}

      {/* Level 2 Form Modal */}
      {showLevel2Form && (
        <div className={styles.modalOverlay} onClick={handleCancelLevel2Edit}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <StageLevel2Form 
              editId={editStageLevel2Id}
              preselectedStageId={selectedStageLevel1Id}
              onSaved={handleStageLevel2Saved}
              onCancel={handleCancelLevel2Edit}
            />
          </div>
        </div>
      )}
    </div>
  );
};