// @ts-nocheck
import React, { useEffect, useState, useRef } from 'react';
import styles from './MachinesCards.module.css';
import useMachines from '../../../hooks/masterPage/useMachinesMaster';
import TaskSidebar from './components/TaskSidebar/TaskSidebar';

const MachinesCards: React.FC = () => {
  // Используем хук для получения данных о станках
  const { machines, loading, error, refreshMachines } = useMachines();
  
  // Создаем локальное состояние для отображения данных
  const [displayMachines, setDisplayMachines] = useState([]);
  
  // Флаг для отслеживания первой загрузки
  const initialLoadDone = useRef(false);

  // Состояние для отслеживания открытия/закрытия сменного задания
  const [isTaskSidebarOpen, setIsTaskSidebarOpen] = useState(false);

  // Состояние для хранения информации о выбранном станке
  const [selectedMachine, setSelectedMachine] = useState<{ id: number, name: string } | null>(null);
  
  // Обновляем displayMachines только один раз при первой загрузке
  // или когда изменяется количество машин (добавление/удаление)
  useEffect(() => {
    if (!loading && machines && machines.length > 0) {
      if (!initialLoadDone.current || displayMachines.length !== machines.length) {
        setDisplayMachines(machines);
        initialLoadDone.current = true;
      } else {
        // Обновляем только те поля, которые могут меняться, сохраняя стабильность отображения
        setDisplayMachines(prevMachines => {
          return prevMachines.map(prevMachine => {
            const newMachine = machines.find(m => m.id === prevMachine.id);
            if (newMachine) {
              return {
                ...prevMachine,
                completedQuantity: newMachine.completedQuantity,
                plannedQuantity: newMachine.plannedQuantity,
                status: newMachine.status,
                recommendedLoad: newMachine.recommendedLoad
              };
            }
            return prevMachine;
          });
        });
      }
    }
  }, [machines, loading, displayMachines.length]);

  // Добавить интервал обновления данных
  useEffect(() => {
    // Устанавливаем интервал обновления каждые 4 секунды
    const intervalId = setInterval(() => {
      refreshMachines();
    }, 4000);

    // Очищаем интервал при размонтировании компонента
    return () => clearInterval(intervalId);
  }, [refreshMachines]); // Добавляем refreshMachines в зависимости

  // Функция для определения класса статуса
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

  // Функция для отображения статуса на русском
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

  // Функция для расчета процента выполнения
  const calculateCompletionPercentage = (completed: number = 0, planned: number = 1): number => {
    if (planned === 0) return 0;
    return Math.min(Math.round((completed / planned) * 100), 100);
  };

  // Обработчик нажатия на кнопку "Открыть сменное задание"
  const handleOpenTask = (machineId: number, machineName: string) => {
    console.log(`Открываем сменное задание для станка ${machineId}: ${machineName}`);
    // Сохраняем информацию о выбранном станке
    setSelectedMachine({ id: machineId, name: machineName });
    // Открываем боковую панель сменного задания
    setIsTaskSidebarOpen(true);
  };

  // Обработчик закрытия боковой панели сменного задания
  const handleCloseTaskSidebar = () => {
    setIsTaskSidebarOpen(false);
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

  // Отображаем сообщение о загрузке
  if (loading && !initialLoadDone.current) {
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

  // Отображаем сообщение об ошибке
  if (error && !initialLoadDone.current) {
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

  // Отображаем сообщение, если нет доступных станков
  if (displayMachines.length === 0) {
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
            {displayMachines.map(machine => (
              <div
                key={machine.id}
                className={styles.machineCard}
                data-status={machine.status.toLowerCase()}
              >
                <div className={styles.cardHeader}>
                  <h3 className={styles.machineName}>{machine.name}</h3>
                  <div className={`${styles.statusIndicator} ${getStatusClass(machine.status)}`}>
                    {getStatusText(machine.status)}
                  </div>
                </div>

                <div className={styles.cardBody}>
                  {machine.status.toLowerCase() === 'active' && (
                    <>
                      <div className={styles.infoRow}>
                        <span className={styles.infoLabel}>Норма выработки:</span>
                        <span className={styles.infoValue}>{machine.recommendedLoad} шт.</span>
                      </div>

                      <div className={styles.infoRow}>
                        <span className={styles.infoLabel}>Запланировано:</span>
                        <span className={styles.infoValue}>{machine.plannedQuantity} шт.</span>
                      </div>

                      <div className={styles.infoRow}>
                        <span className={styles.infoLabel}>Выполнено:</span>
                        <span className={styles.infoValue}>
                          {machine.completedQuantity} шт. ({calculateCompletionPercentage(machine.completedQuantity, machine.plannedQuantity)}%)
                          <div className={styles.progressBar}>
                            <div
                              className={styles.progressFill}
                              style={{ width: `${calculateCompletionPercentage(machine.completedQuantity, machine.plannedQuantity)}%` }}
                            />
                          </div>
                        </span>
                      </div>
                    </>
                  )}

                  {/* Кнопка "Открыть сменное задание" отображается всегда */}
                  <div className={styles.buttonContainer}>
                    <button
                      className={styles.openTaskButton}
                      onClick={() => handleOpenTask(machine.id, machine.name)}
                    >
                      Открыть сменное задание
                    </button>
                  </div>

                  {machine.status.toLowerCase() === 'inactive' && renderInactiveOverlay()}
                  {machine.status.toLowerCase() === 'maintenance' && renderMaintenanceOverlay()}
                  {machine.status.toLowerCase() === 'broken' && renderBrokenOverlay()}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Компонент боковой панели сменного задания */}
      {selectedMachine && (
        <TaskSidebar
          isOpen={isTaskSidebarOpen}
          onClose={handleCloseTaskSidebar}
          machineId={selectedMachine.id}
          machineName={selectedMachine.name}
        />
      )}
    </>
  );
};

export default MachinesCards;
