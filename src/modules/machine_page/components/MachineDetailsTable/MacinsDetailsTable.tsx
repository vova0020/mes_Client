import React, { useState, useRef, useMemo } from 'react';
import styles from './MacinsDetailsTable.module.css';
import { useDetails } from '../../../hooks/machinhook/useDetails';
import PalletsSidebar from '../MachinePalletsSidebar/MachinePalletsSidebar';
import DetailForm from '../../../detail-form/DetailForm';
import { SearchAndSort, SortableHeader, SortConfig } from '../../../../components/SearchAndSort';

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
  // Состояние для позиции сайдбара
  const [sidebarPosition, setSidebarPosition] = useState({ top: 120, right: 20 });
  
  // Состояние для боковой панели маршрутного листа
  const [isMLSidebarOpen, setIsMLSidebarOpen] = useState(false);
  const [selectedPalletId, setSelectedPalletId] = useState<number | null>(null);
  
  // Используем хук для получения данных о задачах
  const { 
    machineDetails, 
    tasks, 
    loading, 
    error, 
    refetch 
  } = useDetails();
  
  // Ref для контейнера таблицы
  const containerRef = useRef<HTMLDivElement>(null);

  // Сортируем задачи: сначала те, у которых есть приоритет (по возрастанию числа), затем без приоритета
  const sortedTasks = useMemo(() => {
    if (!tasks || tasks.length === 0) return tasks;

    const getPri = (t: any) => {
      // Считаем, что пустые строки, undefined, null и 0 (а также отрицательные числа) = отсутствие приоритета
      if (t.priority === null || t.priority === undefined || t.priority === '') return null;
      const n = Number(t.priority);
      if (Number.isNaN(n)) return null;
      // Приоритеты считаются от 1. Если значение < 1 (включая 0), считаем, что приоритета нет.
      if (n < 1) return null;
      return n;
    };

    // создаём копию, чтобы не мутировать исходный массив
    return [...tasks].sort((a, b) => {
      const pa = getPri(a);
      const pb = getPri(b);

      // оба приоритета отсутствуют — сохраняем относительный порядок
      if (pa === null && pb === null) return 0;
      // только a без приоритета — он должен идти ниже
      if (pa === null) return 1;
      // только b без приоритета — b ниже
      if (pb === null) return -1;

      // оба имеют приоритет — сортируем по числу (меньшее — выше)
      return pa - pb;
    });
  }, [tasks]);

  // Показываем детали с анимацией после загрузки
  React.useEffect(() => {
    if (loading === 'success' && tasks.length > 0) {
      // Небольшая задержка перед показом деталей для более заметной анимации
      const timer = setTimeout(() => {
        setShowDetails(true);
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [loading, tasks]);

  // Обработчик клика по строке таблицы с возможностью сброса выбора
  const handleRowClick = (taskId: number) => {
    // Если нажали на уже выбранную строку, сбрасываем выбор
    if (activeTaskId === taskId) {
      setActiveTaskId(null);
      setIsSidebarOpen(false);
    } else {
      // Иначе выбираем новую строку
      setActiveTaskId(taskId);
    }
  };

  // Обработчик клика по кнопке "Чертеж"
  const handleDrawingClick = (e: React.MouseEvent, detailId: number) => {
    e.stopPropagation(); // Предотвращаем всплытие события
    console.log(`Открыть чертеж для детали ${detailId}`);
  };

  // Обработчик клика по кнопке-стрелке для открытия сайдбара
  const handleArrowClick = (e: React.MouseEvent, taskId: number, buttonElement: HTMLButtonElement) => {
    e.stopPropagation(); // Предотвращаем всплытие события
    
    // Получаем позицию кнопки для позиционирования сайдбара
    const rect = buttonElement.getBoundingClientRect();
    const top = rect.top;
    const right = window.innerWidth - rect.right + buttonElement.offsetWidth;
    
    // Устанавливаем активную задачу
    setActiveTaskId(taskId);
    // Устанавливаем позицию сайдбара
    setSidebarPosition({ top, right });
    // Открываем сайдбар
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
    let result = sortedTasks.filter(task => {
      const searchText = `${task.order.runNumber} ${task.order.name} ${task.detail.article} ${task.detail.name} ${task.detail.material} ${task.detail.size}`.toLowerCase();
      return searchText.includes(searchTerm.toLowerCase());
    });

    if (sortConfig.field !== 'priority') {
      result.sort((a, b) => {
        let aVal: any, bVal: any;
        
        if (sortConfig.field.includes('.')) {
          const [obj, field] = sortConfig.field.split('.');
          aVal = (a as any)[obj][field];
          bVal = (b as any)[obj][field];
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
    }

    return result;
  }, [sortedTasks, searchTerm, sortConfig]);

  // Отображаем сообщение о загрузке
  if (loading === 'loading') {
    return (
      <div className={styles.detailsContainer}>
        <h2 className={styles.title}>Информация о деталях</h2>
        <div className={styles.stateContainer}>
          <div className={styles.loadingSpinner}></div>
          <div className={styles.loadingMessage}>
            <h3>Загрузка деталей</h3>
            <p>Пожалуйста, подождите...</p>
          </div>
        </div>
      </div>
    );
  }

  // Отображаем сообщение об ошибке
  if (error) {
    console.error("Ошибка в компоненте DetailsTable:", error);
    return (
      <div className={styles.detailsContainer}>
        <h2 className={styles.title}>Информация о деталях</h2>
        <div className={styles.stateContainer}>
          <div className={styles.errorIcon}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 4C7.58172 4 4 7.58172 4 12C4 16.4183 7.58172 20 12 20C16.4183 20 20 16.4183 20 12C20 7.58172 16.4183 4 12 4Z" stroke="currentColor" strokeWidth="2" />
              <path d="M12 8V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <circle cx="12" cy="16" r="1" fill="currentColor" />
            </svg>
          </div>
          <div className={styles.errorMessage}>
            <h3>Не удалось загрузить детали</h3>
            <p>Произошла ошибка при получении данных с сервера</p>
            <button onClick={() => refetch()} className={styles.retryButton}>
              Попробовать снова
            </button>
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
        searchPlaceholder="Поиск по заказу, артикулу, названию, материалу, размеру..."
      />

      <div className={styles.tableContainer}>
        <table className={styles.detailsTable}>
          <thead>
            <tr>
              <SortableHeader field="priority" label="Приоритет" sortConfig={sortConfig} onSort={handleSort} />
              <SortableHeader field="order.name" label="Заказ" sortConfig={sortConfig} onSort={handleSort} />
              <SortableHeader field="detail.article" label="Артикул" sortConfig={sortConfig} onSort={handleSort} />
              <SortableHeader field="detail.name" label="Название детали" sortConfig={sortConfig} onSort={handleSort} />
              <SortableHeader field="detail.material" label="Материал" sortConfig={sortConfig} onSort={handleSort} />
              <SortableHeader field="detail.size" label="Размер" sortConfig={sortConfig} onSort={handleSort} />
              <th>Тех. информация</th>
              <SortableHeader field="readyForProcessing" label="К обработке" sortConfig={sortConfig} onSort={handleSort} />
              <SortableHeader field="completed" label="Выполнено" sortConfig={sortConfig} onSort={handleSort} />
              <th></th>
            </tr>
          </thead>
          <tbody className={showDetails ? styles.showDetails : styles.hideDetails}>
            {filteredAndSortedTasks.map((task, index) => (
              <tr
                key={task.operationId}
                className={`
                  ${activeTaskId === task.operationId ? styles.activeRow : ''}
                  ${styles.animatedRow}
                `}
                style={{ animationDelay: `${index * 50}ms` }}
                onClick={() => handleRowClick(task.operationId)}
              >
                <td>{task.priority}</td>
                <td>{`${task.order.runNumber} - ${task.order.name}`}</td>
                <td>{task.detail.article}</td>
                <td>{task.detail.name}</td>
                <td>{task.detail.material}</td>
                <td>{task.detail.size}</td>
                <td>
                  <button 
                    className={styles.drawingButton}
                    onClick={(e) => handleDrawingClick(e, task.detail.id)}
                  >
                    Чертеж
                  </button>
                </td>
                {/* <td>{task.detail.totalNumber}</td> */}
                <td>{task.readyForProcessing }</td>
                <td>{task.completed }</td>
                <td>
                  <button 
                    className={styles.arrowButton}
                    onClick={(e) => handleArrowClick(e, task.operationId, e.currentTarget)}
                  >
                    &#10095; {/* Символ стрелки вправо */}
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
          sortedTasks.find(task => task.operationId === activeTaskId)?.detail || null : 
          null}
        detailId={activeTaskId !== null ? 
          sortedTasks.find(task => task.operationId === activeTaskId)?.detail.id || null : 
          null}
        isOpen={isSidebarOpen}
        onClose={handleCloseSidebar}
        handleOpenML={handleOpenML}
        // position={sidebarPosition}
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
