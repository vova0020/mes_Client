import React, { useState, useEffect, useRef } from 'react';
import styles from './PalletsSidebar.module.css';
import useProductionPallets from '../../../hooks/productionPallets';
import { getPalletRouteSheet, getOperationStatusText, getProcessStepText } from '../../../api/productionPalletsService';

interface PalletsSidebarProps {
  detailId: number | null;
  isOpen: boolean;
  onClose: () => void;
}

const PalletsSidebar: React.FC<PalletsSidebarProps> = ({ detailId, isOpen, onClose }) => {
  // Ref для боковой панели
  const sidebarRef = useRef<HTMLDivElement>(null);
  
  // Используем обновленный хук для получения данных о поддонах
  const { 
    pallets,
    bufferCells,
    machines,
    loading, 
    error, 
    fetchPallets,
    updateMachine,
    updateBufferCell,
    loadSegmentResources,
    refreshPalletData
  } = useProductionPallets(null);
  
  const [showDetails, setShowDetails] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [bufferCellsLoading, setBufferCellsLoading] = useState<boolean>(false);
  const [machinesLoading, setMachinesLoading] = useState<boolean>(false);
  const [processingPalletId, setProcessingPalletId] = useState<number | null>(null);

  // Значения процессов (в реальном приложении должны быть получены с сервера)
  const defaultProcessStepId = 1; // Значение по умолчанию

  // Добавляем обработчик кликов вне боковой панели
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      // Проверяем, что sidebar открыт и что клик был не внутри него
      if (isOpen && 
          sidebarRef.current && 
          !sidebarRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    // Добавляем обработчик только если панель открыта
    if (isOpen) {
      // Используем setTimeout, чтобы не сработало закрытие сразу после открытия
      setTimeout(() => {
        document.addEventListener('mousedown', handleOutsideClick);
      }, 100);
    }
    
    // Удаляем обработчик при закрытии панели или размонтировании компонента
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen, onClose]);

  // Загрузка данных о поддонах для выбранной детали
  useEffect(() => {
    if (detailId !== null && isOpen) {
      setShowDetails(false);
      setErrorMessage(null);
      setBufferCellsLoading(true);
      setMachinesLoading(true);
      
      // Сначала загружаем ресурсы сегмента (включая ячейки буфера и станки)
      loadSegmentResources()
        .then(() => {
          setBufferCellsLoading(false);
          setMachinesLoading(false);
          // Затем загружаем данные о поддонах
          return fetchPallets(detailId);
        })
        .then(() => {
          // Показываем детали с небольшой задержкой для анимации
          setTimeout(() => {
            setShowDetails(true);
          }, 100);
        })
        .catch((err) => {
          setBufferCellsLoading(false);
          setMachinesLoading(false);
          setErrorMessage('Не удалось загрузить данные о поддонах');
          console.error('Ошибка загрузки данных:', err);
        });
    }
  }, [detailId, isOpen, fetchPallets, loadSegmentResources]);

  // Сбрасываем состояние при закрытии панели
  useEffect(() => {
    if (!isOpen) {
      setShowDetails(false);
    }
  }, [isOpen]);

  // Обработчик изменения выбранного станка
  const handleMachineChange = async (palletId: number, newMachine: string) => {
    try {
      setProcessingPalletId(palletId);
      await updateMachine(palletId, newMachine, defaultProcessStepId);
      await refreshPalletData(palletId);
      console.log(`Поддон ${palletId} назначен на станок: ${newMachine}`);
    } catch (err) {
      setErrorMessage('Не удалось обновить станок для поддона');
      console.error('Ошибка при назначении поддона на станок:', err);
    } finally {
      setProcessingPalletId(null);
    }
  };

  // Обработчик изменения адреса ячейки буфера
  const handleBufferCellChange = async (palletId: number, bufferCellAddress: string) => {
    // Находим ID ячейки буфера по адресу
    const bufferCell = bufferCells.find(cell => cell.code === bufferCellAddress);
    if (!bufferCell) return;
    
    try {
      setProcessingPalletId(palletId);
      await updateBufferCell(palletId, bufferCell.id);
      await refreshPalletData(palletId);
      console.log(`Поддон ${palletId} перемещен в ячейку буфера: ${bufferCellAddress}`);
    } catch (err) {
      setErrorMessage('Не удалось обновить ячейку буфера для поддона');
      console.error('Ошибка при перемещении поддона в буфер:', err);
    } finally {
      setProcessingPalletId(null);
    }
  };

  // Обработчик кнопки МЛ (маршрутный лист)
  const handleOpenML = async (palletId: number) => {
    try {
      setProcessingPalletId(palletId);
      const blob = await getPalletRouteSheet(palletId);
      
      // Создаем URL для скачивания файла
      const url = window.URL.createObjectURL(blob);
      
      // Создаем ссылку для скачивания
      const a = document.createElement('a');
      a.href = url;
      a.download = `Маршрутный_лист_поддон_${palletId}.pdf`;
      document.body.appendChild(a);
      a.click();
      
      // Очищаем ресурсы
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setErrorMessage('Не удалось получить маршрутный лист');
    } finally {
      setProcessingPalletId(null);
    }
  };

  // Компонент иконки для кнопки МЛ
  const DocumentIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px' }}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
      <polyline points="14 2 14 8 20 8"></polyline>
      <line x1="16" y1="13" x2="8" y2="13"></line>
      <line x1="16" y1="17" x2="8" y2="17"></line>
      <polyline points="10 9 9 9 8 9"></polyline>
    </svg>
  );

  // Иконка для кнопки обновления данных
  const RefreshIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px' }}>
      <path d="M23 4v6h-6"></path>
      <path d="M1 20v-6h6"></path>
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
    </svg>
  );

  // Обработчик повторной загрузки данных
  const handleRetry = () => {
    setErrorMessage(null);
    if (detailId !== null) {
      fetchPallets(detailId);
    }
  };

  // Обработчик повторной загрузки ячеек буфера и станков
  const handleRetryLoadResources = () => {
    setBufferCellsLoading(true);
    setMachinesLoading(true);
    loadSegmentResources()
      .then(() => {
        setBufferCellsLoading(false);
        setMachinesLoading(false);
      })
      .catch((err) => {
        setBufferCellsLoading(false);
        setMachinesLoading(false);
        console.error('Ошибка загрузки ресурсов:', err);
      });
  };

  // Обработчик обновления данных поддона
  const handleRefreshPallet = async (palletId: number) => {
    try {
      setProcessingPalletId(palletId);
      await refreshPalletData(palletId);
      console.log(`Данные поддона ${palletId} обновлены`);
    } catch (err) {
      setErrorMessage('Не удалось обновить данные поддона');
      console.error('Ошибка при обновлении данных поддона:', err);
    } finally {
      setProcessingPalletId(null);
    }
  };

  // Получение адреса ячейки буфера по коду
  const getBufferCellAddress = (bufferCell: any): string => {
    if (!bufferCell) return '';
    
    // Используем напрямую код ячейки
    return bufferCell.code || '';
  };

  // Получаем имя станка для отображения в селекте
  const getMachineName = (machine: any): string => {
    if (!machine) return '';
    return machine.name || '';
  };

  // Функция для получения класса стиля в зависимости от статуса операции
  const getOperationStatusClass = (operation?: any): string => {
    if (!operation) return '';
    
    // Отладочный вывод
    console.log('Получение класса для операции:', operation);
    
    // Сначала проверяем completionStatus (если есть)
    if (operation.completionStatus) {
      switch(operation.completionStatus) {
        case 'IN_PROGRESS': return styles.statusInProgress;
        case 'COMPLETED': return styles.statusCompleted;
        case 'PARTIALLY_COMPLETED': return styles.statusPartiallyCompleted;
        default: return '';
      }
    } else if (operation.status) {
      // Используем status, если completionStatus отсутствует
      switch(operation.status) {
        case 'IN_PROGRESS': return styles.statusInProgress;
        case 'BUFFERED': return styles.statusBuffered;
        case 'COMPLETED': return styles.statusCompleted;
        case 'FAILED': return styles.statusFailed;
        default: return '';
      }
    }
    
    return '';
  };

  // Компонент для отображения состояния загрузки ресурсов
  const ResourceLoading = ({ loading, type }: { loading: boolean, type: string }) => {
    if (loading) {
      return (
        <div className={styles.bufferCellLoading}>
          <div className={styles.miniSpinner}></div>
          <span>Загрузка {type}...</span>
        </div>
      );
    }
    return null;
  };

  // Компонент для отображения селектора ячеек буфера
  const BufferCellSelector = ({ pallet }: { pallet: any }) => {
    // Проверяем, находится ли поддон в процессе обновления
    const isProcessing = processingPalletId === pallet.id;
    
    if (isProcessing) {
      return <ResourceLoading loading={true} type="обновления" />;
    }
    
    if (bufferCellsLoading) {
      return <ResourceLoading loading={bufferCellsLoading} type="ячеек" />;
    }
    
    if (!bufferCells || bufferCells.length === 0) {
      return (
        <div className={styles.bufferCellError}>
          <span>Нет доступных ячеек</span>
          <button 
            className={styles.miniRetryButton} 
            onClick={handleRetryLoadResources}
            title="Обновить ресурсы"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M23 4v6h-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M1 20v-6h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      );
    }
    
    return (
      <select 
        className={styles.bufferCellSelect}
        value={getBufferCellAddress(pallet.bufferCell)}
        onChange={(e) => handleBufferCellChange(pallet.id, e.target.value)}
        title="Выберите ячейку буфера для поддона"
      >
        <option value="">Выберите ячейку</option>
        {bufferCells.map((cell) => (
          <option key={cell.id} value={cell.code}>
            {cell.code}
          </option>
        ))}
      </select>
    );
  };

  // Компонент для отображения селектора станков
  const MachineSelector = ({ pallet }: { pallet: any }) => {
    // Проверяем, находится ли поддон в процессе обновления
    const isProcessing = processingPalletId === pallet.id;
    
    // Проверяем, можно ли назначить поддон на станок
    // (если нет активной операции или операция в статусе BUFFERED, COMPLETED или PARTIALLY_COMPLETED)
    const canAssignToMachine = !pallet.currentOperation || 
      pallet.currentOperation.status === 'BUFFERED' || 
      (pallet.currentOperation.completionStatus === 'COMPLETED') || 
      (pallet.currentOperation.completionStatus === 'PARTIALLY_COMPLETED');
    
    if (isProcessing) {
      return <ResourceLoading loading={true} type="обновления" />;
    }
    
    if (machinesLoading) {
      return <ResourceLoading loading={machinesLoading} type="станков" />;
    }
    
    if (!machines || machines.length === 0) {
      return (
        <div className={styles.bufferCellError}>
          <span>Нет доступных станков</span>
          <button 
            className={styles.miniRetryButton} 
            onClick={handleRetryLoadResources}
            title="Обновить ресурсы"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M23 4v6h-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M1 20v-6h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      );
    }
    
    const currentMachineName = getMachineName(pallet.machine);
    
    return (
      <select 
        className={styles.machineSelect}
        value={currentMachineName}
        onChange={(e) => handleMachineChange(pallet.id, e.target.value)}
        disabled={!canAssignToMachine}
        title={!canAssignToMachine ? "Поддон уже назначен на станок и находится в процессе обработки" : "Выберите станок для поддона"}
      >
        <option value="">Выберите станок</option>
        {/* Добавляем сначала текущий с��анок, если он есть */}
        {currentMachineName && (
          <option key={`current-${currentMachineName}`} value={currentMachineName}>
            {currentMachineName} (текущий)
          </option>
        )}
        {/* Добавляем все остальные станки, которые не являются текущим */}
        {machines.map((machine) => {
          // Пропускаем текущий станок, так как он уже добавлен выше
          if (machine.name === currentMachineName) {
            return null;
          }
          return (
            <option key={machine.id} value={machine.name}>
              {machine.name}
            </option>
          );
        })}
      </select>
    );
  };

  // Компонент для отображения статуса операции
  const OperationStatus = ({ operation }: { operation?: any }) => {
    // Отладочный вывод
    console.log('Компонент OperationStatus получил операцию:', operation);
    
    if (!operation) {
      return <span className={styles.noOperation}>Не в обработке</span>;
    }
    
    // Получаем текст статуса (с приоритетом completionStatus)
    const statusText = getOperationStatusText(operation);
    
    // Получаем текст этапа обработки
    const processStepText = getProcessStepText(operation);
    
    return (
      <div className={styles.operationStatus}>
        <span className={`${styles.statusBadge} ${getOperationStatusClass(operation)}`}>
          {statusText}
        </span>
        {operation.processStep && (
          <span className={styles.processStep}>
            {processStepText}
          </span>
        )}
      </div>
    );
  };

  // Рендеринг основного компонента
  return (
    <div 
      ref={sidebarRef}
      className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}
    >
      <div className={styles.sidebarHeader}>
        <h2>Поддоны детали</h2>
        <button className={styles.closeButton} onClick={onClose}>×</button>
      </div>
      
      <div className={styles.sidebarContent}>
        {loading ? (
          <div className={styles.stateContainer}>
            <div className={styles.loadingSpinner}></div>
            <div className={styles.loadingMessage}>
              <h3>Загрузка данных</h3>
              <p>Пожалуйста, подождите...</p>
            </div>
          </div>
        ) : error || errorMessage ? (
          <div className={styles.stateContainer}>
            <div className={styles.errorIcon}>⚠️</div>
            <div className={styles.errorMessage}>
              <h3>Ошибка загрузки данных</h3>
              <p>{errorMessage || 'Произошла ошибка при получении информации о поддонах.'}</p>
              <button className={styles.retryButton} onClick={handleRetry}>
                Повторить загрузку
              </button>
            </div>
          </div>
        ) : pallets.length === 0 ? (
          <div className={styles.stateContainer}>
            <div className={styles.emptyIcon}>📭</div>
            <div className={styles.emptyMessage}>
              <h3>Нет доступных поддонов</h3>
              {detailId ? (
                <p>Для выбранной детали не найдено ни одного поддона.</p>
              ) : (
                <p>Выберите деталь для отображения её поддонов.</p>
              )}
            </div>
          </div>
        ) : (
          <div className={`${styles.tableContainer} ${showDetails ? styles.showDetails : styles.hideDetails}`}>
            <div className={styles.tableScrollContainer}>
              <table className={styles.palletsTable}>
                <thead>
                  <tr>
                    <th>Поддон</th>
                    <th>Количество</th>
                    <th>Станок</th>
                    <th>Буфер</th>
                    <th>Статус</th>
                    <th>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {pallets.map((pallet, index) => (
                    <tr 
                      key={pallet.id} 
                      className={`${styles.animatedRow} ${processingPalletId === pallet.id ? styles.processingRow : ''}`}
                      style={{ animationDelay: `${index * 0.05}s` }}
                      data-status={pallet.currentOperation?.status || pallet.currentOperation?.completionStatus || 'NO_OPERATION'}
                    >
                      <td>{pallet.name || `Поддон №${pallet.id}`}</td>
                      <td>{pallet.quantity}</td>
                      <td>
                        <MachineSelector pallet={pallet} />
                      </td>
                      <td>
                        <BufferCellSelector pallet={pallet} />
                      </td>
                      <td>
                        <OperationStatus operation={pallet.currentOperation} />
                      </td>
                      <td className={styles.actionsCell}>
                        <button 
                          className={`${styles.actionButton} ${styles.mlButton}`} 
                          onClick={() => handleOpenML(pallet.id)}
                          disabled={processingPalletId === pallet.id}
                          title="Маршрутный лист"
                        >
                          <DocumentIcon />
                          МЛ
                        </button>
                        {/* <button 
                          className={`${styles.actionButton} ${styles.refreshButton}`} 
                          onClick={() => handleRefreshPallet(pallet.id)}
                          disabled={processingPalletId === pallet.id}
                          title="Обновить данные поддона"
                        >
                          <RefreshIcon />
                     
                        </button> */}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PalletsSidebar;