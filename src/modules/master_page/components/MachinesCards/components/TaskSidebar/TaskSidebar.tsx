
import React, { useState, useEffect } from 'react';
import styles from './TaskSidebar.module.css';
import useMachines from '../../../../../hooks/masterPage/useMachinesMaster';
import { MachineTask } from '../../../../../api/masterPage/machineMasterService';

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
  const maxQuantity = taskItem?.quantity || 0;
  
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
      onConfirm(taskItem.operationId, quantity);
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
            <span className={styles.modalLabel}>Деталь:</span>
            <span className={styles.modalValue}>{taskItem.detailName}</span>
          </div>
          
          <div className={styles.modalInfoRow}>
            <span className={styles.modalLabel}>Артикул:</span>
            <span className={styles.modalValue}>{taskItem.detailArticle}</span>
          </div>
          
          <div className={styles.modalInfoRow}>
            <span className={styles.modalLabel}>Материал:</span>
            <span className={styles.modalValue}>{taskItem.detailMaterial}</span>
          </div>
          
          <div className={styles.modalInfoRow}>
            <span className={styles.modalLabel}>Поддон:</span>
            <span className={styles.modalValue}>{taskItem.palletName}</span>
          </div>
          
          <div className={styles.modalInfoRow}>
            <span className={styles.modalLabel}>Доступно:</span>
            <span className={styles.modalValue}>{taskItem.quantity} шт.</span>
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
  const handlePartialProcessing = (operationId: number) => {
    const task = machineTasks.find(item => item.operationId === operationId);
    if (task) {
      setSelectedTask(task);
      setIsModalOpen(true);
    }
  };
  
  // Обработчик подтверждения частичной обработки
  const handleConfirmPartialProcessing = (operationId: number, quantity: number) => {
    console.log(`Частичная обработка для элемента ${operationId}: ${quantity} шт.`);
    
    // Обрабатываем частичную обработку (в будущем может быть API)
    // Сейчас просто обновляем локальное состояние
    // Если количество становится <= 0, удаляем задание
    const task = machineTasks.find(t => t.operationId === operationId);
    if (task && task.quantity - quantity <= 0) {
      // Если все детали обработаны, удаляем задание
      handleDeleteItem(operationId);
    }
  };
  
  // Обработчик удаления элемента задания
  const handleDeleteItem = async (operationId: number) => {
    console.log(`Удаление элемента ${operationId}`);
    // Запрос подтверждения перед удалением
    if (window.confirm('Вы уверены, что хотите удалить этот элемент из сменного задания?')) {
      try {
        const success = await removeTask(operationId);
        if (success) {
          console.log(`Задание ${operationId} успешно удалено`);
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
  const handleMachineChange = async (operationId: number, targetMachineId: string) => {
    const machineIdNumber = parseInt(targetMachineId, 10);
    if (isNaN(machineIdNumber) || machineIdNumber === machineId) {
      return;
    }
    
    console.log(`Перемещение задания ${operationId} на станок ${machineIdNumber}`);
    
    try {
      const success = await transferTask(operationId, machineIdNumber);
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
                      <th>Заказ</th>
                      <th>Артикул</th>
                      <th>Наименование</th>
                      <th>Материал</th>
                      <th>Размер</th>
                      <th>№ поддона</th>
                      <th>Кол-во</th>
                      <th className={styles.statusColumn}>Статус</th>
                      <th className={styles.actionsColumn}>Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {machineTasks.map(item => (
                      <tr key={item.operationId} className={styles[`status-${mapApiStatusToUiStatus(item.status)}`]}>
                        <td className={styles.priorityCell}>
                          {renderPriorityIndicator(item.priority)}
                        </td>
                        <td>{item.orderName}</td>
                        <td>{item.detailArticle}</td>
                        <td>{item.detailName}</td>
                        <td>{item.detailMaterial}</td>
                        <td>{item.detailSize}</td>
                        <td className={styles.palletCell}>{item.palletName}</td>
                        <td className={styles.quantityCell}>{item.quantity} шт.</td>
                        <td className={styles.statusCell}>
                          {renderStatusIndicator(item.status)}
                        </td>
                        <td className={styles.actionsCell}>
                          <div className={styles.actionButtonsContainer}>
                            <button 
                              className={`${styles.actionButton} ${styles.partialButton}`}
                              onClick={() => handlePartialProcessing(item.operationId)}
                              title="Частичная обработка"
                              disabled={mapApiStatusToUiStatus(item.status) === 'completed'}
                            >
                              Частично
                            </button>
                            
                            <select 
                              className={styles.machineSelect}
                              onChange={(e) => handleMachineChange(item.operationId, e.target.value)}
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
                              onClick={() => handleDeleteItem(item.operationId)}
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
                {machineTasks.reduce((sum, item) => sum + item.quantity, 0)} шт.
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