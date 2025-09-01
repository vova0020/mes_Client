import React, { useState, useEffect, useRef } from 'react';
import styles from './DetailsTable.module.css';
import usePackagingDetails from '../../../hooks/ypakMasterHook/packagingMasterHook';
import useMachines from '../../../hooks/ypakMasterHook/useMachinesMaster';
import PackagingDetailsSidebar from '../PalletsSidebar/PackagingDetailsSidebar';

interface DetailsYpakTableProps {
  selectedOrderId: number | null;
}

const DetailsYpakTable: React.FC<DetailsYpakTableProps> = ({ selectedOrderId }) => {
  // Состояние для отслеживания активной упаковки
  const [activePackagingId, setActivePackagingId] = useState<number | null>(null);
  
  // Состояние для анимации (показывать/скрывать упаковки)
  const [showDetails, setShowDetails] = useState(false);
  
  // Состояние для боковой панели с поддонами
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedDetailForPallets, setSelectedDetailForPallets] = useState<number | null>(null);
  
  // Состояние для уведомлений
  const [notification, setNotification] = useState<{message: string, type: 'error' | 'success'} | null>(null);
  
  // Используем хук для получения данных о упаковках
  const { 
    packagingItems: packages, 
    loading, 
    error, 
    fetchPackagingItems: fetchPackagesByOrderId
  } = usePackagingDetails(selectedOrderId);

  // Используем хук для получения данных о станках
  const {
    availableMachines,
    availableMachinesLoading,
    fetchAvailableMachines,
    assignPackageToMachine
  } = useMachines();
  
  // Ref для отслеживания предыдущего ID заказа
  const prevOrderIdRef = useRef<number | null>(null);
  
  // Ref для контейнера таблицы, используется для определения кликов за пределами sidebar
  const containerRef = useRef<HTMLDivElement>(null);

  // Загружаем станки при монтировании компонента
  useEffect(() => {
    console.log('Загружаем станки...');
    fetchAvailableMachines();
  }, []);

  // Отладка списка станков
  useEffect(() => {
    console.log('availableMachines:', availableMachines);
  }, [availableMachines]);

  // Сбрасываем активную упаковку при смене заказа
  useEffect(() => {
    setActivePackagingId(null);
    prevOrderIdRef.current = selectedOrderId;
  }, [selectedOrderId]);

  // Показываем упаковки с анимацией после загрузки
  useEffect(() => {
    if (!loading && packages && packages.length > 0) {
      // Небольшая задержка перед показом упаковок для более заметной анимации
      const timer = setTimeout(() => {
        setShowDetails(true);
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [loading, packages]);

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

  // Автоматически скрываем уведомление через 5 секунд
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

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

  // Функция для получения назначенного станка для упаковки
  const getAssignedMachine = (packaging: any) => {
    if (packaging.tasks && packaging.tasks.length > 0) {
      // Берем первое задание (предполагаем, что у упаковки одно активное задание)
      const task = packaging.tasks[0];
      if (task.machine) {
        return {
          machineId: task.machine.machineId,
          machineName: task.machine.machineName,
          status: task.status,
          completedAt: task.completedAt,
          taskId: task.taskId
        };
      }
    }
    return null;
  };

  // Функция для проверки, можно ли нажать кнопку "В работу"
  const canStartWork = (packaging: any) => {
    const assignedMachine = getAssignedMachine(packaging);
    if (!assignedMachine) return false;
    
    return (assignedMachine.status === 'PENDING' || assignedMachine.status === 'NOT_PROCESSED') && 
           !assignedMachine.completedAt;
  };

  // Функция для проверки, можно ли нажать кнопку "Готово"
  const canComplete = (packaging: any) => {
    const assignedMachine = getAssignedMachine(packaging);
    if (!assignedMachine) return false;
    
    return assignedMachine.status === 'IN_PROGRESS' && !assignedMachine.completedAt;
  };



  // Обработчик изменения выбора упаковщика (станка)
  const handleAssignPackagerChange = async (e: React.ChangeEvent<HTMLSelectElement>, packageId: number) => {
    e.stopPropagation(); // Предотвращаем всплытие события
    const machineId = parseInt(e.target.value);
    if (!isNaN(machineId)) {
      console.log(`Назначить станок ${machineId} для упаковки ${packageId}`);
      
      try {
        // Отправляем запрос на назначение упаковки на станок
        const result = await assignPackageToMachine(packageId, machineId);
        
        if (result.success) {
          console.log(`Упаковка ${packageId} успешно назначена на станок ${machineId}`);
          setNotification({message: 'Упаковка успешно назначена на станок', type: 'success'});
          // Перезагружаем данные упаковок для обновления состояния
          if (selectedOrderId !== null) {
            fetchPackagesByOrderId(selectedOrderId);
          }
        } else {
          // Показываем сообщение об ошибке от сервера
          const errorMessage = result.error?.message || 'Не удалось назначить упаковку на станок';
          setNotification({message: errorMessage, type: 'error'});
          // Сбрасываем выбор в селекте при ошибке
          e.target.value = "";
        }
      } catch (error) {
        console.error(`Ошибка при назначении упаковки ${packageId} на станок ${machineId}:`, error);
        setNotification({message: 'Произошла ошибка при назначении упаковки', type: 'error'});
        e.target.value = "";
      }
    }
  };



  const handlePartiallyCompletedClick = (packageId: number) => {
    // updateStatus(packageId, 'partially_completed');
    console.log(`Частичное завершение упаковки ${packageId}`);
  };

  // Функция для получения класса стиля в зависимости от статуса упаковки
  const getPackingStatusClass = (status: string): string => {
    switch (status) {
      case 'NOT_PROCESSED': return styles.statusNotProcessed;
      case 'READY_PROCESSED': return styles.statusReadyProcessed;
      case 'PENDING': return styles.statusPackingPending;
      case 'IN_PROGRESS': return styles.statusPackingInProgress;
      case 'COMPLETED': return styles.statusPackingCompleted;
      default: return '';
    }
  };

  // Функция для получения текста статуса упаковки
  const getPackingStatusText = (status: string): string => {
    switch (status) {
      case 'NOT_PROCESSED': return 'Не обработано';
      case 'READY_PROCESSED': return 'Готово к обработке';
      case 'PENDING': return 'Ожидает упаковки';
      case 'IN_PROGRESS': return 'В работе';
      case 'COMPLETED': return 'Завершена';
      default: return status;
    }
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
            <button onClick={() => selectedOrderId && fetchPackagesByOrderId(selectedOrderId)} className={styles.retryButton}>
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
  if (!packages || packages.length === 0) {
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
              <th>Статус упаковки</th>
              {/* <th>Разрешить паковать вне линии</th> */}
              <th>Назначить станок</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody className={showDetails ? styles.showDetails : styles.hideDetails}>
            {(packages || []).sort((a, b) => a.id - b.id).map((packaging, index) => (
              <tr
                key={packaging.id}
                className={`
                  ${activePackagingId === packaging.id ? styles.activeRow : ''}
                  ${styles.animatedRow}
                `}
                style={{ animationDelay: `${index * 50}ms` }}
                onClick={() => handleRowClick(packaging.id)}
              >
                <td>{packaging.packageCode}</td>
                <td>{packaging.packageName}</td>
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
                <td>{packaging.distributed}</td>
                <td>{packaging.assembled}</td>
                <td>{packaging.completed}</td>
                <td>
                  <span className={`${styles.statusBadge} ${getPackingStatusClass(packaging.packingStatus || 'NOT_PROCESSED')}`}>
                    {getPackingStatusText(packaging.packingStatus || 'NOT_PROCESSED')}
                  </span>
                </td>
                {/* <td>
                  <label className={styles.checkboxContainer}>
                    <input 
                      type="checkbox" 
                      checked={packaging.allowPackingOutsideLine} 
                      onChange={(e) => handleAllowOutsidePackingChange(e, packaging.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <span className={styles.checkmark}></span>
                  </label>
                </td> */}
                <td>
                  {(() => {
                    const assignedMachine = getAssignedMachine(packaging);
                    
                    return (
                      <select 
                        className={styles.workerSelect}
                        value={assignedMachine ? assignedMachine.machineId : ""}
                        onChange={(e) => handleAssignPackagerChange(e, packaging.id)}
                        onClick={(e) => e.stopPropagation()}
                        disabled={availableMachinesLoading || !!assignedMachine}
                      >
                        <option value="">
                          {availableMachinesLoading ? 'Загрузка...' : 'Выберите станок'}
                        </option>
                        {availableMachines.map((machine) => (
                          <option 
                            key={machine.id} 
                            value={machine.id}
                          >
                            {machine.name}
                          </option>
                        ))}
                      </select>
                    );
                  })()}
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

      {/* Уведомления */}
      {notification && (
        <div className={`${styles.notification} ${styles[notification.type]}`}>
          <div className={styles.notificationContent}>
            <span>{notification.message}</span>
            <button 
              className={styles.closeNotification}
              onClick={() => setNotification(null)}
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Боковая панель с деталями и поддонами */}
      <PackagingDetailsSidebar 
        isOpen={sidebarOpen} 
        onClose={handleCloseSidebar}
        selectedPackageId={selectedDetailForPallets}
      />
    </div>
  );
};

export default DetailsYpakTable; 