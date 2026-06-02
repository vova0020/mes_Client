import React, { useState, useRef, useMemo } from 'react';
import styles from './MacinsDetailsTable.module.css';
import PalletsSidebar from '../MachinePalletsSidebar/MachinePalletsSidebar';
import DetailForm from '../../../../series/detail-form/DetailForm';
import { SearchAndSort, SortableHeader, SortConfig } from '../../../../../components/SearchAndSort';
import { useMachineTasks } from '../../../../hooks/custom/machine-tasks/useMachineTasks';
import { Task, machineTasksApi } from '../../../../api/custom/machine-tasks/machineTasksApi';

const DetailsTable: React.FC = () => {
  // Состояние для поиска и сортировки
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ field: 'priority', direction: 'asc' });
  
  // Состояние для отслеживания активной задачи
  const [activeTaskId, setActiveTaskId] = useState<number | null>(null);
  
  // Состояние для анимации (показывать/скрывать детали)
  const [showDetails, setShowDetails] = useState(false);
  
  // Состояние для боковой панели поддонов
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Состояние для боковой панели маршрутного листа
  const [isMLSidebarOpen, setIsMLSidebarOpen] = useState(false);
  const [selectedPalletId, setSelectedPalletId] = useState<number | null>(null);
  
  // Состояние для загрузки действий
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  
  // Используем реальный API
  const {
    tasks,
    parts,
    loading,
    error,
    selectedPallet,
    machineId,
    selectedStageId,
    loadTasks,
    loadParts,
    refetch,
    isSocketConnected
  } = useMachineTasks();
  
  // Ref для контейнера таблицы
  const containerRef = useRef<HTMLDivElement>(null);

  // Показываем детали с анимацией после загрузки
  React.useEffect(() => {
    if (loading === 'success' && tasks.length > 0) {
      const timer = setTimeout(() => {
        setShowDetails(true);
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [tasks, loading]);

  // Обработчик клика по строке таблицы с возможностью сброса выбора
  const handleRowClick = (taskId: number) => {
    if (activeTaskId === taskId) {
      setActiveTaskId(null);
      setIsSidebarOpen(false);
    } else {
      setActiveTaskId(taskId);
    }
  };

  // Обработчик клика по кнопке-стрелке для открытия сайдбара
  const handleArrowClick = async (e: React.MouseEvent, task: Task) => {
    e.stopPropagation();
    setActiveTaskId(task.customPalletId);
    setIsSidebarOpen(true);
    // Загружаем детали поддона
    await loadParts(task.customPalletId);
  };

  // Обработчик закрытия сайдбара
  const handleCloseSidebar = () => {
    setIsSidebarOpen(false);
  };

  // Обработчик открытия маршрутного листа
  const handleOpenML = async (customPalletId?: number) => {
    if (customPalletId) {
      setSelectedPalletId(customPalletId);
      // Загружаем детали поддона если еще не загружены
      if (selectedPallet !== customPalletId) {
        await loadParts(customPalletId);
      }
    }
    setIsMLSidebarOpen(true);
  };

  // Обработчик закрытия маршрутного листа
  const handleCloseMLSidebar = () => {
    setIsMLSidebarOpen(false);
    setSelectedPalletId(null);
  };

  // Обработчик обновления данных после действий с поддоном/деталями
  const handleRefresh = async () => {
    await refetch();
    // Если открыт сайдбар с деталями, обновляем и их
    if (activeTaskId) {
      await loadParts(activeTaskId);
    }
  };

  // Обработчик для взятия поддона в работу
  const handleStartPallet = async (task: Task) => {
    if (actionLoading) return;
    
    try {
      setActionLoading(true);
      await machineTasksApi.startPallet(task.assignmentId);
      console.log('Поддон взят в работу:', task.assignmentId);
      await handleRefresh();
    } catch (error) {
      console.error('Ошибка при взятии поддона в работу:', error);
      alert('Ошибка при взятии поддона в работу');
    } finally {
      setActionLoading(false);
    }
  };

  // Обработчик для завершения поддона
  const handleCompletePallet = async (task: Task) => {
    if (actionLoading) return;
    
    try {
      setActionLoading(true);
      await machineTasksApi.completePallet(task.assignmentId);
      console.log('Работа над поддоном завершена:', task.assignmentId);
      await handleRefresh();
    } catch (error) {
      console.error('Ошибка при завершении работы над поддоном:', error);
      alert('Ошибка при завершении работы над поддоном');
    } finally {
      setActionLoading(false);
    }
  };

  // Обработчик сортировки
  const handleSort = (field: string) => {
    setSortConfig(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Фильтрация и сортировка задач
  const filteredAndSortedTasks = useMemo(() => {
    let result = tasks.filter(task => {
      const searchText = `${task.order.orderNumber} ${task.order.orderName} ${task.pallet} ${task.materials} ${task.address} ${task.status}`.toLowerCase();
      return searchText.includes(searchTerm.toLowerCase());
    });

    result.sort((a, b) => {
      let aVal: any;
      let bVal: any;
      
      if (sortConfig.field === 'order') {
        aVal = a.order.orderNumber;
        bVal = b.order.orderNumber;
      } else {
        aVal = (a as any)[sortConfig.field];
        bVal = (b as any)[sortConfig.field];
      }
      
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortConfig.direction === 'asc' 
          ? aVal.localeCompare(bVal) 
          : bVal.localeCompare(aVal);
      }
      
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
      }
      
      return 0;
    });

    return result;
  }, [tasks, searchTerm, sortConfig]);

  // Функция для получения класса статуса
  const getStatusClass = (status: string): string => {
    switch (status) {
      case 'NOT_PROCESSED':
        return styles.statusPending;
      case 'PENDING':
        return styles.statusReady;
      case 'IN_PROGRESS':
        return styles.statusInProgress;
      case 'COMPLETED':
        return styles.statusCompleted;
      default:
        return '';
    }
  };

  // Функция для получения отображаемого статуса
  const getDisplayStatus = (status: string): string => {
    switch (status) {
      case 'NOT_PROCESSED':
        return 'Не обработано';
      case 'PENDING':
        return 'Готово к обработке';
      case 'IN_PROGRESS':
        return 'В работе';
      case 'COMPLETED':
        return 'Завершено';
      default:
        return status;
    }
  };

  // Показываем лоадер во время загрузки
  if (loading === 'loading') {
    return (
      <div className={styles.detailsContainer}>
        <h2 className={styles.title}>Информация о деталях</h2>
        <div className={styles.stateContainer}>
          <div className={styles.loadingSpinner}>
            <div className={styles.spinner}></div>
          </div>
          <div className={styles.loadingMessage}>
            <h3>Загрузка заданий...</h3>
            <p>Подключение к серверу: {isSocketConnected ? '✅' : '❌'}</p>
          </div>
        </div>
      </div>
    );
  }

  // Показываем ошибку если есть
  if (loading === 'error' || error) {
    return (
      <div className={styles.detailsContainer}>
        <h2 className={styles.title}>Информация о деталях</h2>
        <div className={styles.stateContainer}>
          <div className={styles.errorIcon}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 9V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 17H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
            </svg>
          </div>
          <div className={styles.errorMessage}>
            <h3>Ошибка загрузки</h3>
            <p>{error?.message || 'Неизвестная ошибка'}</p>
            <button onClick={loadTasks} className={styles.retryButton}>Попробовать снова</button>
          </div>
        </div>
      </div>
    );
  }

  // Если нет задач для отображения
  if (tasks.length === 0) {
    return (
      <div className={styles.detailsContainer}>
        <h2 className={styles.title}>Информация о деталях</h2>
        <div className={styles.stateContainer}>
          <div className={styles.emptyIcon}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 5H5C3.89543 5 3 5.89543 3 7V17C3 18.1046 3.89543 19 5 19H19C20.1046 19 21 18.1046 21 17V7C21 5.89543 20.1046 5 19 5Z" stroke="currentColor" strokeWidth="2" />
              <path d="M12 10V14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M10 12H14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <div className={styles.emptyMessage}>
            <h3>Нет доступных задач</h3>
            <p>В данный момент отсутствуют задачи для этого станка на выбранном этапе</p>
            {!selectedStageId && <p>Выберите этап в селекторе</p>}
            <p>Подключение к серверу: {isSocketConnected ? '✅' : '❌'}</p>
          </div>
        </div>
      </div>
    );
  }

  // Если есть задачи для отображения
  return (
    <div className={styles.detailsContainer} ref={containerRef}>
      <h2 className={styles.title}>Информация о деталях</h2>

      <SearchAndSort
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        sortConfig={sortConfig}
        onSortChange={handleSort}
        searchPlaceholder="Поиск по заказу, поддону, материалу, адресу, статусу..."
      />

      <div className={styles.tableContainer}>
        <table className={styles.detailsTable}>
          <thead>
            <tr>
              <SortableHeader field="priority" label="Приоритет" sortConfig={sortConfig} onSort={handleSort} />
              <SortableHeader field="order" label="Заказ" sortConfig={sortConfig} onSort={handleSort} />
              <SortableHeader field="pallet" label="Поддон" sortConfig={sortConfig} onSort={handleSort} />
              <SortableHeader field="materials" label="Материалы" sortConfig={sortConfig} onSort={handleSort} />
              <SortableHeader field="address" label="Адрес" sortConfig={sortConfig} onSort={handleSort} />
              <SortableHeader field="status" label="Статус" sortConfig={sortConfig} onSort={handleSort} />
              <SortableHeader field="totalQuantity" label="Деталей на поддоне" sortConfig={sortConfig} onSort={handleSort} />
              <SortableHeader field="readyToProcess" label="Готово к обработке" sortConfig={sortConfig} onSort={handleSort} />
              <SortableHeader field="completed" label="Выполнено" sortConfig={sortConfig} onSort={handleSort} />
              <th>Действия</th>
              <th></th>
            </tr>
          </thead>
          <tbody className={showDetails ? styles.showDetails : styles.hideDetails}>
            {filteredAndSortedTasks.map((task, index) => (
              <tr
                key={task.customPalletId}
                className={`
                  ${activeTaskId === task.customPalletId ? styles.activeRow : ''}
                  ${styles.animatedRow}
                `}
                style={{ animationDelay: `${index * 50}ms` }}
                onClick={() => handleRowClick(task.customPalletId)}
              >
                <td>{task.priority}</td>
                <td>{task.order.orderNumber} - {task.order.orderName}</td>
                <td>{task.pallet}</td>
                <td className={styles.materialsCell}>
                  {task.materials.split(',').map((material, i) => (
                    <div key={i}>{material.trim()}</div>
                  ))}
                </td>
                <td>{task.address}</td>
                <td>
                  <span className={`${styles.statusBadge} ${getStatusClass(task.status)}`}>
                    {getDisplayStatus(task.status)}
                  </span>
                </td>
                <td>{task.totalQuantity}</td>
                <td>{task.readyToProcess}</td>
                <td>{task.completed}</td>
                <td className={styles.actionsCell}>
                  <button
                    className={`${styles.actionButton} ${styles.mlButton}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenML(task.customPalletId);
                    }}
                  >
                    МЛ поддона
                  </button>
                  {task.status === 'COMPLETED' ? (
                    <button
                      className={`${styles.actionButton} ${styles.completedButton}`}
                      disabled
                    >
                      Завершено
                    </button>
                  ) : task.status === 'IN_PROGRESS' ? (
                    <button
                      className={`${styles.actionButton} ${styles.completedButton}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCompletePallet(task);
                      }}
                      disabled={actionLoading}
                    >
                      {actionLoading ? 'Обработка...' : 'Завершить'}
                    </button>
                  ) : task.status === 'PENDING' ? (
                    <button
                      className={`${styles.actionButton} ${styles.inProgressButton}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartPallet(task);
                      }}
                      disabled={actionLoading}
                    >
                      {actionLoading ? 'Обработка...' : 'Взять в работу'}
                    </button>
                  ) : (
                    <button
                      className={`${styles.actionButton} ${styles.inProgressButton}`}
                      disabled
                    >
                      Не готово
                    </button>
                  )}
                </td>
                <td>
                  <button
                    className={styles.arrowButton}
                    onClick={(e) => handleArrowClick(e, task)}
                  >
                    &#10095;
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Боковая панель поддонов */}
      <PalletsSidebar
        detailInfo={activeTaskId ?
          filteredAndSortedTasks.find(task => task.customPalletId === activeTaskId) || null :
          null}
        detailId={activeTaskId}
        isOpen={isSidebarOpen}
        onClose={handleCloseSidebar}
        handleOpenML={handleOpenML}
        parts={parts}
        loading={loading}
        onRefresh={handleRefresh}
      />
      
      {/* Боковая панель маршрутного листа */}
      <DetailForm 
        isOpen={isMLSidebarOpen} 
        onClose={handleCloseMLSidebar}
        palletId={selectedPalletId || undefined}
      />
    </div>
  );
};

export default DetailsTable;
