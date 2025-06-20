import React, { useState, useEffect } from 'react';
import { 
  useMachineStages, 
  useStagesWithSubstages, 
  useAddMachineStage, 
  useRemoveMachineStage,
  useAddMachineSubstage,
  useRemoveMachineSubstage,
  useMachines
} from '../hooks/useMachinesQuery';
import { Machine, MachineStatus } from '../MachineSettings';
import styles from './MachineDetails.module.css';

interface MachineDetailsProps {
  selectedMachine: Machine | null;
  onMachineUpdated?: (updatedMachine: Machine) => void;
}

export const MachineDetails: React.FC<MachineDetailsProps> = ({ 
  selectedMachine, 
  onMachineUpdated 
}) => {
  const [activeTab, setActiveTab] = useState<'info' | 'stages'>('info');
  const [showAddStageModal, setShowAddStageModal] = useState(false);
  const [showAddSubstageModal, setShowAddSubstageModal] = useState(false);

  const { data: machineStagesData } = useMachineStages(selectedMachine?.machineId);
  const { data: availableStages = [] } = useStagesWithSubstages();
  const { data: machines = [] } = useMachines();
  
  const addStageMutation = useAddMachineStage();
  const removeStageMutation = useRemoveMachineStage();
  const addSubstageMutation = useAddMachineSubstage();
  const removeSubstageMutation = useRemoveMachineSubstage();

  // Получаем актуальные данные станка из списка
  const currentMachine = selectedMachine 
    ? machines.find(m => m.machineId === selectedMachine.machineId) || selectedMachine
    : null;

  // Уведомляем родительский компонент об обновлении
  useEffect(() => {
    if (currentMachine && onMachineUpdated && selectedMachine) {
      if (JSON.stringify(currentMachine) !== JSON.stringify(selectedMachine)) {
        console.log('[MachineDetails] Обнаружено обновление станка, уведомляем родителя');
        onMachineUpdated(currentMachine);
      }
    }
  }, [currentMachine, selectedMachine, onMachineUpdated]);

  const getStatusColor = (status: MachineStatus) => {
    switch (status) {
      case MachineStatus.ACTIVE:
        return '#4CAF50';
      case MachineStatus.INACTIVE:
        return '#9E9E9E';
      case MachineStatus.MAINTENANCE:
        return '#FF9800';
      default:
        return '#9E9E9E';
    }
  };

  const getStatusText = (status: MachineStatus) => {
    switch (status) {
      case MachineStatus.ACTIVE:
        return 'Активен';
      case MachineStatus.INACTIVE:
        return 'Неактивен';
      case MachineStatus.MAINTENANCE:
        return 'Обслуживание';
      default:
        return 'Неизвестно';
    }
  };

  const handleAddStage = async (stageId: number) => {
    if (!currentMachine) return;
    
    try {
      console.log('[MachineDetails] Добавляем этап:', stageId);
      await addStageMutation.mutateAsync({
        machineId: currentMachine.machineId,
        stageId
      });
      setShowAddStageModal(false);
      console.log('[MachineDetails] Этап успешно добавлен');
    } catch (error) {
      console.error('Ошибка добавления этапа:', error);
      alert('Ошибка добавления этапа. Попробуйте еще раз.');
    }
  };

  const handleRemoveStage = async (stageId: number, stageName: string) => {
    if (!currentMachine) return;
    
    if (window.confirm(`Удалить этап "${stageName}" и все связанные подэтапы?`)) {
      try {
        console.log('[MachineDetails] Удаляем этап:', stageId);
        await removeStageMutation.mutateAsync({
          machineId: currentMachine.machineId,
          stageId
        });
        console.log('[MachineDetails] Этап успешно удален');
      } catch (error) {
        console.error('Ошибка удаления этапа:', error);
        alert('Ошибка удаления этапа. Попробуйте еще раз.');
      }
    }
  };

  const handleAddSubstage = async (substageId: number) => {
    if (!currentMachine) return;
    
    try {
      console.log('[MachineDetails] Добавляем подэтап:', substageId);
      await addSubstageMutation.mutateAsync({
        machineId: currentMachine.machineId,
        substageId
      });
      setShowAddSubstageModal(false);
      console.log('[MachineDetails] Подэтап успешно добавлен');
    } catch (error) {
      console.error('Ошибка добавления подэтапа:', error);
      alert('Ошибка добавления подэтапа. Убедитесь, что этап уже привязан к станку.');
    }
  };

  const handleRemoveSubstage = async (substageId: number, substageName: string) => {
    if (!currentMachine) return;
    
    if (window.confirm(`Удалить подэтап "${substageName}"?`)) {
      try {
        console.log('[MachineDetails] Удаляем подэтап:', substageId);
        await removeSubstageMutation.mutateAsync({
          machineId: currentMachine.machineId,
          substageId
        });
        console.log('[MachineDetails] Подэтап успешно удален');
      } catch (error) {
        console.error('Ошибка удаления подэтапа:', error);
        alert('Ошибка удаления подэтапа. Попробуйте еще раз.');
      }
    }
  };

  // Получаем список доступных этапов для добавления
  const getAvailableStagesForAdd = () => {
    if (!currentMachine) return [];
    
    const connectedStageIds = currentMachine.machinesStages?.map(ms => ms.stageId) || [];
    return availableStages.filter(stage => !connectedStageIds.includes(stage.stageId));
  };

  // Получаем список доступных подэтапов для добавления
  const getAvailableSubstagesForAdd = () => {
    if (!currentMachine) return [];
    
    const connectedStageIds = currentMachine.machinesStages?.map(ms => ms.stageId) || [];
    const connectedSubstageIds = currentMachine.machineSubstages?.map(ms => ms.substageId) || [];
    
    const availableSubstages: any[] = [];
    
    availableStages.forEach(stage => {
      if (connectedStageIds.includes(stage.stageId)) {
        stage.substages?.forEach(substage => {
          if (!connectedSubstageIds.includes(substage.substageId)) {
            availableSubstages.push({
              ...substage,
              parentStage: stage
            });
          }
        });
      }
    });
    
    return availableSubstages;
  };

  if (!currentMachine) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>🔧</div>
          <h3>Выберите станок</h3>
          <p>Выберите станок из списка для просмотра детальной информации</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <h2 className={styles.title}>{currentMachine.machineName}</h2>
          <div 
            className={styles.statusBadge}
            style={{ backgroundColor: getStatusColor(currentMachine.status) }}
          >
            {getStatusText(currentMachine.status)}
          </div>
        </div>
        
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'info' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('info')}
          >
            Информация
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'stages' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('stages')}
          >
            Этапы и подэтапы
          </button>
        </div>
      </div>

      <div className={styles.content}>
        {activeTab === 'info' && (
          <div className={styles.infoTab}>
            <div className={styles.infoGrid}>
              <div className={styles.infoCard}>
                <h3 className={styles.infoCardTitle}>Основная информация</h3>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>ID:</span>
                  <span className={styles.infoValue}>{currentMachine.machineId}</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Название:</span>
                  <span className={styles.infoValue}>{currentMachine.machineName}</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Статус:</span>
                  <span className={styles.infoValue}>{getStatusText(currentMachine.status)}</span>
                </div>
              </div>

              <div className={styles.infoCard}>
                <h3 className={styles.infoCardTitle}>Характеристики</h3>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Рекомендуемая нагрузка:</span>
                  <span className={styles.infoValue}>
                    {currentMachine.recommendedLoad} {currentMachine.loadUnit}
                  </span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Единица измерения:</span>
                  <span className={styles.infoValue}>{currentMachine.loadUnit}</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Без сменного задания:</span>
                  <span className={styles.infoValue}>
                    {currentMachine.noSmenTask ? 'Да' : 'Нет'}
                  </span>
                </div>
              </div>

              <div className={styles.infoCard}>
                <h3 className={styles.infoCardTitle}>Статистика связей</h3>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Этапов:</span>
                  <span className={styles.infoValue}>
                    {currentMachine.machinesStages?.length || 0}
                  </span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Подэтапов:</span>
                  <span className={styles.infoValue}>
                    {currentMachine.machineSubstages?.length || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'stages' && (
          <div className={styles.stagesTab}>
            <div className={styles.stagesSection}>
              <div className={styles.sectionHeader}>
                <h3 className={styles.sectionTitle}>Привязанные этапы</h3>
                <button
                  onClick={() => setShowAddStageModal(true)}
                  className={styles.addButton}
                  disabled={getAvailableStagesForAdd().length === 0}
                >
                  + Добавить этап
                </button>
              </div>
              
              <div className={styles.stagesList}>
                {(!currentMachine.machinesStages || currentMachine.machinesStages.length === 0) ? (
                  <div className={styles.emptyList}>
                    <p>Этапы не привязаны</p>
                  </div>
                ) : (
                  currentMachine.machinesStages.map((machineStage) => (
                    <div key={machineStage.machineStageId} className={styles.stageItem}>
                      <div className={styles.stageInfo}>
                        <h4 className={styles.stageName}>{machineStage.stage.stageName}</h4>
                        <p className={styles.stageDescription}>{machineStage.stage.description}</p>
                      </div>
                      <button
                        onClick={() => handleRemoveStage(machineStage.stageId, machineStage.stage.stageName)}
                        className={styles.removeButton}
                        disabled={removeStageMutation.isPending}
                      >
                        {removeStageMutation.isPending ? '⏳' : '🗑️'}
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className={styles.substagesSection}>
              <div className={styles.sectionHeader}>
                <h3 className={styles.sectionTitle}>Привязанные подэтапы</h3>
                <button
                  onClick={() => setShowAddSubstageModal(true)}
                  className={styles.addButton}
                  disabled={getAvailableSubstagesForAdd().length === 0}
                >
                  + Добавить подэтап
                </button>
              </div>
              
              <div className={styles.substagesList}>
                {(!currentMachine.machineSubstages || currentMachine.machineSubstages.length === 0) ? (
                  <div className={styles.emptyList}>
                    <p>Подэтапы не привязаны</p>
                  </div>
                ) : (
                  currentMachine.machineSubstages.map((machineSubstage) => (
                    <div key={machineSubstage.machineSubstageId} className={styles.substageItem}>
                      <div className={styles.substageInfo}>
                        <h4 className={styles.substageName}>{machineSubstage.substage.substageName}</h4>
                        <p className={styles.substageDescription}>{machineSubstage.substage.description}</p>
                        <span className={styles.substageParent}>
                          Этап: {machineSubstage.substage.stage?.stageName}
                        </span>
                      </div>
                      <button
                        onClick={() => handleRemoveSubstage(
                          machineSubstage.substageId, 
                          machineSubstage.substage.substageName
                        )}
                        className={styles.removeButton}
                        disabled={removeSubstageMutation.isPending}
                      >
                        {removeSubstageMutation.isPending ? '⏳' : '🗑️'}
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Модальное окно добавления этапа */}
      {showAddStageModal && (
        <div className={styles.modalOverlay} onClick={() => setShowAddStageModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Добавить этап</h3>
              <button 
                onClick={() => setShowAddStageModal(false)}
                className={styles.closeButton}
              >
                ✕
              </button>
            </div>
            <div className={styles.modalContent}>
              <div className={styles.stageOptions}>
                {getAvailableStagesForAdd().map((stage) => (
                  <div key={stage.stageId} className={styles.stageOption}>
                    <div className={styles.stageOptionInfo}>
                      <h4>{stage.stageName}</h4>
                      <p>{stage.description}</p>
                    </div>
                    <button
                      onClick={() => handleAddStage(stage.stageId)}
                      className={styles.selectButton}
                      disabled={addStageMutation.isPending}
                    >
                      {addStageMutation.isPending ? 'Добавление...' : 'Добавить'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно добавления подэтапа */}
      {showAddSubstageModal && (
        <div className={styles.modalOverlay} onClick={() => setShowAddSubstageModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Добавить подэтап</h3>
              <button 
                onClick={() => setShowAddSubstageModal(false)}
                className={styles.closeButton}
              >
                ✕
              </button>
            </div>
            <div className={styles.modalContent}>
              <div className={styles.substageOptions}>
                {getAvailableSubstagesForAdd().map((substage) => (
                  <div key={substage.substageId} className={styles.substageOption}>
                    <div className={styles.substageOptionInfo}>
                      <h4>{substage.substageName}</h4>
                      <p>{substage.description}</p>
                      <span className={styles.parentStageInfo}>
                        Этап: {substage.parentStage.stageName}
                      </span>
                    </div>
                    <button
                      onClick={() => handleAddSubstage(substage.substageId)}
                      className={styles.selectButton}
                      disabled={addSubstageMutation.isPending}
                    >
                      {addSubstageMutation.isPending ? 'Добавление...' : 'Добавить'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};