import React from 'react';
import styles from './MachinesCards.module.css';

// Интерфейс для данных о станке
interface MachineData {
  id: string;
  name: string;
  status: 'active' | 'inactive' | 'maintenance' | 'broken';
  currentOrder?: string;
  efficiency: number;
  // Новые поля
  productionRate?: number; // Норма выработки
  plannedAmount?: number; // Запланировано
  completedAmount?: number; // Выполнено
}

// Временные данные для демонстрации
const demoMachines: MachineData[] = [
  {
    id: 'machine-001',
    name: 'Станок ЧПУ #1',
    status: 'active',
    currentOrder: 'ORD-2023-001',
    efficiency: 87,
    productionRate: 100,
    plannedAmount: 80,
    completedAmount: 45
  },
  {
    id: 'machine-002',
    name: 'Фрезерный станок #2',
    status: 'maintenance',
    efficiency: 0,
    productionRate: 0,
    plannedAmount: 0,
    completedAmount: 0
  },
  {
    id: 'machine-003',
    name: 'Токарный станок #3',
    status: 'inactive',
    efficiency: 0,
    productionRate: 0,
    plannedAmount: 0,
    completedAmount: 0
  },
  {
    id: 'machine-004',
    name: 'Шлифовальный станок #4',
    status: 'active',
    efficiency: 92,
    productionRate: 120,
    plannedAmount: 100,
    completedAmount: 78
  },
  {
    id: 'machine-005',
    name: 'Сверлильный станок #5',
    status: 'broken',
    efficiency: 0,
    productionRate: 0,
    plannedAmount: 0,
    completedAmount: 0
  }
];

const MachinesCards: React.FC = () => {
  // В реальном приложении данные будут загружаться из API
  const machines = demoMachines;

  // Функция для определения класса статуса
  const getStatusClass = (status: string): string => {
    switch (status) {
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

  // Функция для отображения статуса на русском
  const getStatusText = (status: string): string => {
    switch (status) {
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

  // Функция для расчета процента выполнения от нормы
  const calculateCompletionPercentage = (completed: number = 0, rate: number = 1): number => {
    if (rate === 0) return 0;
    return Math.min(Math.round((completed / rate) * 100), 100);
  };

  // Обработчик нажатия на кнопку "Открыть сменное задание"
  const handleOpenTask = (machineId: string) => {
    console.log(`Открываем сменное задание для станка ${machineId}`);
    // Здесь будет логика открытия сменного задания
  };

  // Функция для отображения оверлея неактивного станка
  const renderInactiveOverlay = () => (
    <div className={styles.inactiveOverlay}>
      <div className={styles.inactiveIcon}>⏸</div>
      <div className={styles.inactiveMessage}>Станок не используется</div>
    </div>
  );

  // Функция для отображения оверлея станка на обслуживании
  const renderMaintenanceOverlay = () => (
    <div className={styles.maintenanceOverlay}>
      <div className={styles.maintenanceIcon}>🔧</div>
      <div className={styles.maintenanceMessage}>Техническое обслуживание</div>
    </div>
  );

  // Функция для отображения оверлея сломанного станка
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
              data-status={machine.status}
            >
              <div className={styles.cardHeader}>
                <h3 className={styles.machineName}>{machine.name}</h3>
                <div className={`${styles.statusIndicator} ${getStatusClass(machine.status)}`}>
                  {getStatusText(machine.status)}
                </div>
              </div>
              
              <div className={styles.cardBody}>
                {machine.currentOrder && (
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Текущий заказ:</span>
                    <span className={styles.infoValue}>{machine.currentOrder}</span>
                  </div>
                )}
                
                {machine.status === 'active' && (
                  <>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Норма выработки:</span>
                      <span className={styles.infoValue}>{machine.productionRate} шт.</span>
                    </div>
                    
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Запланировано:</span>
                      <span className={styles.infoValue}>{machine.plannedAmount} шт.</span>
                    </div>
                    
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Выполнено:</span>
                      <span className={styles.infoValue}>
                        {machine.completedAmount} шт. ({calculateCompletionPercentage(machine.completedAmount, machine.productionRate)}%)
                        <div className={styles.progressBar}>
                          <div 
                            className={styles.progressFill} 
                            style={{ width: `${calculateCompletionPercentage(machine.completedAmount, machine.productionRate)}%` }}
                          />
                        </div>
                      </span>
                    </div>
                  </>
                )}
                
                {machine.status === 'active' && (
                  <div className={styles.buttonContainer}>
                    <button 
                      className={styles.openTaskButton}
                      onClick={() => handleOpenTask(machine.id)}
                    >
                      Открыть сменное задание
                    </button>
                  </div>
                )}
                
                {machine.status === 'inactive' && renderInactiveOverlay()}
                {machine.status === 'maintenance' && renderMaintenanceOverlay()}
                {machine.status === 'broken' && renderBrokenOverlay()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MachinesCards;