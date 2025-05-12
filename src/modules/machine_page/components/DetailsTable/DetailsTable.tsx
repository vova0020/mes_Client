
import React, { useState, useRef } from 'react';
import styles from './DetailsTable.module.css';
import { useDetails } from '../../../hooks/machinhook/useDetails';
import PalletsSidebar from '../PalletsSidebar/PalletsSidebar';

const DetailsTable: React.FC = () => {
  // Состояние для отслеживания активной задачи
  const [activeTaskId, setActiveTaskId] = useState<number | null>(null);
  
  // Состояние для анимации (показывать/скрывать детали)
  const [showDetails, setShowDetails] = useState(false);
  
  // Состояние для боковой панели поддонов
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  // Состояние для позиции сайдбара
  const [sidebarPosition, setSidebarPosition] = useState({ top: 120, right: 20 });
  
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

      <div className={styles.tableContainer}>
        <table className={styles.detailsTable}>
          <thead>
            <tr>
              <th>Приоритет</th>
              <th>Заказ</th>
              <th>Артикул</th>
              <th>Название детали</th>
              <th>Материал</th>
              <th>Размер</th>
              <th>Тех. информация</th>
              <th>Общее кол-во</th>
              <th>К обработке</th>
              <th>Выполнено</th>
              <th></th> {/* Колонка для кнопки-стрелки */}
            </tr>
          </thead>
          <tbody className={showDetails ? styles.showDetails : styles.hideDetails}>
            {tasks.map((task, index) => (
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
                <td>{task.detail.totalNumber}</td>
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
        detailId={activeTaskId !== null ? 
          tasks.find(task => task.operationId === activeTaskId)?.detail.id || null : 
          null}
        isOpen={isSidebarOpen}
        onClose={handleCloseSidebar}
        // position={sidebarPosition}
      />
    </div>
  );
};

export default DetailsTable;
