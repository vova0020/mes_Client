import React, { useState, useRef, useMemo } from 'react';
import styles from './MacinsDetailsTable.module.css';
import PalletsSidebar from '../MachinePalletsSidebar/MachinePalletsSidebar';
import DetailForm from '../../../../series/detail-form/DetailForm';
import { SearchAndSort, SortableHeader, SortConfig } from '../../../../../components/SearchAndSort';

// Моковые данные для таблицы
const mockDetailsData = [
  {
    id: 1,
    priority: 1,
    order: '1489 - АБВГДАБВГДАБВГД АБВГДАБВГД',
    pallet: 'ABCD-ABCD-38',
    materials: 'ЛДСП Дуб Сонома светлый - 16мм (50)\nЛДСП Дуб Сонома темный - 18мм (25)\nПМДФ - 16мм (15)',
    address: 'ABCD-ABCD-38',
    status: 'В работе',
    detailsOnPallet: 111,
    readyForProcessing: 50,
    completed: 30
  },
  {
    id: 2,
    priority: 2,
    order: '1490 - Заказ тестовый',
    pallet: 'EFGH-IJKL-42',
    materials: 'ЛДСП Белый - 18мм (100)',
    address: 'EFGH-IJKL-42',
    status: 'Начать/Завершить',
    detailsOnPallet: 200,
    readyForProcessing: 100,
    completed: 50
  },
  {
    id: 3,
    priority: 3,
    order: '1491 - Кухонный гарнитур',
    pallet: 'MNOP-QRST-55',
    materials: 'ЛДСП Венге - 16мм (75)',
    address: 'MNOP-QRST-55',
    status: 'МП подона',
    detailsOnPallet: 150,
    readyForProcessing: 75,
    completed: 25
  }
];

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
  
  // Используем моковые данные
  const tasks = mockDetailsData;
  const loading = 'success';
  const error = null;
  
  // Ref для контейнера таблицы
  const containerRef = useRef<HTMLDivElement>(null);

  // Показываем детали с анимацией после загрузки
  React.useEffect(() => {
    if (tasks.length > 0) {
      const timer = setTimeout(() => {
        setShowDetails(true);
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [tasks]);

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
  const handleArrowClick = (e: React.MouseEvent, taskId: number) => {
    e.stopPropagation();
    setActiveTaskId(taskId);
    setIsSidebarOpen(true);
  };

  // Обработчик закрытия сайдбара
  const handleCloseSidebar = () => {
    setIsSidebarOpen(false);
  };

  // Обработчик открытия маршрутного листа
  const handleOpenML = (palletId?: number) => {
    if (palletId) {
      setSelectedPalletId(palletId);
    }
    setIsMLSidebarOpen(true);
  };

  // Обработчик закрытия маршрутного листа
  const handleCloseMLSidebar = () => {
    setIsMLSidebarOpen(false);
    setSelectedPalletId(null);
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
      const searchText = `${task.order} ${task.pallet} ${task.materials} ${task.address} ${task.status}`.toLowerCase();
      return searchText.includes(searchTerm.toLowerCase());
    });

    result.sort((a, b) => {
      let aVal: any = (a as any)[sortConfig.field];
      let bVal: any = (b as any)[sortConfig.field];
      
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
      case 'В работе':
        return styles.statusInProgress;
      case 'Начать/Завершить':
        return styles.statusReady;
      case 'МП подона':
        return styles.statusPending;
      default:
        return '';
    }
  };

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
            <p>В данный момент отсутствуют задачи для этого станка</p>
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
              <SortableHeader field="detailsOnPallet" label="Деталей на поддоне" sortConfig={sortConfig} onSort={handleSort} />
              <SortableHeader field="readyForProcessing" label="Готово к обработке" sortConfig={sortConfig} onSort={handleSort} />
              <SortableHeader field="completed" label="Выполнено" sortConfig={sortConfig} onSort={handleSort} />
              <th>Действия</th>
              <th></th>
            </tr>
          </thead>
          <tbody className={showDetails ? styles.showDetails : styles.hideDetails}>
            {filteredAndSortedTasks.map((task, index) => (
              <tr
                key={task.id}
                className={`
                  ${activeTaskId === task.id ? styles.activeRow : ''}
                  ${styles.animatedRow}
                `}
                style={{ animationDelay: `${index * 50}ms` }}
                onClick={() => handleRowClick(task.id)}
              >
                <td>{task.priority}</td>
                <td>{task.order}</td>
                <td>{task.pallet}</td>
                <td className={styles.materialsCell}>
                  {task.materials.split('\n').map((line, i) => (
                    <div key={i}>{line}</div>
                  ))}
                </td>
                <td>{task.address}</td>
                <td>
                  <span className={`${styles.statusBadge} ${getStatusClass(task.status)}`}>
                    {task.status}
                  </span>
                </td>
                <td>{task.detailsOnPallet}</td>
                <td>{task.readyForProcessing}</td>
                <td>{task.completed}</td>
                <td className={styles.actionsCell}>
                  <button
                    className={`${styles.actionButton} ${styles.mlButton}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenML(task.id);
                    }}
                  >
                    МЛ поддона
                  </button>
                  {task.status === 'В работе' ? (
                    <button
                      className={`${styles.actionButton} ${styles.completedButton}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        console.log('Завершить', task.id);
                      }}
                    >
                      Завершить
                    </button>
                  ) : (
                    <button
                      className={`${styles.actionButton} ${styles.inProgressButton}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        console.log('Взять в работу', task.id);
                      }}
                    >
                      Взять в работу
                    </button>
                  )}
                </td>
                <td>
                  <button
                    className={styles.arrowButton}
                    onClick={(e) => handleArrowClick(e, task.id)}
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
          filteredAndSortedTasks.find(task => task.id === activeTaskId) || null : 
          null}
        detailId={activeTaskId}
        isOpen={isSidebarOpen}
        onClose={handleCloseSidebar}
        handleOpenML={handleOpenML}
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
