import React from 'react';
import styles from './StreamMachinesCards.module.css';

interface Machine {
  id: number;
  name: string;
  status: 'active' | 'inactive' | 'maintenance' | 'broken';
  recommendedLoad: number;
  plannedQuantity: number;
  completedQuantity: number;
  load_unit: string;
}

const StreamMachinesCards: React.FC = () => {
  const machines: Machine[] = [
    {
      id: 1,
      name: 'Станок №1',
      status: 'active',
      recommendedLoad: 1000,
      plannedQuantity: 800,
      completedQuantity: 600,
      load_unit: 'м²'
    },
    {
      id: 2,
      name: 'Станок №2',
      status: 'inactive',
      recommendedLoad: 1200,
      plannedQuantity: 0,
      completedQuantity: 0,
      load_unit: 'м²'
    },
    {
      id: 3,
      name: 'Станок №3',
      status: 'active',
      recommendedLoad: 900,
      plannedQuantity: 900,
      completedQuantity: 750,
      load_unit: 'м²'
    },
    {
      id: 4,
      name: 'Станок №4',
      status: 'maintenance',
      recommendedLoad: 1100,
      plannedQuantity: 0,
      completedQuantity: 0,
      load_unit: 'м²'
    }
  ];

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

  return (
    <div className={styles.detailsContainer}>
      <h2 className={styles.title}>СТАНКИ</h2>
      
      <div className={styles.tableContainer}>
        <div className={styles.cardsWrapper}>
          {machines.map(machine => (
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
                      onClick={() => handleResetCounter(machine.id)}
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
                    
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Запланировано:</span>
                      <span className={styles.infoValue}>{machine.plannedQuantity} {machine.load_unit}.</span>
                    </div>
                    
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
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StreamMachinesCards;