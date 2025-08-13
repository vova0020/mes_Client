
import React, { useState, useEffect, useRef } from 'react';
import styles from './PalletsSidebar.module.css';
import useProductionPallets from '../../../hooks/masterPage/productionPalletsMaster';
import { getPalletRouteSheet, getOperationStatusText, getProcessStepText } from '../../../api/masterPage/productionPalletsServiceMaster';
import RedistributeModal from './RedistributeModal';

interface PalletsSidebarProps {
  detailInfo: any;
  detailId: number | null;
  isOpen: boolean;
  onClose: () => void;
}

const PalletsSidebar: React.FC<PalletsSidebarProps> = ({detailInfo, detailId, isOpen, onClose }) => {
  // Ref для боковой панели
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Используем обновленный хук для получения данных о поддонах
  const {
    pallets,
    bufferCells,
    machines,
    loading,
    error,
    unallocatedQuantity,
    fetchPallets,
    updateMachine,
    updateBufferCell,
    loadSegmentResources,
    refreshPalletData,
    createPallet,
    defectParts,
    redistributeParts
  } = useProductionPallets(null);

  const [showDetails, setShowDetails] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [bufferCellsLoading, setBufferCellsLoading] = useState<boolean>(false);
  const [machinesLoading, setMachinesLoading] = useState<boolean>(false);
  const [processingPalletId, setProcessingPalletId] = useState<number | null>(null);
  const [processStepIdError, setProcessStepIdError] = useState<string | null>(null);
  
  // Состояния для модального окна создания поддона
  const [showCreatePalletModal, setShowCreatePalletModal] = useState<boolean>(false);
  const [createPalletQuantity, setCreatePalletQuantity] = useState<string>('');
  const [createPalletName, setCreatePalletName] = useState<string>('');
  const [isCreatingPallet, setIsCreatingPallet] = useState<boolean>(false);
  
  // Состояния для меню действий с количеством
  const [showQuantityMenu, setShowQuantityMenu] = useState<number | null>(null);
  
  // Состояния для модального окна отбраковки
  const [showDefectModal, setShowDefectModal] = useState<boolean>(false);
  const [defectPalletId, setDefectPalletId] = useState<number | null>(null);
  const [defectQuantity, setDefectQuantity] = useState<string>('');
  const [defectDescription, setDefectDescription] = useState<string>('');
  const [isDefecting, setIsDefecting] = useState<boolean>(false);
  
  // Состояния для модального окна перераспределения
  const [showRedistributeModal, setShowRedistributeModal] = useState<boolean>(false);
  const [redistributePalletId, setRedistributePalletId] = useState<number | null>(null);
  const [isRedistributing, setIsRedistributing] = useState<boolean>(false);

  // Получаем значение из localStorage
  const getdefaultSegmentId = (): number | null => {
    try {
      const assignmentsData = localStorage.getItem('assignments');
      if (!assignmentsData) {
        setProcessStepIdError('Не найдены данные по сегментам в локальном хранилище');
        return null;
      }

      const parsedData = JSON.parse(assignmentsData);
      if (!parsedData.stages || parsedData.stages.length === 0) {
        setProcessStepIdError('Список сегментов в локальном хранилище пуст');
        return null;
      }

      const segmentId = parsedData.stages[0].id;
      if (typeof segmentId !== 'number') {
        setProcessStepIdError('Некорректный ID сегмента в локальном хранилище');
        return null;
      }

      return segmentId;
    } catch (error) {
      console.error('Ошибка при получении defaultSegmentId из localStorage:', error);
      setProcessStepIdError('Ошибка при чтении данных из локального хранилища');
      return null;
    }
  };

  const defaultSegmentId = getdefaultSegmentId();

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
    if (defaultSegmentId === null) {
      setErrorMessage('Невозможно назначить станок: не найден ID сегмента');
      return;
    }

    try {
      setProcessingPalletId(palletId);
      await updateMachine(palletId, newMachine, defaultSegmentId);
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
    setProcessStepIdError(null);
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
      console.log(`Данные поддона ${palletId} обн��влены`);
    } catch (err) {
      setErrorMessage('Не удалось обновить данные поддона');
      console.error('Ошибка при обновлении данных поддона:', err);
    } finally {
      setProcessingPalletId(null);
    }
  };

  // Обработчик открытия модального окна создания поддона
  const handleOpenCreatePalletModal = () => {
    setShowCreatePalletModal(true);
    setCreatePalletQuantity('');
    setCreatePalletName('');
    setErrorMessage(null);
  };

  // Обработчик закрытия модального окна создания поддона
  const handleCloseCreatePalletModal = () => {
    setShowCreatePalletModal(false);
    setCreatePalletQuantity('');
    setCreatePalletName('');
  };

  // Обработчик создания поддона
  const handleCreatePallet = async () => {
    if (!detailId) {
      setErrorMessage('Не выбрана деталь для создания поддона');
      return;
    }

    const quantity = parseInt(createPalletQuantity);
    if (isNaN(quantity) || quantity <= 0) {
      setErrorMessage('Введите корректное количество деталей');
      return;
    }

    if (quantity > unallocatedQuantity) {
      setErrorMessage(`Количество не может превышать доступное количество (${unallocatedQuantity})`);
      return;
    }

    try {
      setIsCreatingPallet(true);
      setErrorMessage(null);

      await createPallet(
        detailId,
        quantity,
        createPalletName.trim() || undefined
      );

      // Закрываем модальное окно после успешного создания
      handleCloseCreatePalletModal();
      
      console.log('Поддон успешно создан');
    } catch (err) {
      setErrorMessage('Не удалось создать поддон');
      console.error('Ошибка при создании поддона:', err);
    } finally {
      setIsCreatingPallet(false);
    }
  };

  // Обработчик клика по количеству
  const handleQuantityClick = (palletId: number) => {
    setShowQuantityMenu(showQuantityMenu === palletId ? null : palletId);
  };

  // Обработчик выбора действия с количеством
  const handleQuantityAction = (action: 'defect' | 'redistribute', palletId: number) => {
    if (action === 'defect') {
      setRedistributePalletId(null);
      setDefectPalletId(palletId);
      setDefectQuantity('');
      setDefectDescription('');
      setShowDefectModal(true);
    } else if (action === 'redistribute') {
      setDefectPalletId(null);
      setRedistributePalletId(palletId);
      setShowRedistributeModal(true);
    }
    setShowQuantityMenu(null);
  };

  // Обработчик отбраковки деталей
  const handleDefectParts = async () => {
    if (!defectPalletId) return;

    const quantity = parseInt(defectQuantity);
    const pallet = pallets.find(p => p.id === defectPalletId);
    
    if (!pallet) {
      setErrorMessage('Поддон не найден');
      return;
    }

    if (isNaN(quantity) || quantity <= 0) {
      setErrorMessage('Введите корректное количество деталей');
      return;
    }

    if (quantity > pallet.quantity) {
      setErrorMessage(`Количество не может превышать ${pallet.quantity}`);
      return;
    }

    try {
      setIsDefecting(true);
      setErrorMessage(null);

      await defectParts(
        defectPalletId,
        quantity,
        defectDescription.trim() || undefined,
        pallet.machine?.id
      );

      setShowDefectModal(false);
      console.log('Детали успешно отбракованы');
    } catch (err) {
      setErrorMessage('Не удалось отбраковать детали');
      console.error('Ошибка при отбраковке деталей:', err);
    } finally {
      setIsDefecting(false);
    }
  };

  // Обработчик перераспределения деталей
  const handleRedistributeParts = async (distributions: any[]) => {
    if (!redistributePalletId) return;

    try {
      setIsRedistributing(true);
      setErrorMessage(null);

      await redistributeParts(redistributePalletId, distributions);
      
      setShowRedistributeModal(false);
      console.log('Детали успешно перераспределены');
    } catch (err) {
      setErrorMessage('Не удалось перераспределить детали');
      console.error('Ошибка при перераспределении деталей:', err);
    } finally {
      setIsRedistributing(false);
    }
  };

  // Получение адреса ячейки буфера по коду
  const getBufferCellAddress = (bufferCell: any): string => {
    if (!bufferCell) return '';

    // Добавляем отладочный вывод для проверки структуры объекта
    console.log('Структура bufferCell:', bufferCell);

    // Проверяем разные варианты структуры bufferCell
    // 1. Прямой доступ к code (как в текущих данных с сервера)
    if (bufferCell.code) {
      return bufferCell.code;
    }

    // 2. Доступ через buffer.code (если структура соответствует интерфейсу BufferCellDto)
    if (bufferCell.buffer && bufferCell.buffer.code) {
      return bufferCell.buffer.code;
    }

    return '';
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
    // if (operation.completionStatus) {
    //   switch (operation.completionStatus) {
    //     case 'ON_MACHINE': return styles.statusOnMachine;
    //     case 'IN_PROGRESS': return styles.statusInProgress;
    //     case 'BUFFERED': return styles.statusBuffered;
    //     case 'COMPLETED': return styles.statusCompleted;
    //     case 'PARTIALLY_COMPLETED': return styles.statusPartiallyCompleted;
    //     default: return '';
    //   }
    // } else if (operation.status) {
    //   // Используем status, если completionStatus отсутствует
    //   switch (operation.status) {
    //     case 'ON_MACHINE': return styles.statusOnMachine;
    //     case 'IN_PROGRESS': return styles.statusInProgress;
    //     case 'BUFFERED': return styles.statusBuffered;
    //     case 'COMPLETED': return styles.statusCompleted;
    //     // case 'FAILED': return styles.statusFailed;
    //     default: return '';
    //   }
    // }
     switch (operation.status) {
        case 'NOT_PROCESSED': return styles.statusPassedPreviousStage;
        case 'PENDING': return styles.statusOnMachine;
        case 'IN_PROGRESS': return styles.statusInProgress;
        case 'BUFFERED': return styles.statusBuffered;
        case 'COMPLETED': return styles.statusCompleted;
        case 'FAILED': return styles.statusFailed;
        default: return '';
      }
    // return '';
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
              <path d="M23 4v6h-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M1 20v-6h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      );
    }

    // Получаем код текущей ячейки буфера
    const currentBufferCellCode = getBufferCellAddress(pallet.bufferCell);

    return (
      <select
        className={styles.bufferCellSelect}
        value={currentBufferCellCode}
        onChange={(e) => handleBufferCellChange(pallet.id, e.target.value)}
        title="Выберите ячейку буфера для поддона"
      >
        <option value="">Выберите ячейку</option>
        {/* Добавляем сначала текущую ячейку буфера, если она есть */}
        {currentBufferCellCode && (
          <option key={`current-${currentBufferCellCode}`} value={currentBufferCellCode}>
            {currentBufferCellCode} (текущая)
          </option>
        )}
        {/* Добавляем все остальные ячейки буфера, которые не являются текущей */}
        {bufferCells.sort((a, b) => a.id - b.id).map((cell) => {
          // Пропускаем текущую ячейку буфера, так как она уже добавлена выше
          if (cell.code === currentBufferCellCode) {
            return null;
          }
          return (
            <option key={cell.id} value={cell.code}>
              {cell.code}
            </option>
          );
        })}
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
      pallet.currentOperation.status === 'NOT_PROCESSED' ||
      (pallet.currentOperation.completionStatus === 'COMPLETED') ||
      (pallet.currentOperation.completionStatus === 'PARTIALLY_COMPLETED');

    // Если отсутствует ID сегмента, отображаем предупреждение
    if (defaultSegmentId === null) {
      return (
        <div className={styles.bufferCellError}>
          <span>Ошибка ID этапа</span>
        </div>
      );
    }

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
              <path d="M23 4v6h-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M1 20v-6h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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
        {/* Добавляем сначала текущий станок, если он есть */}
        {currentMachineName && (
          <option key={`current-${currentMachineName}`} value={currentMachineName}>
            {currentMachineName} (текущий)
          </option>
        )}
        {/* Добавляем все остальные станки, которые не являются текущим */}
        {machines.sort((a, b) => a.id - b.id).map((machine) => {
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
      <div className={styles.headerTop}>
        <h2>Поддоны детали</h2>
        <button className={styles.closeButton} onClick={onClose}>×</button>
      </div>
      <div className={styles.detailInfo}>
        <div className={styles.detailProperty}>
          <span className={styles.propertyLabel}>Артикул:</span>
          <span className={styles.propertyValue}>{detailInfo.articleNumber}</span>
        </div>
        <div className={styles.detailProperty}>
          <span className={styles.propertyLabel}>Название:</span>
          <span className={styles.propertyValue}>{detailInfo.name}</span>
        </div>
        <div className={styles.detailProperty}>
          <span className={styles.propertyLabel}>Размер:</span>
          <span className={styles.propertyValue}>{detailInfo.size}</span>
        </div>
        {/* Отображаем информацию о нераспределенных деталях */}
        {!loading && detailId && (
          <div className={styles.detailProperty}>
            <span className={styles.propertyLabel}>Нераспределено:</span>
            <span className={`${styles.propertyValue} ${unallocatedQuantity > 0 ? styles.unallocatedQuantity : ''}`}>
              {unallocatedQuantity} шт.
            </span>
          </div>
        )}
      </div>
    </div>

    <div className={styles.sidebarContent}>
      {/* Остальное содержимое компонента без изменени�� */}
      {loading ? (
        <div className={styles.stateContainer}>
          <div className={styles.loadingSpinner}></div>
          <div className={styles.loadingMessage}>
            <h3>Загрузка данных</h3>
            <p>Пожалуйста, подождите...</p>
          </div>
        </div>
      ) : processStepIdError ? (
        <div className={styles.stateContainer}>
          <div className={styles.errorIcon}>⚠️</div>
          <div className={styles.errorMessage}>
            <h3>Ошибка загрузки ID сегмента</h3>
            <p>{processStepIdError}</p>
            <button className={styles.retryButton} onClick={handleRetry}>
              Повторить загрузку
            </button>
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
              <>
                <p>Для выбранной детали не найдено ни одного поддона.</p>
                {unallocatedQuantity > 0 && (
                  <>
                    <p>Доступно для распределения: <strong>{unallocatedQuantity} шт.</strong></p>
                    <button 
                      className={styles.createPalletButton}
                      onClick={handleOpenCreatePalletModal}
                      disabled={isCreatingPallet}
                    >
                      {isCreatingPallet ? 'Создание...' : 'Создать поддон'}
                    </button>
                  </>
                )}
              </>
            ) : (
              <p>Выберите деталь для отображения её поддонов.</p>
            )}
          </div>
        </div>
      ) : (
        <div className={`${styles.tableContainer} ${showDetails ? styles.showDetails : styles.hideDetails}`}>
          {/* Кнопка создания поддона, если есть нераспределенные детали */}
          {unallocatedQuantity > 0 && (
            <div className={styles.createPalletSection}>
              <div className={styles.unallocatedInfo}>
                Нераспределено: <strong>{unallocatedQuantity} шт.</strong>
              </div>
              <button 
                className={styles.createPalletButtonSmall}
                onClick={handleOpenCreatePalletModal}
                disabled={isCreatingPallet}
              >
                {isCreatingPallet ? 'Созда��ие...' : '+ Создать поддон'}
              </button>
            </div>
          )}
          
          <div className={styles.tableScrollContainer}>
            <table className={styles.palletsTable}>
              <thead>
                <tr>
                  <th>Поддон</th>
                  <th>Количество</th>
                  <th>Адрес</th>
                   <th>Станок</th>
                  <th>Статус</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {pallets.sort((a, b) => a.id - b.id).map((pallet, index) => (
                  <tr
                    key={pallet.id}
                    className={`${styles.animatedRow} ${processingPalletId === pallet.id ? styles.processingRow : ''}`}
                    style={{ animationDelay: `${index * 0.05}s` }}
                    data-status={pallet.currentOperation?.status || pallet.currentOperation?.completionStatus || 'NO_OPERATION'}
                  >
                    <td>{pallet.name || `Поддон №${pallet.id}`}</td>
                    <td className={styles.quantityCell}>
                      <button
                        className={`${styles.quantityButton} quantityButton`}
                        onClick={() => handleQuantityClick(pallet.id)}
                        title="Редактировать количество"
                      >
                        {pallet.quantity}
                      </button>
                      

                    </td>
                    <td>
                      <BufferCellSelector pallet={pallet} />
                    </td>
                    <td>
                      <MachineSelector pallet={pallet} />
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

                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>

    {/* Модальное окно создания поддона */}
    {showCreatePalletModal && (
      <div className={styles.modalOverlay} onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleCloseCreatePalletModal();
        }
      }}>
        <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
          <div className={styles.modalHeader}>
            <h3>Создать новый поддон</h3>
            <button 
              className={styles.modalCloseButton}
              onClick={handleCloseCreatePalletModal}
              disabled={isCreatingPallet}
            >
              ×
            </button>
          </div>
          
          <div className={styles.modalBody}>
            <div className={styles.formGroup}>
              <label htmlFor="palletQuantity">Количество деталей *</label>
              <input
                id="palletQuantity"
                type="number"
                min="1"
                max={unallocatedQuantity}
                value={createPalletQuantity}
                onChange={(e) => setCreatePalletQuantity(e.target.value)}
                placeholder={`Максимум: ${unallocatedQuantity}`}
                disabled={isCreatingPallet}
                className={styles.formInput}
              />
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="palletName">Название поддона (опционально)</label>
              <input
                id="palletName"
                type="text"
                value={createPalletName}
                onChange={(e) => setCreatePalletName(e.target.value)}
                placeholder="Автоматически, если не указано"
                disabled={isCreatingPallet}
                className={styles.formInput}
              />
            </div>

            {errorMessage && (
              <div className={styles.errorMessage}>
                {errorMessage}
              </div>
            )}
          </div>
          
          <div className={styles.modalFooter}>
            <button 
              className={styles.cancelButton}
              onClick={handleCloseCreatePalletModal}
              disabled={isCreatingPallet}
            >
              Отмена
            </button>
            <button 
              className={styles.createButton}
              onClick={handleCreatePallet}
              disabled={isCreatingPallet || !createPalletQuantity}
            >
              {isCreatingPallet ? 'Создание...' : 'Создать'}
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Модальное окно отбраковки деталей */}
    {showDefectModal && defectPalletId && (
      <div className={styles.modalOverlay} onClick={(e) => {
        if (e.target === e.currentTarget) {
          setShowDefectModal(false);
        }
      }}>
        <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
          <div className={styles.modalHeader}>
            <h3>Отбраковать детали</h3>
            <button 
              className={styles.modalCloseButton}
              onClick={() => setShowDefectModal(false)}
              disabled={isDefecting}
            >
              ×
            </button>
          </div>
          
          <div className={styles.modalBody}>
            <div className={styles.palletInfo}>
              <span>Поддон: <strong>{pallets.find(p => p.id === defectPalletId)?.name}</strong></span>
              <span>Доступно: <strong>{pallets.find(p => p.id === defectPalletId)?.quantity} шт.</strong></span>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="defectQuantity">Количество отбракованных деталей *</label>
              <input
                id="defectQuantity"
                type="number"
                min="1"
                max={pallets.find(p => p.id === defectPalletId)?.quantity || 1}
                value={defectQuantity}
                onChange={(e) => setDefectQuantity(e.target.value)}
                disabled={isDefecting}
                className={styles.formInput}
              />
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="defectDescription">Описание брака (опционально)</label>
              <textarea
                id="defectDescription"
                value={defectDescription}
                onChange={(e) => setDefectDescription(e.target.value)}
                placeholder="Опишите причину брака..."
                disabled={isDefecting}
                className={styles.formTextarea}
                rows={3}
              />
            </div>

            {errorMessage && (
              <div className={styles.errorMessage}>
                {errorMessage}
              </div>
            )}
          </div>
          
          <div className={styles.modalFooter}>
            <button 
              className={styles.cancelButton}
              onClick={() => setShowDefectModal(false)}
              disabled={isDefecting}
            >
              Отмена
            </button>
            <button 
              className={styles.createButton}
              onClick={handleDefectParts}
              disabled={isDefecting || !defectQuantity}
            >
              {isDefecting ? 'Отбраковка...' : 'Отбраковать'}
            </button>
          </div>
        </div>
      </div>
    )}



    {/* Меню действий с количеством */}
    {showQuantityMenu !== null && (
      <div className={styles.modalOverlay}>
        <div className={styles.quantityMenuContent} onClick={(e) => e.stopPropagation()}>
          <div className={styles.quantityMenuHeader}>
            <h3>Действия с количеством</h3>
            <button 
              className={styles.quantityMenuCloseButton}
              onClick={() => setShowQuantityMenu(null)}
            >
              ×
            </button>
          </div>
          <div className={styles.quantityMenuBody}>
            <button
              className={styles.quantityMenuButton}
              onClick={(e) => {
                e.stopPropagation();
                handleQuantityAction('defect', showQuantityMenu);
              }}
            >
              Отбраковать детали
            </button>
            {(() => {
              const pallet = pallets.find(p => p.id === showQuantityMenu);
              const isDisabled = pallet?.currentOperation?.status === 'IN_PROGRESS' || pallet?.currentOperation?.status === 'COMPLETED';
              return (
                <button
                  className={`${styles.quantityMenuButton} ${isDisabled ? styles.disabledButton : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isDisabled) {
                      handleQuantityAction('redistribute', showQuantityMenu);
                    }
                  }}
                  disabled={isDisabled}
                  style={isDisabled ? {
                    background: 'linear-gradient(135deg, #f5f5f5, #e0e0e0)',
                    color: '#999',
                    cursor: 'not-allowed'
                  } : {}}
                >
                  Перераспределить
                </button>
              );
            })()}
          </div>
        </div>
      </div>
    )}

    {/* Модальное окно перераспределения */}
    {showRedistributeModal && redistributePalletId && (
      <RedistributeModal
        isOpen={showRedistributeModal}
        onClose={() => setShowRedistributeModal(false)}
        pallet={pallets.find(p => p.id === redistributePalletId)!}
        existingPallets={pallets}
        onRedistribute={handleRedistributeParts}
        isProcessing={isRedistributing}
      />
    )}
  </div>
);

};

export default PalletsSidebar;
