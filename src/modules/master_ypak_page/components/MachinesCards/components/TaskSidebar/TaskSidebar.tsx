
import React, { useState, useEffect } from 'react';
import styles from './TaskSidebar.module.css';
import useMachines from '../../../../../hooks/ypakMasterHook/useMachinesMaster';
import { MachineTask } from '../../../../../api/ypakMasterApi/machineMasterService';

// Типы статусов деталей
type TaskStatus = 'pending' | 'processing' | 'completed';

// Интерфейс для модального окна частичной обработки
interface PartialProcessingModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskItem: MachineTask | null;
  onConfirm: (taskId: number, quantity: number) => void;
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
  const maxQuantity = taskItem?.productionPackage?.quantity || 0;
  
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
          <button className={styles.modalCloseButton} onClick={onClose}>&times;</button>
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
            <span className={styles.modalLabel}>Доступно:</span>
            <span className={styles.modalValue}>{taskItem.productionPackage.quantity} шт.</span>
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
    availableMachines,
    availableMachinesLoading,
    fetchAvailableMachines
  } = useMachines();
  
  // Состояние для модального окна частичной обработки
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<MachineTask | null>(null);
  
  // Загрузка данных сменного задания при открытии
  useEffect(() => {
    if (isOpen && machineId) {
      // Загружаем задания для выбранного станка
      fetchTasks(machineId);
      
      // Загружаем список доступных станков
      fetchAvailableMachines();
    }
  }, [isOpen, machineId, fetchTasks, fetchAvailableMachines]);
  
  // Обработчик частичной обработки
  const handlePartialProcessing = (taskId: number) => {
    const task = machineTasks.find(item => item.taskId === taskId);
    if (task) {
      setSelectedTask(task);
      setIsModalOpen(true);
    }
  };
  
  // Обработчик подтверждения частичной обработки
  const handleConfirmPartialProcessing = (taskId: number, quantity: number) => {
    console.log(`Частичная обработка для элемента ${taskId}: ${quantity} шт.`);
    
    // Обрабатываем частичную обработку (в будущем может быть API)
    // Сейчас просто обновляем локальное состояние
    // Если количество становится <= 0, удаляем задание
    const task = machineTasks.find(t => t.taskId === taskId);
    if (task && task.productionPackage.quantity - quantity <= 0) {
      // Если все детали обработаны, удаляем задание
      handleDeleteItem(taskId);
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
  
  // Функция для отображения индикатора приоритета (числового)
  const renderPriorityIndicator = (priority: number | null) => {
    if (priority === null) {
      return (
        <div className={`${styles.priorityIndicator} ${styles.noPriority}`}>
          -
        </div>
      );
    }
    
    return (
      <div className={`${styles.priorityIndicator} ${getPriorityClass(priority)}`}>
        {priority}
      </div>
    );
  };
  
  // Функция для определения класса приоритета
  const getPriorityClass = (priority: number): string => {
    // Чем меньше число, тем выше приоритет (1 - самый высокий)
    if (priority === 1) return styles.highPriority;
    if (priority === 2) return styles.mediumPriority;
    if (priority === 3) return styles.lowPriority;
    if (priority > 3) return styles.veryLowPriority;
    
    return styles.normalPriority;
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
  const handleSortByPriority = () => {
    // Данную функцию оставляем как есть, поскольку сортировка 
    // выполняется на стороне клиента для уже полученных данных
    console.log('Сортировка по приоритету');
    // Сортировка будет происходить на сервере при следующем запросе
  };
  
  return (
    <>
      <div className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}>
        <div className={styles.sidebarHeader}>
          <h2>Сменное задание: {machineName}</h2>
          <div className={styles.headerControls}>
            <button 
              className={styles.sortButton} 
              onClick={handleSortByPriority}
              title="Сортировать по приоритету"
            >
              ↑↓
            </button>
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
                      <th >Кол-во</th>
                      {/* <th>Процент выполнения</th> */}
                      {/* <th>Назначено</th> */}
                      <th className={styles.statusColumn}>Статус</th>
                      <th className={styles.actionsColumn}>Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {machineTasks.map(item => (
                      <tr key={item.taskId} className={styles[`status-${mapApiStatusToUiStatus(item.status)}`]}>
                        <td className={styles.priorityCell}>
                          {renderPriorityIndicator(item.priority)}
                        </td>
                        <td>{item.productionPackage?.order?.orderName || '-'}</td>
                         {/* <td>{item.productionPackage?.order?.batchNumber || '-'}</td  > */}
                        <td>{item.productionPackage?.packageCode || '-'}</td>
                        <td>{item.productionPackage?.packageName || '-'}</td>
                        <td className={styles.quantityCell}>{item.productionPackage?.quantity || 0} шт.</td>
                        {/* <td>{item.productionPackage?.completionPercentage || 0}%</td> */}
                        {/* <td>{item.assignedAt ? new Date(item.assignedAt).toLocaleString('ru-RU') : '-'}</td> */}
                        <td className={styles.statusCell}>
                          {renderStatusIndicator(item.status)}
                        </td>
                        <td className={styles.actionsCell}>
                          <div className={styles.actionButtonsContainer}>
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
                {machineTasks.reduce((sum, item) => sum + item.productionPackage?.quantity, 0)} шт.
              </span>
            </div>
          </div>
          <div className={styles.footerButtons}>
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
          </div>
        </div>
      </div>
      
      {/* Модальное окно для частичной обработки */}
      <PartialProcessingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        taskItem={selectedTask}
        onConfirm={handleConfirmPartialProcessing}
      />
    </>
  );
};

export default TaskSidebar;