import React, { useState, useRef, useEffect } from 'react';
import styles from './DetailsTable.module.css';
import { useYpakMachine } from '../../../hooks/ypakMachine/useYpakMachine';
import { YpakTask } from '../../../api/ypakMachine/ypakMachineApi';
import { updatePackingTaskStatus } from '../../../api/ypakMasterApi/machineMasterService';
import PackagingDetailsSidebar from '../PalletsSidebar/PackagingDetailsSidebar';

const DetailsTable: React.FC = () => {
  // Состояние для отслеживания активной задачи
  const [activeTaskId, setActiveTaskId] = useState<number | null>(null);
  
  // Состояние для анимации (показывать/скрывать детали)
  const [showDetails, setShowDetails] = useState(false);
  
 // Состояние для боковой панели с поддонами
   const [sidebarOpen, setSidebarOpen] = useState(false);
   const [selectedDetailForPallets, setSelectedDetailForPallets] = useState<number | null>(null);
  
  // Состояние для модального окна частичного завершения
  const [showPartialModal, setShowPartialModal] = useState(false);
  const [partialCompleteTaskId, setPartialCompleteTaskId] = useState<number | null>(null);
  const [packagedCount, setPackagedCount] = useState<number>(0);
  
  // Используем хук для получения данных о задачах
  const { 
    machineDetails, 
    tasks, 
    loading, 
    error, 
    refetch,
    sendToMonitors,
    startOperation,
    completeOperation,
    partiallyCompleteOperation,
    getPackingScheme
  } = useYpakMachine();
  
  // Состояние для уведомлений
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  
  // Ref для контейнера таблицы
  const containerRef = useRef<HTMLDivElement>(null);

  // Состояние для обработки действий
  const [processingTaskId, setProcessingTaskId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Показываем детали с анимацией после загрузки
  useEffect(() => {
    if (loading === 'success' && tasks.length > 0) {
      // Небольшая задержка перед показом дет��лей для более заметной анимации
      const timer = setTimeout(() => {
        setShowDetails(true);
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [loading, tasks]);

  // Очищаем сообщения через 3 секунды
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    if (actionError) {
      const timer = setTimeout(() => {
        setActionError(null);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [actionError]);

  // Обработчик клика по строке таблицы с возможностью сброса выбора
  const handleRowClick = (taskId: number) => {
    // Если нажали на уже выбранную строку, сбрасываем выбор
    if (activeTaskId === taskId) {
      setActiveTaskId(null);
      // setIsSidebarOpen(false);
    } else {
      // Иначе выбираем новую строку
      setActiveTaskId(taskId);
    }
  };

  // Обработчик клика по кнопке "Схема уклад��и"
  const handlePackingSchemeClick = async (e: React.MouseEvent, packageId: number) => {
    e.stopPropagation(); // Предотвращаем всплытие события
    
    try {
      setProcessingTaskId(packageId);
      const schemeUrl = await getPackingScheme(packageId);
      
      // Открываем схему укладки в новом окне
      window.open(schemeUrl, '_blank');
    } catch (error) {
      setActionError(`Ошибка при загрузке схемы укладки: ${(error as Error).message}`);
    } finally {
      setProcessingTaskId(null);
    }
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

  // Обработчик для кнопки "Отправить на мониторы"
  const handleSendToMonitors = async (e: React.MouseEvent, taskId: number) => {
    e.stopPropagation(); // Предотвращаем всплытие события
    
    try {
      setProcessingTaskId(taskId);
      setActionError(null);
      
      await sendToMonitors(taskId);
      setSuccessMessage('Задача успешно отправлена на мониторы');
    } catch (error) {
      setActionError(`Ошибка при отправке на мониторы: ${(error as Error).message}`);
    } finally {
      setProcessingTaskId(null);
    }
  };

  // Обработчик для кнопки "В работу"
  const handleStartOperation = async (e: React.MouseEvent, taskId: number) => {
    e.stopPropagation(); // Предотвращаем всплытие события
    
    try {
      setProcessingTaskId(taskId);
      setActionError(null);
      
      await updatePackingTaskStatus(taskId, 'IN_PROGRESS');
      setSuccessMessage('Задача успешно переведена в работу');
      // Перезагружаем данные для обновления статуса
      refetch();
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Ошибка при переводе в работу';
      setActionError(errorMessage);
    } finally {
      setProcessingTaskId(null);
    }
  };

  // Обработчик для кнопки "Готово"
  const handleCompleteOperation = async (e: React.MouseEvent, taskId: number) => {
    e.stopPropagation(); // Предотвращаем всплытие события
    
    try {
      setProcessingTaskId(taskId);
      setActionError(null);
      
      const task = tasks.find(t => t.taskId === taskId);
      const remainingQuantity = task?.remainingQuantity || 0;
      
      await updatePackingTaskStatus(taskId, 'COMPLETED', remainingQuantity);
      setSuccessMessage('Задача успешно завершена');
      // Перезагружаем данные для обновления статуса
      refetch();
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Ошибка при завершении задачи';
      setActionError(errorMessage);
    } finally {
      setProcessingTaskId(null);
    }
  };

  // Открытие модального окна для частичного завершения
  const handleOpenPartialModal = (e: React.MouseEvent, task: YpakTask) => {
    e.stopPropagation(); // Предотвращаем всплытие события
    
    setPartialCompleteTaskId(task.taskId);
    const maxQuantity = task.remainingQuantity || 0;
    setPackagedCount(Math.min(10, maxQuantity)); // По умолчанию 10 или меньше, если доступно меньше
    setShowPartialModal(true);
  };

  // Закрытие модального окна
  const handleClosePartialModal = () => {
    setShowPartialModal(false);
    setPartialCompleteTaskId(null);
    setPackagedCount(0);
  };

  // Эффект для установки начального значения при открытии модального окна
  useEffect(() => {
    if (showPartialModal && partialCompleteTaskId) {
      const task = tasks.find(t => t.taskId === partialCompleteTaskId);
      if (task) {
        const maxQuantity = task.remainingQuantity || 0;
        setPackagedCount(Math.min(10, maxQuantity));
      }
    }
  }, [showPartialModal, partialCompleteTaskId, tasks]);

  // Обработчик для подтверждения частичного завершения
  const handleConfirmPartialComplete = async () => {
    if (partialCompleteTaskId === null) return;
    
    try {
      setProcessingTaskId(partialCompleteTaskId);
      setActionError(null);
      
      await updatePackingTaskStatus(partialCompleteTaskId, 'IN_PROGRESS', packagedCount);
      setSuccessMessage('Задача частично завершена');
      handleClosePartialModal();
      // Перезагружаем данные для обновления статуса
      refetch();
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Ошибка при частичном завершении';
      setActionError(errorMessage);
    } finally {
      setProcessingTaskId(null);
    }
  };

  // Функция для получения класса стиля в зависимости от статуса операции
  const getStatusClass = (status: string): string => {
    switch (status) {
      case 'PENDING': return styles.statusOnMachine;
      case 'IN_PROGRESS': return styles.statusInProgress;
      case 'COMPLETED': return styles.statusCompleted;
      case 'PARTIALLY_COMPLETED': return styles.statusPartiallyCompleted;
      default: return '';
    }
  };

  // Функция для получения текста статуса
  const getStatusText = (status: string): string => {
    switch (status) {
      case 'PENDING': return 'Ожидает';
      case 'IN_PROGRESS': return 'В работе';
      case 'COMPLETED': return 'Завершено';
      case 'PARTIALLY_COMPLETED': return 'Завершено частично';
      default: return status;
    }
  };

  // Функция для форматирования даты
  const formatDate = (dateString: string | null): string => {
    if (!dateString) return '-';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '-';
    }
  };

  // Отображаем сообщение о загрузке
  if (loading === 'loading' || loading === 'idle') {
    return (
      <div className={styles.detailsContainer}>
        <h2 className={styles.title}>Информация об упаковке</h2>
        <div className={styles.stateContainer}>
          <div className={styles.loadingSpinner}></div>
          <div className={styles.loadingMessage}>
            <h3>Загрузка данных</h3>
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
            <h3>Не удалось загрузить данные</h3>
            <p>Произошла ошибка при получении данных с сервера</p>
            <button onClick={() => refetch()} className={styles.retryButton}>
              Попробовать снова
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Фильтруем задачи, исключая завершенные
  const filteredTasks = tasks.filter(task => task.status !== 'COMPLETED');

  // Если нет задач для отображения
  if (filteredTasks.length === 0) {
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
      <h2 className={styles.title}>Информация об упаковке</h2>

      {/* Сообщения об успехе или ошибке */}
      {successMessage && (
        <div className={styles.successMessage}>
          <span className={styles.successIcon}>✓</span>
          {successMessage}
        </div>
      )}

      {actionError && (
        <div className={styles.errorAlert}>
          <span className={styles.errorIcon}>⚠</span>
          {actionError}
        </div>
      )}

      <div className={styles.tableContainer}>
        <table className={styles.detailsTable}>
          <thead>
            <tr>
              <th>Приоритет</th>
              <th>Заказ</th>
              <th>Код упаковки</th>
              <th>Название упаковки</th>
              <th>Тех. информация</th>
              <th>Назначено / Выполнено</th>
              <th>Статус</th>
              <th>Действия</th>
              <th></th> {/* Колонка для кнопки-стрелки */}
            </tr>
          </thead>
          <tbody className={showDetails ? styles.showDetails : styles.hideDetails}>
            {filteredTasks.map((task, index) => (
              <tr
                key={task.taskId}
                className={`
                  ${activeTaskId === task.taskId ? styles.activeRow : ''}
                  ${styles.animatedRow}
                  ${getStatusClass(task.status)}
                `}
                style={{ animationDelay: `${index * 50}ms` }}
                onClick={() => handleRowClick(task.taskId)}
              >
                <td>{task.priority || '-'}</td>
                <td>{`${task.productionPackage.order.batchNumber} - ${task.productionPackage.order.orderName}`}</td>
                <td>{task.productionPackage.packageCode}</td>
                <td>{task.productionPackage.packageName}</td>
                <td>
                  <button 
                    className={styles.schemeButton}
                    onClick={(e) => handlePackingSchemeClick(e, task.packageId)}
                    // disabled={processingTaskId === task.packageId}
                    disabled= {true}
                  >
                    Схема укладки
                  </button>
                </td>
                <td>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 'bold' }}>
                      {task.assignedQuantity} / {task.completedQuantity}
                    </span>
                    <span style={{ fontSize: '10px', color: '#666' }}>
                      ост.: {task.remainingQuantity}
                    </span>
                  </div>
                </td>
                <td>
                  <span className={`${styles.statusBadge} ${getStatusClass(task.status)}`}>
                    {getStatusText(task.status)}
                  </span>
                </td>
           
                <td className={styles.actionsCell}>
                  <button 
                    className={`${styles.actionButton} ${styles.monitorButton}`}
                    onClick={(e) => handleSendToMonitors(e, task.taskId)}
                    // disabled={processingTaskId === task.taskId || task.status === 'COMPLETED'}
                    disabled= {true}
                    title="Отправить на мониторы"
                  >
                    На мониторы
                  </button>
                  <button 
                    className={`${styles.actionButton} ${styles.startButton}`}
                    onClick={(e) => handleStartOperation(e, task.taskId)}
                    disabled={processingTaskId === task.taskId || task.status === 'IN_PROGRESS' || task.status === 'COMPLETED'}
                    title="Перевести задачу в работу"
                  >
                    В работу
                  </button>
                  <button 
                    className={`${styles.actionButton} ${styles.completeButton}`}
                    onClick={(e) => handleCompleteOperation(e, task.taskId)}
                    disabled={processingTaskId === task.taskId || task.status === 'COMPLETED' || task.status === 'PENDING'}
                    title="Завершить задачу"
                  >
                    Готово
                  </button>
                  <button 
                    className={`${styles.actionButton} ${styles.partialButton}`}
                    onClick={(e) => handleOpenPartialModal(e, task)}
                    disabled={processingTaskId === task.taskId || task.status === 'COMPLETED' || task.status === 'PENDING'}
                    title="Частично завершить задачу"
                  >
                    Частично
                  </button>
                </td>
                <td>
                  <button 
                    className={styles.arrowButton}
                    onClick={(e) => handleArrowClick(e, task.packageId)}
                  >
                    &#10095; {/* Символ стрелки вправо */}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Модальное окно для частичного завершения */}
      {showPartialModal && (
        <div className={styles.modalOverlay} onClick={handleClosePartialModal}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Частичная обработка детали</h3>
              <button className={styles.modalCloseBtn} onClick={handleClosePartialModal}>×</button>
            </div>
            <div className={styles.modalBody}>
              {/* Находим текущую задачу */}
              {partialCompleteTaskId && (() => {
                const task = tasks.find(t => t.taskId === partialCompleteTaskId);
                if (task) {
                  const maxQuantity = task.remainingQuantity || 0;
                  return (
                    <>
                      <div className={styles.modalInfoRow}>
                        <span className={styles.modalLabel}>Заказ:</span>
                        <span className={styles.modalValue}>{task.productionPackage.order.orderName}</span>
                      </div>
                      
                      <div className={styles.modalInfoRow}>
                        <span className={styles.modalLabel}>Номер партии:</span>
                        <span className={styles.modalValue}>{task.productionPackage.order.batchNumber}</span>
                      </div>
                      
                      <div className={styles.modalInfoRow}>
                        <span className={styles.modalLabel}>Артикул упаковки:</span>
                        <span className={styles.modalValue}>{task.productionPackage.packageCode}</span>
                      </div>
                      
                      <div className={styles.modalInfoRow}>
                        <span className={styles.modalLabel}>Наименование упаковки:</span>
                        <span className={styles.modalValue}>{task.productionPackage.packageName}</span>
                      </div>
                      
                      <div className={styles.modalInfoRow}>
                        <span className={styles.modalLabel}>Назначено станку:</span>
                        <span className={styles.modalValue}>{task.assignedQuantity} шт.</span>
                      </div>
                      
                      <div className={styles.modalInfoRow}>
                        <span className={styles.modalLabel}>Выполнено:</span>
                        <span className={styles.modalValue}>{task.completedQuantity} шт.</span>
                      </div>
                      
                      <div className={styles.modalInfoRow}>
                        <span className={styles.modalLabel}>Осталось выполнить:</span>
                        <span className={styles.modalValue}>{maxQuantity} шт.</span>
                      </div>
                      
                      <div className={styles.quantityInputContainer}>
                        <label className={styles.quantityLabel} htmlFor="partial-quantity">
                          Количество для обработки:
                        </label>
                        <div className={styles.quantityInputWrapper}>
                          <button 
                            className={styles.quantityButton}
                            onClick={() => {
                              if (packagedCount > 1) setPackagedCount(packagedCount - 1);
                            }}
                            disabled={packagedCount <= 1}
                          >
                            -
                          </button>
                          <input
                            id="partial-quantity"
                            type="text"
                            className={styles.quantityInput}
                            value={packagedCount.toString()}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (value === '' || (/^\d+$/.test(value) && parseInt(value, 10) <= maxQuantity)) {
                                setPackagedCount(value === '' ? 0 : parseInt(value, 10));
                              }
                            }}
                            placeholder="Введите количество"
                          />
                          <button 
                            className={styles.quantityButton}
                            onClick={() => {
                              if (packagedCount < maxQuantity) setPackagedCount(packagedCount + 1);
                            }}
                            disabled={packagedCount >= maxQuantity}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </>
                  );
                }
                return null;
              })()}
            </div>
            <div className={styles.modalFooter}>
              <button 
                className={styles.modalCancelBtn} 
                onClick={handleClosePartialModal}
              >
                Отмена
              </button>
              <button 
                className={styles.modalConfirmBtn}
                onClick={handleConfirmPartialComplete}
                disabled={processingTaskId !== null || packagedCount <= 0}
              >
                {processingTaskId !== null ? (
                  <>
                    <span className={styles.buttonSpinner}></span>
                    Обработка...
                  </>
                ) : (
                  'Подтвердить'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Боковая панель поддонов */}
     <PackagingDetailsSidebar 
        isOpen={sidebarOpen} 
        onClose={handleCloseSidebar}
        selectedPackageId={selectedDetailForPallets}
      />
    </div>
  );
};

export default DetailsTable;