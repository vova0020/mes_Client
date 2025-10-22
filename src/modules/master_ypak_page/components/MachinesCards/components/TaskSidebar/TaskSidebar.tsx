
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import styles from './TaskSidebar.module.css';
import useMachines from '../../../../../hooks/ypakMasterHook/useMachinesMaster';
import { MachineTask, updatePackingTaskStatus } from '../../../../../api/ypakMasterApi/machineMasterService';

// Типы статусов деталей
type TaskStatus = 'pending' | 'processing' | 'completed';

// Интерфейс для модального окна частичной обработки
interface PartialProcessingModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskItem: MachineTask | null;
  onConfirm: (taskId: number, quantity: number) => void;
}

// Интерфейс для модального окна редактирования приоритета
interface PriorityModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskItem: MachineTask | null;
  onConfirm: (taskId: number, priority: number) => void;
}

interface TaskSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  machineId: number;
  machineName: string;
}

// Компонент модального окна для частичной обработки
const PartialProcessingModal: React.FC<PartialProcessingModalProps> = ({ 
  isOpen, 
  onClose,
  taskItem,
  onConfirm
}) => {
  const [quantity, setQuantity] = useState<number>(0);
  const maxQuantity = (taskItem?.assignedQuantity || 0) - (taskItem?.completedQuantity || 0);
  
  // Сбрасываем количество при открытии модального окна
  useEffect(() => {
    if (isOpen && taskItem) {
      setQuantity(Math.min(10, maxQuantity)); // По умолчанию 10 или меньше, если доступно меньше
    }
  }, [isOpen, taskItem, maxQuantity]);
  
  // Обработчик изменения количества
  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value > 0 && value <= maxQuantity) {
      setQuantity(value);
    }
  };
  
  // Обработчик подтверждения
  const handleConfirm = () => {
    if (taskItem && quantity > 0 && quantity <= maxQuantity) {
      onConfirm(taskItem.taskId, quantity);
      onClose();
    }
  };
  
  if (!isOpen || !taskItem) return null;
  
  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h3>Частичная обработка детали</h3>
          <button className={styles.modalCloseButton}  onClick={onClose}>&times;</button>
        </div>
        
        <div className={styles.modalBody}>
          <div className={styles.modalInfoRow}>
            <span className={styles.modalLabel}>Заказ:</span>
            <span className={styles.modalValue}>{taskItem.productionPackage.order.orderName}</span>
          </div>
          
          <div className={styles.modalInfoRow}>
            <span className={styles.modalLabel}>Номер партии:</span>
            <span className={styles.modalValue}>{taskItem.productionPackage.order.batchNumber}</span>
          </div>
          
          <div className={styles.modalInfoRow}>
            <span className={styles.modalLabel}>Артикул упаковки:</span>
            <span className={styles.modalValue}>{taskItem.productionPackage.packageCode}</span>
          </div>
          
          <div className={styles.modalInfoRow}>
            <span className={styles.modalLabel}>Наименование упаковки:</span>
            <span className={styles.modalValue}>{taskItem.productionPackage.packageName}</span>
          </div>
          
          <div className={styles.modalInfoRow}>
            <span className={styles.modalLabel}>Осталось выполнить:</span>
            <span className={styles.modalValue}>{(taskItem.assignedQuantity || 0) - (taskItem.completedQuantity || 0)} шт.</span>
          </div>
          
          <div className={styles.quantityInputContainer}>
            <label className={styles.quantityLabel} htmlFor="partial-quantity">
              Количество для обработки:
            </label>
            <div className={styles.quantityInputWrapper}>
              <button 
                className={styles.quantityButton}
                onClick={() => quantity > 1 && setQuantity(quantity - 1)}
                disabled={quantity <= 1}
              >
                -
              </button>
              <input
                id="partial-quantity"
                type="number"
                className={styles.quantityInput}
                value={quantity}
                onChange={handleQuantityChange}
                min={1}
                max={maxQuantity}
              />
              <button 
                className={styles.quantityButton}
                onClick={() => quantity < maxQuantity && setQuantity(quantity + 1)}
                disabled={quantity >= maxQuantity}
              >
                +
              </button>
            </div>
          </div>
        </div>
        
        <div className={styles.modalFooter}>
          <button className={styles.modalCancelButton} onClick={onClose}>
            Отмена
          </button>
          <button 
            className={styles.modalConfirmButton} 
            onClick={handleConfirm}
            disabled={quantity <= 0 || quantity > maxQuantity}
          >
            Подтвердить
          </button>
        </div>
      </div>
    </div>
  );
};

// Компонент модального окна для редактирования приоритета
const PriorityModal: React.FC<PriorityModalProps> = ({ 
  isOpen, 
  onClose,
  taskItem,
  onConfirm
}) => {
  const [priority, setPriority] = useState<number>(0);
  
  useEffect(() => {
    if (isOpen && taskItem) {
      setPriority(taskItem.priority || 0);
    }
  }, [isOpen, taskItem]);
  
  const handleConfirm = () => {
    if (taskItem && priority >= 0 && priority <= 10) {
      onConfirm(taskItem.taskId, priority);
      onClose();
    }
  };
  
  if (!isOpen || !taskItem) return null;
  
  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h3>Редактирование приоритета</h3>
          <button className={styles.modalCloseButton} onClick={onClose}>&times;</button>
        </div>
        
        <div className={styles.modalBody}>
          <div className={styles.modalInfoRow}>
            <span className={styles.modalLabel}>Заказ:</span>
            <span className={styles.modalValue}>{taskItem.productionPackage.order.orderName}</span>
          </div>
          
          <div className={styles.modalInfoRow}>
            <span className={styles.modalLabel}>Артикул упаковки:</span>
            <span className={styles.modalValue}>{taskItem.productionPackage.packageCode}</span>
          </div>
          
          <div className={styles.modalInfoRow}>
            <span className={styles.modalLabel}>Наименование упаковки:</span>
            <span className={styles.modalValue}>{taskItem.productionPackage.packageName}</span>
          </div>
          
          <div className={styles.quantityInputContainer}>
            <label className={styles.quantityLabel} htmlFor="priority-input">
              Приоритет (0-10):
            </label>
            <div className={styles.quantityInputWrapper}>
              <button 
                className={styles.quantityButton}
                onClick={() => priority > 0 && setPriority(priority - 1)}
                disabled={priority <= 0}
              >
                -
              </button>
              <input
                id="priority-input"
                type="number"
                className={styles.quantityInput}
                value={priority}
                onChange={(e) => {
                  const value = parseInt(e.target.value, 10);
                  if (!isNaN(value) && value >= 0 && value <= 10) {
                    setPriority(value);
                  }
                }}
                min={0}
                max={10}
              />
              <button 
                className={styles.quantityButton}
                onClick={() => priority < 10 && setPriority(priority + 1)}
                disabled={priority >= 10}
              >
                +
              </button>
            </div>
          </div>
        </div>
        
        <div className={styles.modalFooter}>
          <button className={styles.modalCancelButton} onClick={onClose}>
            Отмена
          </button>
          <button 
            className={styles.modalConfirmButton} 
            onClick={handleConfirm}
            disabled={priority < 0 || priority > 10}
          >
            Сохранить
          </button>
        </div>
      </div>
    </div>
  );
};

const TaskSidebar: React.FC<TaskSidebarProps> = ({ 
  isOpen, 
  onClose, 
  machineId, 
  machineName 
}) => {
  // Используем хук для работы с заданиями и станками
  const {
    machineTasks,
    tasksLoading,
    tasksError,
    fetchTasks,
    removeTask,
    transferTask,
    updatePriority,
    availableMachines,
    availableMachinesLoading,
    fetchAvailableMachines,
    startPackingWork,
    completePackingWork
  } = useMachines();
  
  // Состояние для модального окна частичной обработки
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<MachineTask | null>(null);
  
  // Состояние для модального окна приоритета
  const [isPriorityModalOpen, setIsPriorityModalOpen] = useState(false);
  const [selectedTaskForPriority, setSelectedTaskForPriority] = useState<MachineTask | null>(null);
  
  // Состояние для уведомлений
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  
  // Загрузка данных сменного задания при открытии
  useEffect(() => {
    if (isOpen && machineId) {
      // Загружаем задания для выбранного станка
      fetchTasks(machineId);
      
      // Загружаем список доступных станков
      fetchAvailableMachines();
    }
  }, [isOpen, machineId, fetchTasks, fetchAvailableMachines]);
  
  // Автоматически скрываем уведомление через 5 секунд
  // useEffect(() => {
  //   if (notification) {
  //     const timer = setTimeout(() => {
  //       setNotification(null);
  //     }, 5000);
  //     return () => clearTimeout(timer);
  //   }
  // }, [notification]);
  
  // Обработчик частичной обработки
  const handlePartialProcessing = (taskId: number) => {
    const task = machineTasks.find(item => item.taskId === taskId);
    if (task) {
      setSelectedTask(task);
      setIsModalOpen(true);
    }
  };
  
  // Обработчик подтверждения частичной обработки
  const handleConfirmPartialProcessing = async (taskId: number, quantity: number) => {
    try {
      await updatePackingTaskStatus(taskId, 'IN_PROGRESS', quantity);
      await fetchTasks(machineId);
    } catch (error: any) {
      console.error('Ошибка при частичной обработке:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Ошибка при частичной обработке';
      setNotification({ message: errorMessage, type: 'error' });
    }
  };
  
  // ��бработчик удаления элемента задания
  const handleDeleteItem = async (taskId: number) => {
    console.log(`Удаление элемента ${taskId}`);
    // Запрос подтверждения перед удалением
    if (window.confirm('Вы уверены, что хотите удалить этот элемент из сменного задания?')) {
      try {
        const success = await removeTask(taskId);
        if (success) {
          console.log(`Задание ${taskId} успешно удалено`);
        } else {
          alert('Произошла ошибка при удалении задания');
        }
      } catch (error) {
        console.error('Ошибка при удалении задания:', error);
        alert('Произошла ошибка при удалении задания');
      }
    }
  };
  
  // Обработчик изменения станка
  const handleMachineChange = async (taskId: number, targetMachineId: string) => {
    const machineIdNumber = parseInt(targetMachineId, 10);
    if (isNaN(machineIdNumber) || machineIdNumber === machineId) {
      return;
    }
    
    console.log(`Перемещение задания ${taskId} на станок ${machineIdNumber}`);
    
    try {
      const success = await transferTask(taskId, machineIdNumber);
      if (success) {
        const targetMachine = availableMachines.find(m => m.id === machineIdNumber);
        if (targetMachine) {
          alert(`Задание успешно передано на станок: ${targetMachine.name}`);
        }
      } else {
        alert('Произошла ошибка при перемещении задания');
      }
    } catch (error) {
      console.error('Ошибка при перемещении задания:', error);
      alert('Произошла ошибка при перемещении задания');
    }
  };
  
  // Маппинг статусов API к статусам UI
  const mapApiStatusToUiStatus = (status: string): TaskStatus => {
    switch (status.toUpperCase()) {
      case 'ON_MACHINE':
        return 'pending';
      case 'IN_PROGRESS':
        return 'processing';
      case 'COMPLETED':
        return 'completed';
      default:
        return 'pending';
    }
  };
  
  // Обработчик открытия модального окна приоритета
  const handleOpenPriorityModal = (taskId: number) => {
    const task = machineTasks.find(item => item.taskId === taskId);
    if (task) {
      setSelectedTaskForPriority(task);
      setIsPriorityModalOpen(true);
    }
  };
  
  // Обработчик изменения приоритета
  const handlePriorityChange = async (taskId: number, newPriority: number) => {
    try {
      const success = await updatePriority(taskId, newPriority);
      if (!success) {
        alert('Ошибка при обновлении приоритета');
      }
    } catch (error) {
      console.error('Ошибка при обновлении приоритета:', error);
      alert('Ошибка при обновлении приоритета');
    }
  };

  // Обработчик кнопки "В работу"
  const handleStartWork = async (taskId: number) => {
    try {
      await startPackingWork(taskId, machineId);
      // Перезагружаем задания для обновления статуса
      await fetchTasks(machineId);
    } catch (error: any) {
      console.error('Ошибка при начале работы:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Ошибка при начале работы';
      setNotification({ message: errorMessage, type: 'error' });
    }
  };

  // Обработчик кнопки "Готово"
  const handleCompleteWork = async (taskId: number) => {
    try {
      const task = machineTasks.find(t => t.taskId === taskId);
      const remainingQuantity = (task?.assignedQuantity || 0) - (task?.completedQuantity || 0);
      await updatePackingTaskStatus(taskId, 'COMPLETED', remainingQuantity);
      await fetchTasks(machineId);
    } catch (error: any) {
      console.error('Ошибка при завершении работы:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Ошибка при завершении работы';
      setNotification({ message: errorMessage, type: 'error' });
    }
  };

  // Функция для отображения индикатора приоритета
  const renderPriorityIndicator = (taskId: number, priority: number | null) => {
    if (priority === null || priority === 0) {
      return (
        <div 
          className={`${styles.priorityIndicator} ${styles.noPriority}`}
          onClick={() => handleOpenPriorityModal(taskId)}
          title="Нажмите для установки приоритета"
        >
          -
        </div>
      );
    }
    
    return (
      <div 
        className={`${styles.priorityIndicator} ${getPriorityClass(priority)}`}
        onClick={() => handleOpenPriorityModal(taskId)}
        title={`Приоритет: ${priority}. Нажмите для изменения`}
      >
        {priority}
      </div>
    );
  };
  
  // Функция для определения класса приоритета
  const getPriorityClass = (priority: number): string => {
    // 0 не считается приоритетом
    if (priority === 0) return styles.noPriority;
    // Чем меньше число, тем выше приоритет (1 - самый высокий)
    if (priority === 1) return styles.criticalPriority;
    if (priority === 2) return styles.highPriority;
    if (priority <= 4) return styles.mediumPriority;
    if (priority <= 6) return styles.normalPriority;
    if (priority <= 8) return styles.lowPriority;
    
    return styles.veryLowPriority;
  };
  
  // Функция для отображения статуса
  const renderStatusIndicator = (status: string) => {
    const uiStatus = mapApiStatusToUiStatus(status);
    
    let statusClass = '';
    let statusText = '';
    
    switch (uiStatus) {
      case 'pending':
        statusClass = styles.statusPending;
        statusText = 'Ожидание';
        break;
      case 'processing':
        statusClass = styles.statusProcessing;
        statusText = 'В обработке';
        break;
      case 'completed':
        statusClass = styles.statusCompleted;
        statusText = 'Завершено';
        break;
      default:
        statusClass = styles.statusPending;
        statusText = 'Ожидание';
    }
    
    return (
      <div className={`${styles.statusIndicator} ${statusClass}`}>
        {statusText}
      </div>
    );
  };
  
  // Обработчики для кнопок в подвале
  const handlePrintTask = () => {
    console.log('Печать сменного задания');
    // В реальном приложении здесь будет логика для печати или отображения предварительного просмотра
    alert('Подготовка документа для печати...');
  };
  
  const handleExportToExcel = () => {
    console.log('Экспорт в Excel');
    // В реальном приложении здесь будет логика экспорта данных в Excel
    alert('Экспорт данных в Excel...');
  };
  
  // Функция сортировки заданий по приоритету
  const sortedTasks = React.useMemo(() => {
    return [...machineTasks].sort((a, b) => {
      const priorityA = a.priority && a.priority > 0 ? a.priority : null;
      const priorityB = b.priority && b.priority > 0 ? b.priority : null;
      
      // Если у обеих задач есть приоритет, сортируем по приоритету (меньше = выше приоритет)
      if (priorityA !== null && priorityB !== null) {
        return priorityA - priorityB;
      }
      
      // Если только у одной задачи есть приоритет, она идет первой
      if (priorityA !== null && priorityB === null) {
        return -1;
      }
      if (priorityA === null && priorityB !== null) {
        return 1;
      }
      
      // Если у обеих задач нет приоритета, сортируем по ID
      return a.taskId - b.taskId;
    });
  }, [machineTasks]);
  
  return (
    <>
      <div className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}>
        <div className={styles.sidebarHeader}>
          <h2>Сменное задание: {machineName}</h2>
          <div className={styles.headerControls}>
            <button className={styles.closeButton} onClick={onClose}>×</button>
          </div>
        </div>
        
        <div className={styles.sidebarContent}>
          {tasksLoading ? (
            <div className={styles.loadingContainer}>
              <div className={styles.loadingSpinner}></div>
              <p className={styles.loadingText}>Загрузка данных сменного задания...</p>
            </div>
          ) : tasksError ? (
            <div className={styles.errorContainer}>
              <div className={styles.errorIcon}>⚠️</div>
              <h3 className={styles.errorTitle}>Ошибка загрузки данных</h3>
              <p className={styles.errorText}>{tasksError.message}</p>
              <button className={styles.retryButton} onClick={() => fetchTasks(machineId)}>
                Повторить загрузку
              </button>
            </div>
          ) : machineTasks.length === 0 ? (
            <div className={styles.emptyContainer}>
              <div className={styles.emptyIcon}>📋</div>
              <h3 className={styles.emptyTitle}>Нет сменных заданий</h3>
              <p className={styles.emptyText}>
                Для данного станка не назначено ни одного задания на текущую смену.
              </p>
            </div>
          ) : (
            <div className={styles.tableContainer}>
              <div className={styles.tableScrollContainer}>
                <table className={styles.tasksTable}>
                  <thead>
                  <tr>
                      <th className={styles.priorityColumn}>Приоритет</th>
                      <th >Заказ</th>
                      {/* <th>Номер партии</th> */}
                      <th >Артикул упаковки</th>
                      <th >Наименование упаковки</th>
                      <th >Назначено / Выполнено</th>
                      {/* <th>Процент выполнения</th> */}
                      {/* <th>Назначено</th> */}
                      <th className={styles.statusColumn}>Статус</th>
                      <th className={styles.actionsColumn}>Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedTasks.map(item => (
                      <tr key={item.taskId} className={styles[`status-${mapApiStatusToUiStatus(item.status)}`]}>
                        <td className={styles.priorityCell}>
                          {renderPriorityIndicator(item.taskId, item.priority)}
                        </td>
                        <td>{item.productionPackage?.order?.orderName || '-'}</td>
                         {/* <td>{item.productionPackage?.order?.batchNumber || '-'}</td  > */}
                        <td>{item.productionPackage?.packageCode || '-'}</td>
                        <td>{item.productionPackage?.packageName || '-'}</td>
                        <td className={styles.quantityCell}>{item.assignedQuantity || 0} / {item.completedQuantity || 0} шт.</td>
                        {/* <td>{item.productionPackage?.completionPercentage || 0}%</td> */}
                        {/* <td>{item.assignedAt ? new Date(item.assignedAt).toLocaleString('ru-RU') : '-'}</td> */}
                        <td className={styles.statusCell}>
                          {renderStatusIndicator(item.status)}
                        </td>
                        <td className={styles.actionsCell}>
                          <div className={styles.actionButtonsContainer}>
                            <button 
                              className={`${styles.actionButton} ${styles.inProgressButton}`}
                              onClick={() => handleStartWork(item.taskId)}
                              disabled={
                                mapApiStatusToUiStatus(item.status) === 'processing' || 
                                mapApiStatusToUiStatus(item.status) === 'completed'
                              }
                              title="В работу"
                            >
                              В работу
                            </button>
                            
                            <button 
                              className={`${styles.actionButton} ${styles.completedButton}`}
                              onClick={() => handleCompleteWork(item.taskId)}
                              disabled={mapApiStatusToUiStatus(item.status) !== 'processing'}
                              title="Готово"
                            >
                              Готово
                            </button>
                            
                            <button 
                              className={`${styles.actionButton} ${styles.partialButton}`}
                              onClick={() => handlePartialProcessing(item.taskId)}
                              disabled={mapApiStatusToUiStatus(item.status) !== 'processing'}
                              title="Частично"
                            >
                              Частично
                            </button>
                            
                            <select 
                              className={styles.machineSelect}
                              onChange={(e) => handleMachineChange(item.taskId, e.target.value)}
                              defaultValue={machineId.toString()}
                              disabled={mapApiStatusToUiStatus(item.status) === 'completed' || availableMachinesLoading}
                            >
                              {availableMachines.map(machine => (
                                <option key={machine.id} value={machine.id.toString()}>
                                  {machine.name}
                                </option>
                              ))}
                            </select>
                            
                            <button 
                              className={`${styles.actionButton} ${styles.deleteButton}`}
                              onClick={() => handleDeleteItem(item.taskId)}
                              title="Удалить из сменного задания"
                            >
                              Удалить
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
        
        <div className={styles.sidebarFooter}>
          <div className={styles.footerInfo}>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Всего позиций:</span>
              <span className={styles.infoValue}>{machineTasks.length}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Общее количество:</span>
              <span className={styles.infoValue}>
                {machineTasks.reduce((sum, item) => sum + (item.assignedQuantity || 0), 0)} шт.
              </span>
            </div>
          </div>
          {/* <div className={styles.footerButtons}>
            <button 
              className={styles.printButton} 
              onClick={handlePrintTask}
              disabled={machineTasks.length === 0}
            >
              Печать задания
            </button>
            <button 
              className={styles.exportButton} 
              onClick={handleExportToExcel}
              disabled={machineTasks.length === 0}
            >
              Экспорт в Excel
            </button>
          </div> */}
        </div>
      </div>
      
      {/* Модальное окно для частичной обработки */}
      <PartialProcessingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        taskItem={selectedTask}
        onConfirm={handleConfirmPartialProcessing}
      />
      
      {/* Модальное окно для редактирования приоритета */}
      <PriorityModal
        isOpen={isPriorityModalOpen}
        onClose={() => setIsPriorityModalOpen(false)}
        taskItem={selectedTaskForPriority}
        onConfirm={handlePriorityChange}
      />
      
      {/* Уведомления через портал */}
      {notification && createPortal(
        <div 
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            minWidth: '300px',
            maxWidth: '500px',
            padding: '16px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            zIndex: 10001,
            background: notification.type === 'error' 
              ? 'linear-gradient(135deg, #e74c3c, #c0392b)' 
              : 'linear-gradient(135deg, #2ecc71, #27ae60)',
            borderLeft: notification.type === 'error' 
              ? '4px solid #a93226' 
              : '4px solid #219653'
          }}
        >
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            color: 'white',
            fontSize: '14px',
            lineHeight: '1.4'
          }}>
            <span>{notification.message}</span>
            <button
              style={{
                background: 'none',
                border: 'none',
                color: 'white',
                fontSize: '18px',
                cursor: 'pointer',
                padding: '0',
                marginLeft: '12px',
                opacity: '0.8'
              }}
              onClick={() => setNotification(null)}
            >
              ×
            </button>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default TaskSidebar;