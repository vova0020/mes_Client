import React, { useState, useEffect, useRef } from 'react';
import styles from './NoSmenPalletsSidebar.module.css';
import useProductionPallets from '../../../../hooks/machinNoSmenHook/productionPallets';
import { 
  ProductionPallet, 
  BufferCellDto, 
  CurrentOperationDto,
  TaskStatus,
  getPalletRouteSheet,
  getOperationStatusText,
  getProcessStepText,
  CompleteProcessingResponseDto,
  TakeToWorkResponseDto,
  CreatePalletRequestDto,
  PartDistribution
} from '../../../../api/machinNoSmenApi/productionPalletsService';
import RedistributeModal from './RedistributeModal';

interface PalletsSidebarProps {
  detailInfo: any;
  detailId: number | null;
  isOpen: boolean;
  onClose: () => void;
  handleOpenML: (palletId?: number) => void;
  position?: { top: number; right: number };
  onDataUpdate?: () => void;
}

const PalletsSidebar: React.FC<PalletsSidebarProps> = ({
  detailInfo,
  detailId, 
  isOpen, 
  onClose,
  handleOpenML,
  position = { top: 120, right: 20 },
  onDataUpdate
}) => {
  // Ref для боковой панели
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Используем хук для получения данных о поддонах
  const {
    pallets,
    loading,
    error,
    unallocatedQuantity,
    fetchPalletsWithUnallocated,
    bufferCells,
    loadSegmentResources,
    refreshPalletData,
    updateBufferCell,
    takeToWork,
    completeProcessing,
    createPallet,
    defectParts,
    redistributeParts,
    returnParts
  } = useProductionPallets(detailId);

  const [showDetails, setShowDetails] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [nextStepInfo, setNextStepInfo] = useState<string | null>(null);
  const [bufferCellsLoading, setBufferCellsLoading] = useState<boolean>(false);
  const [processingPalletId, setProcessingPalletId] = useState<number | null>(null);
  
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
  
  // Состояния для модального окна возврата деталей
  const [showReturnModal, setShowReturnModal] = useState<boolean>(false);
  const [returnPalletId, setReturnPalletId] = useState<number | null>(null);
  const [returnQuantity, setReturnQuantity] = useState<string>('');
  const [isReturning, setIsReturning] = useState<boolean>(false);

  // Добавляем обработчик кликов вне боковой па��ели
  // useEffect(() => {
  //   const handleOutsideClick = (event: MouseEvent) => {
  //     // Проверяем, что sidebar открыт и что клик был не внутри него
  //     if (isOpen &&
  //       sidebarRef.current &&
  //       !sidebarRef.current.contains(event.target as Node)) {
  //       onClose();
  //     }
  //   };

  //   // Добавляем обработчик только если панель открыта
  //   if (isOpen) {
  //     // Используем setTimeout, чтобы не сработало закрытие сразу после открытия
  //     setTimeout(() => {
  //       document.addEventListener('mousedown', handleOutsideClick);
  //     }, 100);
  //   }

  //   // Удаляем обработчик при закрытии панели или размонтировании компонента
  //   return () => {
  //     document.removeEventListener('mousedown', handleOutsideClick);
  //   };
  // }, [isOpen, onClose]);

  // Загрузка данных о поддонах для выбранной детали
  useEffect(() => {
    if (detailId !== null && isOpen) {
      setShowDetails(false);
      setErrorMessage(null);
      setSuccessMessage(null);
      setNextStepInfo(null);
      setBufferCellsLoading(true);

      // Сначала загружаем ресурсы сегмента (включая ячейки буфера)
      loadSegmentResources()
        .then(() => {
          setBufferCellsLoading(false);
          // Затем загружаем данные о поддонах
          return fetchPalletsWithUnallocated(detailId);
        })
        .then(() => {
          // Показываем детали с небольшой задержкой для анимации
          setTimeout(() => {
            setShowDetails(true);
          }, 100);
        })
        .catch((err) => {
          setBufferCellsLoading(false);
          setErrorMessage('Не удалось загрузить данные о поддонах');
          console.error('Ошибка загрузки данных:', err);
        });
    }
  }, [detailId, isOpen, fetchPalletsWithUnallocated, loadSegmentResources]);

  // Сбрасываем состояние при закрытии панели
  useEffect(() => {
    if (!isOpen) {
      setShowDetails(false);
      setErrorMessage(null);
      setSuccessMessage(null);
      setNextStepInfo(null);
      setShowCreatePalletModal(false);
      setShowQuantityMenu(null);
      setShowDefectModal(false);
      setShowRedistributeModal(false);
    }
  }, [isOpen]);

  // Очистка сообщения об успехе через 5 секунд
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
      
      return () => {
        clearTimeout(timer);
      };
    }
  }, [successMessage]);

  // Обработчик изменения адреса ячейки буфера
  const handleBufferCellChange = async (palletId: number, bufferCellAddress: string) => {
    // Находим ID ячейки буфера по адресу
    const bufferCell = bufferCells.find(cell => cell.code === bufferCellAddress);
    if (!bufferCell) return;

    try {
      setProcessingPalletId(palletId);
      setErrorMessage(null);
      setSuccessMessage(null);
      setNextStepInfo(null);
      
      await updateBufferCell(palletId, bufferCell.id);
      
      // Обновляем данные после успешной операции
      if (detailId) {
        await fetchPalletsWithUnallocated(detailId);
      }
      
      setSuccessMessage(`Поддон  перемещен в ячейку буфера ${bufferCellAddress}`);
      console.log(`Поддон ${palletId} перемещен в ячейку буфера: ${bufferCellAddress}`);
    } catch (err) {
      setErrorMessage('Не удалось обновить ячейку буфера для поддона');
      console.error('Ошибка при перемещении поддона в буфер:', err);
    } finally {
      setProcessingPalletId(null);
    }
  };

  // Обработчик для кнопки "Взять в работу"
  const handleTakeToWork = async (palletId: number) => {
    try {
      setProcessingPalletId(palletId);
      setErrorMessage(null);
      setSuccessMessage(null);
      setNextStepInfo(null);
      console.log(`Поддон ${palletId} берется в работу...`);
      
      // Получаем ID этапа из localStorage
      const stageId = localStorage.getItem('selectedMachineStageId');
      
      if (!stageId) {
        setErrorMessage('Не удалось определить этап для обработки');
        return;
      }
      
      const response = await takeToWork(palletId, Number(stageId));
      console.log(`Поддон ${palletId} успешно взят в работу:`, response);
      
      // Обновляем данные после успешной операции
      if (detailId) {
        await fetchPalletsWithUnallocated(detailId);
      }
      
      // Уведомляем родительский компонент об обновлении данных
      if (onDataUpdate) {
        onDataUpdate();
      }
      
      if (response && response.assignment) {
        const assignment = response.assignment;
        const palletName = assignment.pallet?.palletName || `№${assignment.pallet?.palletId || palletId}`;
        setSuccessMessage(`Поддон  успешно взят в работу`);
        
        if (response.operation && response.operation.processStep) {
          setNextStepInfo(`Начата обработка: ${response.operation.processStep.name}`);
        }
      } else {
        setSuccessMessage(`Поддон  успешно взят в работу`);
      }
    } catch (error) {
      console.error(`Ошибка при взятии поддона ${palletId} в работу:`, error);
      
      const apiError = error as any;
      const errorMessage = apiError.response?.data?.message || apiError.message;
      
      // Проверяем, является ли это ошибкой о незавершенном предыдущем этапе
      if (errorMessage && errorMessage.includes('Нельзя взять поддон') && errorMessage.includes('в работу. Предыдущий этап')) {
        // Извлекаем название этапа из сообщения
        const stageMatch = errorMessage.match(/Предыдущий этап "([^"]+)" не завершен/);
        const stageName = stageMatch ? stageMatch[1] : 'предыдущий этап';
        
        setErrorMessage(`Поддон  не может быть взят в работу. Необходимо завершить этап "${stageName}".`);
      } else if (errorMessage && errorMessage.includes('Поддон не найден')) {
        setErrorMessage(`Поддон не найден в системе`);
      } else if (errorMessage && errorMessage.includes('Станок не найден')) {
        setErrorMessage(`Станок не найден в системе`);
      } else if (errorMessage && errorMessage.includes('Поддон уже занят')) {
        setErrorMessage(`Поддон уже занят другим станком`);
      } else if (errorMessage && errorMessage.includes('станок не готов к работе')) {
        setErrorMessage(`Станок не готов к работе`);
      } else if (errorMessage && errorMessage.includes('не может выполнять данный этап')) {
        setErrorMessage(`Станок не может выполнять данный этап обработки`);
      } else {
        setErrorMessage(`Не удалось взять поддон в работу: ${errorMessage || 'Неизвестная ошибка'}`);
      }
    } finally {
      setProcessingPalletId(null);
    }
  };

  // Обработчик для кнопки "Завершить обработку"
  const handleCompleteProcessing = async (palletId: number) => {
    try {
      setProcessingPalletId(palletId);
      setErrorMessage(null);
      setSuccessMessage(null);
      setNextStepInfo(null);
      console.log(`Поддон ${palletId} завершается...`);
      
      // Получаем ID этапа из localStorage
      const stageId = localStorage.getItem('selectedMachineStageId');
      
      if (!stageId) {
        setErrorMessage('Не удалось определить этап для завершения');
        return;
      }
      
      const response = await completeProcessing(palletId, Number(stageId));
      console.log(`Поддон ${palletId} успешно завершен:`, response);
      
      // Обновляем данные после успешной операции
      if (detailId) {
        await fetchPalletsWithUnallocated(detailId);
      }
      
      // Уведомляем родительский компонент об обновлении данных
      if (onDataUpdate) {
        onDataUpdate();
      }
      
      if (response) {
        setNextStepInfo(response.nextStage || 'Этап обработки завершен');
        
        const assignment = response.assignment;
        if (assignment && assignment.pallet) {
          const palletName = assignment.pallet.palletName || `№${assignment.pallet.palletId}`;
          setSuccessMessage(`Поддон ${palletName} успешно завершен`);
        } else {
          setSuccessMessage(`Поддон №${palletId} успешно завершен`);
        }
      } else {
        setSuccessMessage(`Поддон №${palletId} успешно завершен`);
      }
    } catch (error) {
      console.error(`Ошибка при завершении обработки поддона ${palletId}:`, error);
      
      const apiError = error as any;
      const errorMessage = apiError.response?.data?.message || apiError.message;
      
      if (errorMessage && errorMessage.includes('Активное назначение не найдено')) {
        setErrorMessage(`Активное назначение не найдено`);
      } else if (errorMessage && errorMessage.includes('Не найден активный прогресс этапа')) {
        setErrorMessage(`Не найден активный прогресс этапа`);
      } else {
        setErrorMessage(`Не удалось завершить обработку поддона: ${errorMessage || 'Неизвестная ошибка'}`);
      }
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

  // Иконка проверки для сооб��ений успеха
  const CheckIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
      <polyline points="22 4 12 14.01 9 11.01"></polyline>
    </svg>
  );

  // Обработчик повторной загрузки данных
  const handleRetry = () => {
    setErrorMessage(null);
    if (detailId !== null) {
      fetchPalletsWithUnallocated(detailId);
    }
  };

  // Обработчик повторной загрузки ячеек буфера
  const handleRetryLoadResources = () => {
    setBufferCellsLoading(true);
    loadSegmentResources()
      .then(() => {
        setBufferCellsLoading(false);
      })
      .catch((err) => {
        setBufferCellsLoading(false);
        console.error('Ошибка загрузки ресурсов:', err);
      });
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

      await createPallet({
        partId: detailId,
        quantity: quantity,
        palletName: createPalletName.trim() || undefined
      });

      // Закрываем модальное окно после успешного создания
      handleCloseCreatePalletModal();
      setSuccessMessage(`Поддон успешно создан`);
      
      // Обновляем данные после создания поддона
      await fetchPalletsWithUnallocated(detailId);
      
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
  const handleQuantityAction = (action: 'defect' | 'redistribute' | 'return', palletId: number) => {
    if (action === 'defect') {
      setRedistributePalletId(null);
      setReturnPalletId(null);
      setDefectPalletId(palletId);
      setDefectQuantity('');
      setDefectDescription('');
      setShowDefectModal(true);
    } else if (action === 'redistribute') {
      setDefectPalletId(null);
      setReturnPalletId(null);
      setRedistributePalletId(palletId);
      setShowRedistributeModal(true);
    } else if (action === 'return') {
      setDefectPalletId(null);
      setRedistributePalletId(null);
      setReturnPalletId(palletId);
      setReturnQuantity('');
      setShowReturnModal(true);
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
      setSuccessMessage('Детали успешно отбракованы');
      console.log('Детали успешно отбракованы');
    } catch (err) {
      setErrorMessage('Не удалось отбраковать детали');
      console.error('Ошибка при отбраковке деталей:', err);
    } finally {
      setIsDefecting(false);
    }
  };

  // Получаем machineId из localStorage (как у мастера)
  const getMachineIdFromStorage = (): number | undefined => {
    try {
      const assignmentsData = localStorage.getItem('assignments');
      if (!assignmentsData) return undefined;
      
      const data = JSON.parse(assignmentsData);
      return data.machines?.[0]?.id;
    } catch (error) {
      console.error('Ошибка при получении machineId из localStorage:', error);
      return undefined;
    }
  };

  // Обработчик перераспределения деталей
  const handleRedistributeParts = async (distributions: PartDistribution[], machineId?: number) => {
    if (!redistributePalletId) return;

    try {
      setIsRedistributing(true);
      setErrorMessage(null);

      await redistributeParts(redistributePalletId, distributions);
      
      setShowRedistributeModal(false);
      setSuccessMessage('Детали успешно перераспределены');
      console.log('Детали успешно перераспределены');
    } catch (err) {
      setErrorMessage('Не удалось перераспределить детали');
      console.error('Ошибка при перераспределении деталей:', err);
    } finally {
      setIsRedistributing(false);
    }
  };

  // Обработчик возврата деталей
  const handleReturnParts = async () => {
    if (!returnPalletId || !detailId) return;

    const quantity = parseInt(returnQuantity);

    if (isNaN(quantity) || quantity <= 0) {
      setErrorMessage('Введите корректное количество деталей');
      return;
    }

    // Получаем returnToStageId из selectedStage
    let returnToStageId: number | null = null;
    try {
      const selectedStageData = localStorage.getItem('selectedStage');
      if (selectedStageData) {
        const selectedStage = JSON.parse(selectedStageData);
        returnToStageId = selectedStage.id;
      }
    } catch (error) {
      console.error('Ошибка при получении selectedStage:', error);
    }

    if (!returnToStageId) {
      setErrorMessage('Не удалось определить ID этапа');
      return;
    }

    try {
      setIsReturning(true);
      setErrorMessage(null);

      await returnParts(detailId, returnPalletId, quantity, returnToStageId);

      setShowReturnModal(false);
      setReturnQuantity('');
      setSuccessMessage('Детали успешно возвращены в производство');
      console.log('Детали успешно возвращены в производство');
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || err?.message || 'Не удалось вернуть детали';
      setErrorMessage(errorMsg);
      console.error('Ошибка при возврате деталей:', err);
    } finally {
      setIsReturning(false);
    }
  };

  // Получение адреса ячейки буфера по коду
  const getBufferCellAddress = (bufferCell: any): string => {
    if (!bufferCell) return '';

    // Проверяем разные варианты структуры bufferCell
    if (bufferCell.code) {
      return bufferCell.code;
    }

    if (bufferCell.buffer && bufferCell.buffer.code) {
      return bufferCell.buffer.code;
    }

    return '';
  };

  // Функция для получения класса стиля в зависимости от статуса операции
  const getOperationStatusClass = (operation?: any): string => {
    if (!operation) return '';

    switch (operation.status) {
      case 'NOT_PROCESSED': return styles.statusPassedPreviousStage;
      case 'PENDING': return styles.statusOnMachine;
      case 'IN_PROGRESS': return styles.statusInProgress;
      case 'BUFFERED': return styles.statusBuffered;
      case 'COMPLETED': return styles.statusCompleted;
      case 'FAILED': return styles.statusFailed;
      default: return '';
    }
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
        disabled={isProcessing || pallet.currentOperation?.status === 'IN_PROGRESS'}
        title={pallet.currentOperation?.status === 'IN_PROGRESS' ? 
              'Нельзя изменить буфер во время обработки' : 'Выберите ячейку буфера для поддона'}
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

  // Компонент для отображения статуса операции
  const OperationStatus = ({ operation }: { operation?: any }) => {
    if (!operation) {
      return <span className={styles.noOperation}>Не в обработке</span>;
    }

    // Получаем текст статуса
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
        {operation.isCompletedForDetail && (
          <span className={styles.completedForDetail} title="Обработка детали завершена">
            ✓
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
          <h2>Информация о поддонах</h2>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </div>
        {detailInfo && (
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
        )}
      </div>

      <div className={styles.sidebarContent}>
        {/* Отображение сообщения об успешной операции */}
        {successMessage && (
          <div className={styles.successNotification}>
            <CheckIcon />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Отображение сообщения об ошибке */}
        {errorMessage && (
          <div className={styles.errorNotification}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="15" y1="9" x2="9" y2="15"></line>
              <line x1="9" y1="9" x2="15" y2="15"></line>
            </svg>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Отобра��ение информации о следующем шаге */}
        {nextStepInfo && (
          <div className={styles.nextStepInfo}>
            <span>{nextStepInfo}</span>
          </div>
        )}

        {/* Остальное содержимое компонента */}
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
                  {isCreatingPallet ? 'Создание...' : '+ Создать поддон'}
                </button>
              </div>
            )}
            
            <div className={styles.tableScrollContainer}>
              <table className={styles.palletsTable}>
                <thead>
                  <tr>
                    <th>Поддон</th>
                    <th>Количество</th>
                    <th>Буфер</th>
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
                        <OperationStatus operation={pallet.currentOperation} />
                        {pallet.currentStepName && !pallet.currentOperation && (
                          <span className={styles.nextStep} title="Следующий этап обработки">
                            Следующий: {pallet.currentStepName}
                          </span>
                        )}
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

                        <button 
                          className={`${styles.actionButton} ${styles.inProgressButton}`}
                          onClick={() => handleTakeToWork(pallet.id)}
                          disabled={processingPalletId === pallet.id || 
                                 pallet.currentOperation?.status === TaskStatus.IN_PROGRESS ||
                                 pallet.currentOperation?.status === TaskStatus.COMPLETED}
                          title="Взять в работу"
                        >
                          Взять в работу
                        </button>
                        <button 
                          className={`${styles.actionButton} ${styles.completedButton}`}
                          onClick={() => handleCompleteProcessing(pallet.id)}
                          disabled={processingPalletId === pallet.id || 
                                 pallet.currentOperation?.status === TaskStatus.COMPLETED ||
                                 pallet.currentOperation?.status === TaskStatus.NOT_PROCESSED ||
                                 !pallet.currentOperation?.status}
                          title="Завершить обработку"
                        >
                          Завершить
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
        <div className={styles.modalOverlay} onClick={handleCloseCreatePalletModal}>
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
              <button
                className={styles.quantityMenuButton}
                onClick={(e) => {
                  e.stopPropagation();
                  handleQuantityAction('return', showQuantityMenu);
                }}
              >
                Вернуть детали
              </button>
              {(() => {
                const pallet = pallets.find(p => p.id === showQuantityMenu);
                const isDisabled =  false;
                // const isDisabled = pallet?.currentOperation?.status === 'IN_PROGRESS' || pallet?.currentOperation?.status === 'COMPLETED';
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

      {/* Модальное окно возврата деталей */}
      {showReturnModal && returnPalletId && (
        <div className={styles.modalOverlay} onClick={(e) => {
          if (e.target === e.currentTarget) {
            setShowReturnModal(false);
          }
        }}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Вернуть детали в производство</h3>
              <button 
                className={styles.modalCloseButton}
                onClick={() => setShowReturnModal(false)}
                disabled={isReturning}
              >
                ×
              </button>
            </div>
            
            <div className={styles.modalBody}>
              <div className={styles.palletInfo}>
                <span>Поддон: <strong>{pallets.find(p => p.id === returnPalletId)?.name}</strong></span>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="returnQuantity">Количество деталей *</label>
                <input
                  id="returnQuantity"
                  type="number"
                  min="1"
                  value={returnQuantity}
                  onChange={(e) => setReturnQuantity(e.target.value)}
                  disabled={isReturning}
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
                onClick={() => setShowReturnModal(false)}
                disabled={isReturning}
              >
                Отмена
              </button>
              <button 
                className={styles.createButton}
                onClick={handleReturnParts}
                disabled={isReturning || !returnQuantity}
              >
                {isReturning ? 'Возврат...' : 'Вернуть'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PalletsSidebar;