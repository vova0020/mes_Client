import React, { useState, useEffect, useRef } from 'react';
import styles from './DetailsTable.module.css';
import usePackagingDetails from '../../../hooks/ypakMasterHook/packagingMasterHook';
import PalletsSidebar from '../PalletsSidebar/MasterYpackPalletsSidebar';

interface DetailsTableProps {
  selectedOrderId: number | null;
}

const DetailsTable: React.FC<DetailsTableProps> = ({ selectedOrderId }) => {
  // Состояние для отслеживания активной упаковки
  const [activePackagingId, setActivePackagingId] = useState<number | null>(null);
  
  // Состояние для анимации (показывать/скрывать упаковки)
  const [showDetails, setShowDetails] = useState(false);
  
  // Состояние для боковой панели с поддонами
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedDetailForPallets, setSelectedDetailForPallets] = useState<number | null>(null);
  
  // Используем хук для получения данных о упаковках
  const { 
    packagingItems, 
    workers, 
    loading, 
    error, 
    fetchPackagingItems,
    assignWorker,
    toggleAllowOutsidePacking,
    updateStatus
  } = usePackagingDetails();
  
  // Ref для отслеживания предыдущего ID заказа
  const prevOrderIdRef = useRef<number | null>(null);
  
  // Ref для контейнера таблицы, используется для определения кликов за пределами sidebar
  const containerRef = useRef<HTMLDivElement>(null);

  // Загружаем упаковки при изменении выбранного заказа
  useEffect(() => {
    // Если меняется ID заказа, сначала скрываем детали с анимацией
    if (prevOrderIdRef.current !== selectedOrderId && !loading && packagingItems.length > 0) {
      setShowDetails(false);
      
      // Используем setTimeout для создания "задержки" при смене данных
      const timer = setTimeout(() => {
        fetchPackagingItems(selectedOrderId);
        // Сбрасываем активную упаковку при смене заказа
        setActivePackagingId(null);
      }, 300); // Задержка должна быть равна или меньше времени анимации исчезновения
      
      return () => clearTimeout(timer);
    } else {
      fetchPackagingItems(selectedOrderId);
      // Сбрасываем активную упаковку при смене заказа
      setActivePackagingId(null);
    }
    
    prevOrderIdRef.current = selectedOrderId;
  }, [selectedOrderId, fetchPackagingItems]);

  // Показываем упаковки с анимацией после загрузки
  useEffect(() => {
    if (!loading && packagingItems.length > 0) {
      // Небольшая задержка перед показом упаковок для более заметной анимации
      const timer = setTimeout(() => {
        setShowDetails(true);
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [loading, packagingItems]);

  // Синхронизация выделенной строки с состоянием боковой панели
  useEffect(() => {
    // Когда закрывается панель, снимаем выделение
    if (!sidebarOpen) {
      setActivePackagingId(null);
    } else {
      // Когда открывается панель, выделяем соответствующую строку
      setActivePackagingId(selectedDetailForPallets);
    }
  }, [sidebarOpen, selectedDetailForPallets]);

  // // Обработчик кликов за пределами боковой панели
  // useEffect(() => {
  //   const handleOutsideClick = (event: MouseEvent) => {
  //     // Проверяем, что sidebar открыт
  //     if (!sidebarOpen) return;
      
  //     // Получаем элемент sidebar через DOM
  //     const sidebar = document.querySelector(`.${styles.sidebar}`);
      
  //     // Проверяем, что клик был не внутри sidebar и не на кнопке-стрелке
  //     if (sidebar && 
  //         !sidebar.contains(event.target as Node) && 
  //         !(event.target as Element).closest(`.${styles.arrowButton}`)) {
  //       setSidebarOpen(false);
  //     }
  //   };

  //   // Добавляем слушатель событий
  //   document.addEventListener('mousedown', handleOutsideClick);
    
  //   // Удаляем слушатель при размонтировании
  //   return () => {
  //     document.removeEventListener('mousedown', handleOutsideClick);
  //   };
  // }, [sidebarOpen, styles.sidebar, styles.arrowButton]);

  // Обработчик клика по строке таблицы с возможностью сброса выбора
  const handleRowClick = (packageId: number) => {
    // Если нажали на уже выбранную строку, сбрасываем выбор
    if (activePackagingId === packageId) {
      setActivePackagingId(null);
    } else {
      // Иначе выбираем новую строку
      setActivePackagingId(packageId);
    }
  };

  // Обработчик клика по кнопке "Схема укладки"
  const handleSchemeClick = (e: React.MouseEvent, packageId: number) => {
    e.stopPropagation(); // Предотвращаем всплытие события
    console.log(`Открыть схему укладки для упаковки ${packageId}`);
    
    // Здесь будет запрос на получение схемы укладки
    // и открытие её в новом окне или модальном окне
  };

  // Обработчик клика по кнопке-стрелке
  const handleArrowClick = (e: React.MouseEvent, packageId: number) => {
    e.stopPropagation(); // Предотвращаем всплытие события
    setSelectedDetailForPallets(packageId);
    setSidebarOpen(true);
  };

  // Обработчик закрытия боковой панели
  const handleCloseSidebar = () => {
    setSidebarOpen(false);
  };

  // Обработчик изменения чекбокса "Разрешить паковать вне линии"
  const handleAllowOutsidePackingChange = (e: React.ChangeEvent<HTMLInputElement>, packageId: number) => {
    e.stopPropagation(); // Предотвращаем всплытие события
    const isChecked = e.target.checked;
    // toggleAllowOutsidePacking(packageId, isChecked);
  };

  // Обработчик изменения выбора упаковщика
  const handleAssignPackagerChange = (e: React.ChangeEvent<HTMLSelectElement>, packageId: number) => {
    e.stopPropagation(); // Предотвращаем всплытие события
    const workerId = parseInt(e.target.value);
    if (!isNaN(workerId)) {
      assignWorker(packageId, workerId);
    }
  };

  // Обработчики кнопок статусов
  const handleInProgressClick = (e: React.MouseEvent, packageId: number) => {
    e.stopPropagation(); // Предотвращаем всплытие события
    // updateStatus(packageId, 'in_progress');
  };

  const handleCompletedClick = (e: React.MouseEvent, packageId: number) => {
    e.stopPropagation(); // Предотвращаем всплытие события
    // updateStatus(packageId, 'completed');
  };

  const handlePartiallyCompletedClick = (e: React.MouseEvent, packageId: number) => {
    e.stopPropagation(); // Предотвращаем всплытие события
    // updateStatus(packageId, 'partially_completed');
  };

  // Отображаем сообщение о загрузке
  if (loading) {
    return (
      <div className={styles.detailsContainer}>
        <h2 className={styles.title}>Информация об упаковке</h2>
        <div className={styles.stateContainer}>
          <div className={styles.loadingSpinner}></div>
          <div className={styles.loadingMessage}>
            <h3>Загрузка упаковок</h3>
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
        <h2 className={styles.title}>Информация об упаковке</h2>
        <div className={styles.stateContainer}>
          <div className={styles.errorIcon}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 4C7.58172 4 4 7.58172 4 12C4 16.4183 7.58172 20 12 20C16.4183 20 20 16.4183 20 12C20 7.58172 16.4183 4 12 4Z" stroke="currentColor" strokeWidth="2" />
              <path d="M12 8V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <circle cx="12" cy="16" r="1" fill="currentColor" />
            </svg>
          </div>
          <div className={styles.errorMessage}>
            <h3>Не удалось загрузить упаковки</h3>
            <p>Произошла ошибка при получении данных с сервера</p>
            <button onClick={() => fetchPackagingItems(selectedOrderId)} className={styles.retryButton}>
              Попробовать снова
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Если заказ не выбран, показываем соответствующее сообщение
  if (selectedOrderId === null) {
    return (
      <div className={styles.detailsContainer}>
        <h2 className={styles.title}>Информация об упаковке</h2>
        <div className={styles.stateContainer}>
          <div className={styles.emptyIcon}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 5H5C3.89543 5 3 5.89543 3 7V17C3 18.1046 3.89543 19 5 19H19C20.1046 19 21 18.1046 21 17V7C21 5.89543 20.1046 5 19 5Z" stroke="currentColor" strokeWidth="2" />
              <path d="M9 12H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <div className={styles.emptyMessage}>
            <h3>Выберите заказ</h3>
            <p>Для просмотра упаковок необходимо выбрать заказ из списка</p>
          </div>
        </div>
      </div>
    );
  }

  // Если выбран заказ, но нет упаковок
  if (packagingItems.length === 0) {
    return (
      <div className={styles.detailsContainer}>
        <h2 className={styles.title}>Информация об упаковке</h2>
        <div className={styles.stateContainer}>
          <div className={styles.emptyIcon}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 5H5C3.89543 5 3 5.89543 3 7V17C3 18.1046 3.89543 19 5 19H19C20.1046 19 21 18.1046 21 17V7C21 5.89543 20.1046 5 19 5Z" stroke="currentColor" strokeWidth="2" />
              <path d="M12 10V14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M10 12H14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <div className={styles.emptyMessage}>
            <h3>Нет доступных упаковок</h3>
            <p>В данном заказе отсутствуют упаковки или они еще не были добавлены</p>
          </div>
        </div>
      </div>
    );
  }

  // Если есть упаковки для отображения
  return (
    <div className={styles.detailsContainer} ref={containerRef}>
      <h2 className={styles.title}>Информация об упаковке</h2>

      <div className={styles.tableContainer}>
        <table className={styles.detailsTable}>
          <thead>
            <tr>
              <th>Артикул</th>
              <th>Название</th>
              <th>Тех. информация</th>
              <th>Общее кол-во</th>
              <th>Готово к упаковке</th>
              <th>Распределено</th>
              <th>Скомплектовано</th>
              <th>Упаковано</th>
              <th>Разрешить паковать вне линии</th>
              <th>Назначить упаковщика</th>
              <th colSpan={4}>Действия</th>
            </tr>
          </thead>
          <tbody className={showDetails ? styles.showDetails : styles.hideDetails}>
            {packagingItems.map((packaging, index) => (
              <tr
                key={packaging.id}
                className={`
                  ${activePackagingId === packaging.id ? styles.activeRow : ''}
                  ${styles.animatedRow}
                `}
                style={{ animationDelay: `${index * 50}ms` }}
                onClick={() => handleRowClick(packaging.id)}
              >
                <td>{packaging.article}</td>
                <td>{packaging.name}</td>
                <td>
                  <button 
                    className={styles.schemeButton}
                    onClick={(e) => handleSchemeClick(e, packaging.id)}
                  >
                    Схема укладки
                  </button>
                </td>
                <td>{packaging.totalQuantity}</td>
                <td>{packaging.readyForPackaging}</td>
                <td>{packaging.allocated}</td>
                <td>{packaging.assembled}</td>
                <td>{packaging.packed}</td>
                <td>
                  <label className={styles.checkboxContainer}>
                    <input 
                      type="checkbox" 
                      checked={packaging.allowPackingOutsideLine} 
                      onChange={(e) => handleAllowOutsidePackingChange(e, packaging.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <span className={styles.checkmark}></span>
                  </label>
                </td>
                <td>
                  <select 
                    className={styles.workerSelect}
                    value={workers.find(w => w.name === packaging.assignedPackager)?.id || ""}
                    onChange={(e) => handleAssignPackagerChange(e, packaging.id)}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <option value="">Выберите упаковщика</option>
                    {workers.map(worker => (
                      <option key={worker.id} value={worker.id}>{worker.name}</option>
                    ))}
                  </select>
                </td>
                <td>
                  <button 
                    className={`${styles.actionButton} ${styles.inProgressButton}`}
                    onClick={(e) => handleInProgressClick(e, packaging.id)}
                  >
                    В работу
                  </button>
                </td>
                <td>
                  <button 
                    className={`${styles.actionButton} ${styles.completedButton}`}
                    onClick={(e) => handleCompletedClick(e, packaging.id)}
                  >
                    Готово
                  </button>
                </td>
                <td>
                  <button 
                    className={`${styles.actionButton} ${styles.partiallyCompletedButton}`}
                    onClick={(e) => handlePartiallyCompletedClick(e, packaging.id)}
                  >
                    Частично
                  </button>
                </td>
                <td>
                  <button 
                    className={styles.arrowButton}
                    onClick={(e) => handleArrowClick(e, packaging.id)}
                  >
                    &#10095; {/* Символ стрелки вправо */}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Боковая панель с поддонами */}
      {/* <PalletsSidebar 
        detailId={selectedDetailForPallets} 
        isOpen={sidebarOpen} 
        onClose={handleCloseSidebar} 
      /> */}
    </div>
  );
};

export default DetailsTable;