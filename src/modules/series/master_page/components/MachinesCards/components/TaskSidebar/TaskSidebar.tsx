
import React, { useState, useEffect } from 'react';
import styles from './TaskSidebar.module.css';
import useMachines from '../../../../../../hooks/masterPage/useMachinesMaster';
import { MachineTask } from '../../../../../api/masterPage/machineMasterService';
import { startPalletProcessing, completePalletProcessing } from '../../../../../api/machineApi/machinProductionPalletsService';

// Типы статусов деталей
type TaskStatus = 'PENDING' | 'BUFFERED' | 'ON_MACHINE' | 'IN_PROGRESS' | 'COMPLETED' | 'PARTIALLY_COMPLETED' ;

// Интерфейс для сгруппированной детали
interface GroupedDetail {
  detailArticle: string;
  detailName: string;
  detailMaterial: string;
  detailSize: string;
  orderName: string;
  priority: number | null;
  partId: number;
  totalQuantity: number;
  pallets: MachineTask[];
}

// Интерфейс для модального окна частичной обработки
interface PartialProcessingModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskItem: MachineTask | null;
  onConfirm: (taskId: number, quantity: number) => void;
}

// Интерфейс для модального окна редактирования приоритета
interface PriorityEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupedDetail: GroupedDetail | null;
  machineId: number;
  onConfirm: (partId: number, machineId: number, priority: number) => void;
}

interface TaskSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  machineId: number;
  machineName: string;
  onDataUpdate?: () => void;
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

// Компонент модального окна для редактирования приоритета
const PriorityEditModal: React.FC<PriorityEditModalProps> = ({ 
  isOpen, 
  onClose,
  groupedDetail,
  machineId,
  onConfirm
}) => {
  const [priority, setPriority] = useState<number>(0);
  
  // Устанавливаем текущий приоритет при открытии модального окна
  useEffect(() => {
    if (isOpen && groupedDetail) {
      setPriority(groupedDetail.priority || 0);
    }
  }, [isOpen, groupedDetail]);
  
  // Обработчик изменения приоритета
  const handlePriorityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value >= 0) {
      setPriority(value);
    }
  };
  
  // Обработчик подтверждения
  const handleConfirm = () => {
    if (groupedDetail && priority >= 0) {
      // Используем operationId первого поддона как partId
      const partId = groupedDetail.partId;
      if (partId) {
        onConfirm(partId, machineId, priority);
        onClose();
      }
    }
  };
  
  if (!isOpen || !groupedDetail) return null;
  
  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h3>Редактирование приоритета</h3>
          <button className={styles.modalCloseButton} onClick={onClose}>&times;</button>
        </div>
        
        <div className={styles.modalBody}>
          <div className={styles.modalInfoRow}>
            <span className={styles.modalLabel}>Деталь:</span>
            <span className={styles.modalValue}>{groupedDetail.detailName}</span>
          </div>
          
          <div className={styles.modalInfoRow}>
            <span className={styles.modalLabel}>Артикул:</span>
            <span className={styles.modalValue}>{groupedDetail.detailArticle}</span>
          </div>
          
          <div className={styles.modalInfoRow}>
            <span className={styles.modalLabel}>Материал:</span>
            <span className={styles.modalValue}>{groupedDetail.detailMaterial}</span>
          </div>
          
          <div className={styles.modalInfoRow}>
            <span className={styles.modalLabel}>Заказ:</span>
            <span className={styles.modalValue}>{groupedDetail.orderName}</span>
          </div>
          
          <div className={styles.modalInfoRow}>
            <span className={styles.modalLabel}>Текущий приоритет:</span>
            <span className={styles.modalValue}>{groupedDetail.priority || 'Не установлен'}</span>
          </div>
          
          <div className={styles.quantityInputContainer}>
            <label className={styles.quantityLabel} htmlFor="priority-input">
              Новый приоритет:
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
                onChange={handlePriorityChange}
                min={0}
                max={999}
              />
              <button 
                className={styles.quantityButton}
                onClick={() => priority < 999 && setPriority(priority + 1)}
                disabled={priority >= 999}
              >
                +
              </button>
            </div>
            <div className={styles.priorityHint}>
              Чем меньше число, тем выше приоритет (1 - самый высокий)
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
            disabled={priority < 0}
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
  machineName,
  onDataUpdate 
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
    updateStatus
  } = useMachines();
  
  // Состояние для модального окна частичной обработки
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<MachineTask | null>(null);
  
  // Состояние для модального окна редактирования приоритета
  const [isPriorityModalOpen, setIsPriorityModalOpen] = useState(false);
  const [selectedGroupForPriority, setSelectedGroupForPriority] = useState<GroupedDetail | null>(null);
  
  // Состояние для обработки операций с поддонами
  const [processingPalletId, setProcessingPalletId] = useState<number | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Состояние для отслеживания развернутых групп деталей
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  
  // Загрузка данных сменного задания при открытии
  useEffect(() => {
    if (isOpen && machineId) {
      // Загружаем задания для выбранного станка
      fetchTasks(machineId);
      
      // Загружаем список доступных станков
      fetchAvailableMachines();
      
      // Сбрасываем флаг начальной загрузки при открытии нового станка
      setIsInitialLoad(true);
    }
  }, [isOpen, machineId, fetchTasks, fetchAvailableMachines]);
  
  // Автоматическое разворачивание групп с высоким приоритетом только при первой загрузке
  useEffect(() => {
    if (machineTasks.length > 0 && isInitialLoad) {
      const groupedDetails = groupTasksByDetail(machineTasks);
      const highPriorityGroups = new Set<string>();
      
      groupedDetails.forEach(group => {
        const groupKey = `${group.detailArticle}-${group.detailName}-${group.orderName}`;
        // Разворачиваем группы с приоритетом 1 или 2 (высокий приоритет)
        if (group.priority !== null && group.priority <= 2) {
          highPriorityGroups.add(groupKey);
        }
      });
      
      setExpandedGroups(highPriorityGroups);
      setIsInitialLoad(false);
    }
  }, [machineTasks, isInitialLoad]);
  
  // Очистка сообщений через 5 секунд
  useEffect(() => {
    if (successMessage || errorMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
        setErrorMessage(null);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [successMessage, errorMessage]);
  
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
  
  // Функция для получения данных пользователя из localStorage
  const getUserData = () => {
    try {
      const userData = localStorage.getItem('user');
      if (!userData) {
        console.error('Данные пользователя не найдены в localStorage');
        return null;
      }
      const parsedData = JSON.parse(userData);
      console.log('Данные пользователя из localStorage:', parsedData);
      return parsedData;
    } catch (error) {
      console.error('Ошибка при получении данных пользователя:', error);
      return null;
    }
  };
  
  // Обработчик для кнопки "В работе"
  const handleStartWork = async (operationId: number) => {
    try {
      setProcessingPalletId(operationId);
      setErrorMessage(null);
      setSuccessMessage(null);
      
      const result = await updateStatus(operationId, 'IN_PROGRESS');
      if (result.success) {
        setSuccessMessage(`Поддон успешно переведен в статус "В работе"`);
        await fetchTasks(machineId);
        if (onDataUpdate) {
          onDataUpdate();
        }
      } else {
        setErrorMessage(result.error || 'Не удалось перевести поддон в работу');
      }
    } catch (error) {
      console.error(`Ошибка при переводе поддона ${operationId} в работу:`, error);
      setErrorMessage('Не удалось перевести поддон в работу');
    } finally {
      setProcessingPalletId(null);
    }
  };
  
  // Обработчик для кнопки "Готово"
  const handleComplete = async (operationId: number) => {
    try {
      setProcessingPalletId(operationId);
      setErrorMessage(null);
      setSuccessMessage(null);
      
      const result = await updateStatus(operationId, 'COMPLETED');
      if (result.success) {
        setSuccessMessage(`Поддон успешно отмечен как готовый`);
        await fetchTasks(machineId);
        if (onDataUpdate) {
          onDataUpdate();
        }
      } else {
        setErrorMessage(result.error || 'Не удалось отметить поддон как готовый');
      }
    } catch (error) {
      console.error(`Ошибка при отметке поддона ${operationId} как готовый:`, error);
      setErrorMessage('Не удалось отметить поддон как готовый');
    } finally {
      setProcessingPalletId(null);
    }
  };
  
  // Обработчик открытия модального окна редактирования приоритета
  const handleEditPriority = (group: GroupedDetail) => {
    setSelectedGroupForPriority(group);
    setIsPriorityModalOpen(true);
  };
  
  // Обработчик подтверждения изменения приоритета
  const handleConfirmPriorityChange = async (partId: number, machineId: number, priority: number) => {
    console.log(`Изменение приоритета для детали ${partId} на станке ${machineId}: ${priority}`);
    
    try {
      const success = await updatePriority(partId, machineId, priority);
      if (success) {
        // Перезагружаем задания для отображения обновленного приоритета
        await fetchTasks(machineId);
        alert('Приоритет успешно обновлен');
      } else {
        alert('Произошла ошибка при обновлении приоритета');
      }
    } catch (error) {
      console.error('Ошибка при обновлении приоритета:', error);
      alert('Произошла ошибка при обновлении приоритета');
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
  
  // Маппинг статусов API к статусам UI (теперь используем статусы напрямую с сервера)
  const mapApiStatusToUiStatus = (status: string): TaskStatus => {
    const upperStatus = status.toUpperCase();
    switch (upperStatus) {
      case 'PENDING':
        return 'PENDING';
      case 'BUFFERED':
        return 'BUFFERED';
      case 'ON_MACHINE':
        return 'ON_MACHINE';
      case 'IN_PROGRESS':
        return 'IN_PROGRESS';
      case 'COMPLETED':
        return 'COMPLETED';
      case 'PARTIALLY_COMPLETED':
        return 'PARTIALLY_COMPLETED';
      default:
        return 'PENDING';
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
  
  // Функция для отображения стату��а
  const renderStatusIndicator = (status: string) => {
    const uiStatus = mapApiStatusToUiStatus(status);
    
    let statusClass = '';
    let statusText = '';
    
    switch (uiStatus) {
      case 'PENDING':
        statusClass = styles.statusPending;
        statusText = 'Ожидание';
        break;
      case 'BUFFERED':
        statusClass = styles.statusBuffered;
        statusText = 'В буфере';
        break;
      case 'ON_MACHINE':
        statusClass = styles.statusOnMachine;
        statusText = 'На станке';
        break;
      case 'IN_PROGRESS':
        statusClass = styles.statusInProgress;
        statusText = 'В работе';
        break;
      case 'COMPLETED':
        statusClass = styles.statusCompleted;
        statusText = 'Завершено';
        break;
      case 'PARTIALLY_COMPLETED':
        statusClass = styles.statusPartiallyCompleted;
        statusText = 'Частично завершено';
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
  
  // Функция для группировки заданий по деталям
  const groupTasksByDetail = (tasks: MachineTask[]): GroupedDetail[] => {
    const grouped = tasks.reduce((acc, task) => {
      const key = `${task.detailArticle}-${task.detailName}-${task.detailMaterial}-${task.detailSize}-${task.orderName}`;
      const taskPriority = task.priority && task.priority > 0 ? task.priority : null;

      if (!acc[key]) {
        acc[key] = {
          detailArticle: task.detailArticle,
          detailName: task.detailName,
          detailMaterial: task.detailMaterial,
          detailSize: task.detailSize,
          orderName: task.orderName,
          priority: taskPriority,
          partId: task.partId,
          totalQuantity: 0,
          pallets: []
        };
      }
      
      acc[key].totalQuantity += task.quantity;
      acc[key].pallets.push(task);
      
      // Устанавливаем наивысший приоритет для группы (меньшее число = выше приоритет)
      if (taskPriority !== null && (acc[key].priority === null || taskPriority < acc[key].priority!)) {
        acc[key].priority = taskPriority;
      }
      
      return acc;
    }, {} as Record<string, GroupedDetail>);
    
    // Сортируем группы по приоритету (меньшее число = выше приоритет)
    return Object.values(grouped).sort((a, b) => {
      if (a.priority === null && b.priority === null) return 0;
      if (a.priority === null) return 1;
      if (b.priority === null) return -1;
      return a.priority - b.priority; 
    });
  };
  
  // Обработчик переключения развернутости группы
  const toggleGroupExpansion = (groupKey: string) => {
    const newExpandedGroups = new Set(expandedGroups);
    if (newExpandedGroups.has(groupKey)) {
      newExpandedGroups.delete(groupKey);
    } else {
      newExpandedGroups.add(groupKey);
    }
    setExpandedGroups(newExpandedGroups);
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
            {/* <button 
              className={styles.sortButton} 
              onClick={handleSortByPriority}
              title="Сортировать по приоритету"
            >
              ↑↓
            </button> */}
            <button 
              className={styles.expandAllButton} 
              onClick={() => {
                const groupedDetails = groupTasksByDetail(machineTasks);
                if (expandedGroups.size === groupedDetails.length) {
                  // Если все развернуты, сворачиваем все
                  setExpandedGroups(new Set());
                } else {
                  // Иначе разворачиваем все
                  const allGroups = new Set(
                    groupedDetails.map(group => 
                      `${group.detailArticle}-${group.detailName}-${group.orderName}`
                    )
                  );
                  setExpandedGroups(allGroups);
                }
              }}
              title={expandedGroups.size === groupTasksByDetail(machineTasks).length ? "Свернуть все" : "Развернуть все"}
            >
              {expandedGroups.size === groupTasksByDetail(machineTasks).length ? "▲▲" : "▼▼"}
            </button>
            <button className={styles.closeButton} onClick={onClose}>×</button>
          </div>
        </div>
        
        <div className={styles.sidebarContent}>
          {/* Отображение сообщений об успехе и ошибках */}
          {successMessage && (
            <div className={styles.successNotification}>
              <span>✓ {successMessage}</span>
            </div>
          )}
          
          {errorMessage && (
            <div className={styles.errorNotification}>
              <span>⚠️ {errorMessage}</span>
            </div>
          )}
          
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
            <div className={styles.groupedTasksContainer}>
              {groupTasksByDetail(machineTasks).map((group, groupIndex) => {
                const groupKey = `${group.detailArticle}-${group.detailName}-${group.orderName}`;
                const isExpanded = expandedGroups.has(groupKey);
                
                return (
                  <div 
                    key={groupKey} 
                    className={`${styles.detailGroup} ${group.priority !== null && group.priority <= 2 ? styles.highPriorityGroup : ''}`}
                    style={{ animationDelay: `${groupIndex * 0.1}s` }}
                  >
                    {/* Заголовок группы детали */}
                    <div 
                      className={styles.detailGroupHeader}
                      onClick={() => toggleGroupExpansion(groupKey)}
                    >
                      <div className={`${styles.expandIcon} ${isExpanded ? styles.expanded : ''}`}>
                        {isExpanded ? '▲' : '▼'}
                      </div>
                      
                      <div className={styles.detailGroupInfo}>
                        <div className={styles.detailGroupMainInfo}>
                          <div className={styles.detailGroupPriority}>
                            {renderPriorityIndicator(group.priority)}
                          </div>
                          <div className={styles.detailGroupTitle}>
                            <span className={styles.detailName}>{group.detailName}</span>
                            <span className={styles.detailArticle}>({group.detailArticle})</span>
                          </div>
                          <button 
                            className={styles.editPriorityButton}
                            onClick={(e) => {
                              e.stopPropagation(); // Предотвращаем сворачивание/разворачивание группы
                              handleEditPriority(group);
                            }}
                            title="Редактировать приоритет"
                          >
                            ✏️
                          </button>
                        </div>
                        
                        <div className={styles.detailGroupSecondaryInfo}>
                          <span className={styles.orderName}>Заказ: {group.orderName}</span>
                          <span className={styles.detailMaterial}>Материал: {group.detailMaterial}</span>
                          <span className={styles.detailSize}>Размер: {group.detailSize}</span>
                          <span className={styles.totalQuantity}>
                            Всего: {group.totalQuantity} шт. ({group.pallets.length} поддонов)
                          </span>
                          <span className={styles.statusSummary}>
                            {(() => {
                              const statusCounts = group.pallets.reduce((acc, pallet) => {
                                const status = mapApiStatusToUiStatus(pallet.status);
                                acc[status] = (acc[status] || 0) + 1;
                                return acc;
                              }, {} as Record<TaskStatus, number>);
                              
                              const parts = [];
                              if (statusCounts.PENDING) parts.push(`Ожидание: ${statusCounts.PENDING}`);
                              if (statusCounts.BUFFERED) parts.push(`В буфере: ${statusCounts.BUFFERED}`);
                              if (statusCounts.ON_MACHINE) parts.push(`На станке: ${statusCounts.ON_MACHINE}`);
                              if (statusCounts.IN_PROGRESS) parts.push(`В работе: ${statusCounts.IN_PROGRESS}`);
                              if (statusCounts.PARTIALLY_COMPLETED) parts.push(`Частично: ${statusCounts.PARTIALLY_COMPLETED}`);
                              if (statusCounts.COMPLETED) parts.push(`Готово: ${statusCounts.COMPLETED}`);
                              
                              return parts.join(' | ');
                            })()}
                          </span>
                          <div className={styles.progressContainer}>
                            {(() => {
                              const completedCount = group.pallets.filter(p => 
                                mapApiStatusToUiStatus(p.status) === 'COMPLETED'
                              ).length;
                              const partiallyCompletedCount = group.pallets.filter(p => 
                                mapApiStatusToUiStatus(p.status) === 'PARTIALLY_COMPLETED'
                              ).length;
                              const totalProgress = completedCount + (partiallyCompletedCount * 0.5); // Частично завершенные считаем как 50%
                              const progressPercent = Math.round((totalProgress / group.pallets.length) * 100);
                              
                              return (
                                <>
                                  <div className={styles.progressBar}>
                                    <div 
                                      className={styles.progressFill} 
                                      style={{ width: `${progressPercent}%` }}
                                    />
                                  </div>
                                  <span className={styles.progressText}>
                                    {completedCount}/{group.pallets.length} ({progressPercent}%)
                                    {partiallyCompletedCount > 0 && ` + ${partiallyCompletedCount} частично`}
                                  </span>
                                </>
                              );
                            })()}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Список поддонов (отображается при развертывании) */}
                    {isExpanded && (
                      <div className={styles.palletsContainer}>
                        <div className={styles.palletsHeader}>
                          <span className={styles.palletHeaderItem}>№ поддона</span>
                          <span className={styles.palletHeaderItem}>Количество</span>
                          {/* <span className={styles.palletHeaderItem}>Адрес</span> */}
                          <span className={styles.palletHeaderItem}>Статус</span>
                          <span className={styles.palletHeaderItem}>Действия</span>
                        </div>
                        
                        {group.pallets.map(pallet => (
                          <div 
                            key={pallet.operationId} 
                            className={`${styles.palletRow} ${styles[`status-${mapApiStatusToUiStatus(pallet.status).toLowerCase()}`]}`}
                          >
                            <div className={styles.palletInfo}>
                              <span className={styles.palletName}>{pallet.palletName}</span>
                              <span className={styles.palletQuantity}>{pallet.quantity} шт.</span>
                              <div className={styles.palletStatus}>
                                {renderStatusIndicator(pallet.status)}
                              </div>
                            </div>
                            
                            <div className={styles.palletActions}>
                              <button 
                                className={`${styles.actionButton} ${styles.inProgressButton}`}
                                onClick={() => handleStartWork(pallet.operationId)}
                                disabled={processingPalletId === pallet.operationId || 
                                         mapApiStatusToUiStatus(pallet.status) === 'IN_PROGRESS' ||
                                         mapApiStatusToUiStatus(pallet.status) === 'COMPLETED'}
                                title="В работе"
                              >
                                В работе
                              </button>
                              
                              <button 
                                className={`${styles.actionButton} ${styles.completedButton}`}
                                onClick={() => handleComplete(pallet.operationId)}
                                disabled={processingPalletId === pallet.operationId || 
                                         mapApiStatusToUiStatus(pallet.status) === 'COMPLETED' ||
                                         mapApiStatusToUiStatus(pallet.status) === 'PENDING' ||
                                         !mapApiStatusToUiStatus(pallet.status) ||
                                         mapApiStatusToUiStatus(pallet.status) !== 'IN_PROGRESS'}
                                title="Готово"
                              >
                                Готово
                              </button>
             
                              <select 
                                className={styles.machineSelect}
                                onChange={(e) => handleMachineChange(pallet.operationId, e.target.value)}
                                defaultValue={machineId.toString()}
                                disabled={mapApiStatusToUiStatus(pallet.status) === 'COMPLETED' || availableMachinesLoading}
                              >
                                {availableMachines.map(machine => (
                                  <option key={machine.id} value={machine.id}>
                                    {machine.name}
                                  </option>
                                ))}
                              </select>
                              
                              <button 
                                className={`${styles.actionButton} ${styles.deleteButton}`}
                                onClick={() => handleDeleteItem(pallet.operationId)}
                                title="Удалить из сменного задания"
                              >
                                Удалить
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        <div className={styles.sidebarFooter}>
          <div className={styles.footerInfo}>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Деталей:</span>
              <span className={styles.infoValue}>{groupTasksByDetail(machineTasks).length}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Поддонов:</span>
              <span className={styles.infoValue}>{machineTasks.length}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Общее количество:</span>
              <span className={styles.infoValue}>
                {machineTasks.reduce((sum, item) => sum + item.quantity, 0)} шт.
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
      <PriorityEditModal
        isOpen={isPriorityModalOpen}
        onClose={() => setIsPriorityModalOpen(false)}
        groupedDetail={selectedGroupForPriority}
        machineId={machineId}
        onConfirm={handleConfirmPriorityChange}
      />
    </>
  );
};

export default TaskSidebar;