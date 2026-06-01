import React, { useState } from 'react';
import styles from './MachinesCards.module.css';
import TaskSidebar from './components/TaskSidebar/TaskSidebar';
import useMachinesCustomMaster from '../../../../hooks/custom/master/useMachinesCustomMaster';
import { resetMachineCounter } from '../../../../api/custom/master/machineCustomMasterService';

interface MachinesCardsProps {
  onDataUpdate?: () => void;
}

const MachinesCards: React.FC<MachinesCardsProps> = ({ onDataUpdate }) => {
  const { machines, loading, error, refreshMachines } = useMachinesCustomMaster();
  const [selectedMachineId, setSelectedMachineId] = useState<number | null>(null);
  const [selectedMachineName, setSelectedMachineName] = useState<string>('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleOpenTask = (machineId: number, machineName: string) => {
    console.log('handleOpenTask called with machineId:', machineId);
    setSelectedMachineId(machineId);
    setSelectedMachineName(machineName);
    setIsSidebarOpen(true);
    console.log('Sidebar state set to true');
  };

  const handleCloseSidebar = () => {
    setIsSidebarOpen(false);
    setSelectedMachineId(null);
    setSelectedMachineName('');
  };

  const handleResetCounter = async (machineId: number, machineName: string) => {
    try {
      const result = await resetMachineCounter(machineId);
      console.log(result.message);
      refreshMachines();
      if (onDataUpdate) {
        onDataUpdate();
      }
    } catch (error) {
      console.error('Ошибка при сбросе счетчика:', error);
    }
  };

  const getStatusClass = (status: string): string => {
    switch (status.toLowerCase()) {
      case 'active':
        return styles.statusActive;
      case 'inactive':
        return styles.statusInactive;
      case 'maintenance':
        return styles.statusMaintenance;
      case 'broken':
        return styles.statusBroken;
      default:
        return '';
    }
  };

  const getStatusText = (status: string): string => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'Активен';
      case 'inactive':
        return 'Неактивен';
      case 'maintenance':
        return 'Обслуживание';
      case 'broken':
        return 'Сломан';
      default:
        return 'Неизвестно';
    }
  };

  const calculateCompletionPercentage = (completed: number = 0, planned: number = 1): number => {
    if (planned === 0) return 0;
    return Math.min(Math.round((completed / planned) * 100), 100);
  };

  const renderInactiveOverlay = () => (
    <div className={styles.inactiveOverlay}>
      <div className={styles.inactiveIcon}>⏸</div>
      <div className={styles.inactiveMessage}>Станок не используется</div>
    </div>
  );

  const renderMaintenanceOverlay = () => (
    <div className={styles.maintenanceOverlay}>
      <div className={styles.maintenanceIcon}>🔧</div>
      <div className={styles.maintenanceMessage}>Техническое обслуживание</div>
    </div>
  );

  const renderBrokenOverlay = () => (
    <div className={styles.brokenOverlay}>
      <div className={styles.brokenIcon}>⚠️</div>
      <div className={styles.brokenMessage}>Станок неисправен</div>
    </div>
  );

  if (loading) {
    return (
      <div className={styles.detailsContainer}>
        <h2 className={styles.title}>СТАНКИ</h2>
        <div className={styles.stateContainer}>
          <div className={styles.loadingSpinner}></div>
          <div className={styles.loadingMessage}>
            <h3>Загрузка данных</h3>
            <p>Пожалуйста, подождите...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.detailsContainer}>
        <h2 className={styles.title}>СТАНКИ</h2>
        <div className={styles.stateContainer}>
          <div className={styles.errorIcon}>⚠️</div>
          <div className={styles.errorMessage}>
            <h3>Ошибка загрузки данных</h3>
            <p>{error.message || 'Произошла ошибка при получении информации о станках.'}</p>
            <button className={styles.retryButton} onClick={refreshMachines}>
              Повторить загрузку
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (machines.length === 0) {
    return (
      <div className={styles.detailsContainer}>
        <h2 className={styles.title}>СТАНКИ</h2>
        <div className={styles.stateContainer}>
          <div className={styles.emptyIcon}>📭</div>
          <div className={styles.emptyMessage}>
            <h3>Нет доступных станков</h3>
            <p>Не найдено ни одного станка для текущего сегмента.</p>
            <button className={styles.retryButton} onClick={refreshMachines}>
              Обновить данные
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={styles.detailsContainer}>
        <h2 className={styles.title}>СТАНКИ</h2>
        
        <div className={styles.tableContainer}>
          <div className={styles.cardsWrapper}>
            {machines.sort((a, b) => a.id - b.id).map(machine => (
              <div 
                key={machine.id} 
                className={styles.machineCard}
                data-status={machine.status.toLowerCase()}
              >
                <div className={styles.cardHeader}>
                  <h3 className={styles.machineName}>{machine.name}</h3>
                  <div className={styles.headerRight}>
                    {machine.status.toLowerCase() === 'active' && (
                      <button 
                        className={styles.resetButton}
                        onClick={() => handleResetCounter(machine.id, machine.name)}
                        title="Сбросить счетчик выполнено"
                      >
                        ↻
                      </button>
                    )}
                    <div className={`${styles.statusIndicator} ${getStatusClass(machine.status)}`}>
                      {getStatusText(machine.status)}
                    </div>
                  </div>
                </div>
                
                <div className={styles.cardBody}>
                  {machine.status.toLowerCase() === 'active' && (
                    <>
                      <div className={styles.infoRow}>
                        <span className={styles.infoLabel}>Норма выработки:</span>
                        <span className={styles.infoValue}>{machine.recommendedLoad} {machine.load_unit}.</span>
                      </div>
                      
                      {!machine.noSmenTask && (
                        <div className={styles.infoRow}>
                          <span className={styles.infoLabel}>Запланировано:</span>
                          <span className={styles.infoValue}>{machine.plannedQuantity} {machine.load_unit}.</span>
                        </div>
                      )}
                      
                      <div className={styles.infoRow}>
                        <span className={styles.infoLabel}>Выполнено:</span>
                        <span className={styles.infoValue}>
                          {machine.completedQuantity} {machine.load_unit}. ({calculateCompletionPercentage(machine.completedQuantity, machine.recommendedLoad)}%)
                          <div className={styles.progressBar}>
                            <div 
                              className={styles.progressFill}  
                              style={{ width: `${calculateCompletionPercentage(machine.completedQuantity, machine.recommendedLoad)}%` }}
                            />
                          </div>
                        </span>
                      </div>
                    </>
                  )}
                  
                  {machine.status.toLowerCase() === 'inactive' && renderInactiveOverlay()}
                  {machine.status.toLowerCase() === 'maintenance' && renderMaintenanceOverlay()}
                  {machine.status.toLowerCase() === 'broken' && renderBrokenOverlay()}

                  {!machine.noSmenTask && (
                    <div className={styles.buttonContainer}>
                      <button
                        className={styles.openTaskButton}
                        onClick={() => {
                          console.log('Button clicked for machine:', machine.id);
                          handleOpenTask(machine.id, machine.name);
                        }}
                      >
                        Открыть сменное задание
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <TaskSidebar
        isOpen={isSidebarOpen}
        onClose={handleCloseSidebar}
        machineId={selectedMachineId || 0}
        machineName={selectedMachineName}
      />
    </>
  );
};

export default MachinesCards;
