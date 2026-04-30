import React, { useState } from 'react';
import styles from './MachinesCards.module.css';

interface Machine {
  id: number;
  name: string;
  status: string;
  recommendedLoad: number;
  completedQuantity: number;
  load_unit: string;
}

const MOCK_MACHINES: Machine[] = [
  { id: 1, name: 'Станок 1', status: 'active', recommendedLoad: 100, completedQuantity: 65, load_unit: 'шт' },
  { id: 2, name: 'Станок 2', status: 'active', recommendedLoad: 100, completedQuantity: 40, load_unit: 'шт' },
  { id: 3, name: 'Станок 3', status: 'inactive', recommendedLoad: 100, completedQuantity: 0, load_unit: 'шт' },
];

const MachinesCards: React.FC = () => {
  const [machines] = useState<Machine[]>(MOCK_MACHINES);

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

  return (
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

export default MachinesCards;
