import React from 'react';
import styles from './StreamMachinesCards.module.css';
import { useWorkplaces } from '../../../../../../hooks/workMonitorHook';

interface StreamMachinesCardsProps {
  streamId: number;
  stageId: number;
}

const StreamMachinesCards: React.FC<StreamMachinesCardsProps> = ({ streamId, stageId }) => {
  const { workplaces, loading, error } = useWorkplaces(streamId, stageId);

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

  const handleResetCounter = (machineId: number) => {
    console.log(`Сброс счетчика для станка ${machineId}`);
  };

  const renderInactiveOverlay = () => (
    <div className={styles.inactiveOverlay}>
      <div className={styles.inactiveIcon}>⏸</div>
      <div className={styles.inactiveMessage}>Станок не используется</div>
    </div>
  );



  if (loading) {
    return (
      <div className={styles.detailsContainer}>
        <h2 className={styles.title}>СТАНКИ</h2>
        <div className={styles.stateContainer}>
          <div className={styles.loadingSpinner} />
          <div className={styles.loadingMessage}>
            <h3>Загрузка...</h3>
            <p>Пожалуйста, подождите</p>
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
            <h3>Ошибка</h3>
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (workplaces.length === 0) {
    return (
      <div className={styles.detailsContainer}>
        <h2 className={styles.title}>СТАНКИ</h2>
        <div className={styles.stateContainer}>
          <div className={styles.emptyIcon}>📦</div>
          <div className={styles.emptyMessage}>
            <h3>Нет данных</h3>
            <p>Рабочие места не найдены</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.detailsContainer}>
      <h2 className={styles.title}>СТАНКИ</h2>
      
      <div className={styles.tableContainer}>
        <div className={styles.cardsWrapper}>
          {workplaces.map((machine: any) => {
            const status = machine.completed > 0 ? 'active' : 'inactive';
            return (
              <div 
                key={machine.machineId} 
                className={styles.machineCard}
                data-status={status}
              >
                <div className={styles.cardHeader}>
                  <h3 className={styles.machineName}>{machine.machineName}</h3>
                  <div className={styles.headerRight}>
                    {status === 'active' && (
                      <button 
                        className={styles.resetButton}
                        onClick={() => handleResetCounter(machine.machineId)}
                        title="Сбросить счетчик выполнено"
                      >
                        ↻
                      </button>
                    )}
                    <div className={`${styles.statusIndicator} ${getStatusClass(status)}`}>
                      {getStatusText(status)}
                    </div>
                  </div>
                </div>
                
                <div className={styles.cardBody}>
                  {status === 'active' ? (
                    <>
                      <div className={styles.infoRow}>
                        <span className={styles.infoLabel}>Норма выработки:</span>
                        <span className={styles.infoValue}>{machine.norm} м²</span>
                      </div>
                      
                      <div className={styles.infoRow}>
                        <span className={styles.infoLabel}>Запланировано:</span>
                        <span className={styles.infoValue}>{machine.planned} м²</span>
                      </div>
                      
                      <div className={styles.infoRow}>
                        <span className={styles.infoLabel}>Выполнено:</span>
                        <span className={styles.infoValue}>
                          {machine.completed} м² ({calculateCompletionPercentage(machine.completed, machine.norm)}%)
                          <div className={styles.progressBar}>
                            <div 
                              className={styles.progressFill}  
                              style={{ width: `${calculateCompletionPercentage(machine.completed, machine.norm)}%` }}
                            />
                          </div>
                        </span>
                      </div>
                    </>
                  ) : (
                    renderInactiveOverlay()
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default StreamMachinesCards;