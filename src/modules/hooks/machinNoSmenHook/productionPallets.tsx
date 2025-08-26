import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { 
  ProductionPallet, 
  fetchAvailablePallets,
  fetchAvailablePalletsWithUnallocated,
  BufferCellDto,
  MachineDto,
  fetchBufferCellsBySegmentId,
  OperationDto,
  CurrentOperationDto,
  getCurrentOperation,
  takeToWork,
  completeProcessing,
  moveToBuffer,
  CompleteProcessingResponseDto,
  TakeToWorkResponseDto,
  CreatePalletRequestDto,
  CreatePalletResponseDto,
  createPalletByPart,
  PalletsWithUnallocatedResponseDto,
  DefectPartsRequestDto,
  DefectPartsResponseDto,
  RedistributePartsRequestDto,
  RedistributePartsResponseDto,
  PartDistribution,
  defectParts,
  redistributeParts,
  getUserData,
  getStageIdFromStorage
} from '../../api/machinNoSmenApi/productionPalletsService';
import { useWebSocketRoom } from '../../../hooks/useWebSocketRoom';

// Определение интерфейса результата хука
interface UseProductionPalletsResult {
  pallets: ProductionPallet[];
  loading: boolean;
  error: Error | null;
  bufferCells: BufferCellDto[];
  machines: MachineDto[];
  unallocatedQuantity: number;
  isWebSocketConnected: boolean;
  webSocketError: string | null;
  fetchPallets: (detailId: number | null) => Promise<void>;
  fetchAvailablePallets: (detailId: number) => Promise<void>;
  fetchPalletsWithUnallocated: (detailId: number) => Promise<PalletsWithUnallocatedResponseDto>;
  loadSegmentResources: () => Promise<void>;
  refreshPalletData: (palletId: number) => Promise<void>;
  refreshPalletsData: (status: string) => Promise<void>;
  updateBufferCell: (palletId: number, bufferCellId: number) => Promise<void>;
  startPalletProcessing: (palletId: number) => Promise<void>;
  completePalletProcessing: (palletId: number) => Promise<CompleteProcessingResponseDto>;
  takeToWork: (palletId: number) => Promise<TakeToWorkResponseDto>;
  completeProcessing: (palletId: number) => Promise<CompleteProcessingResponseDto>;
  moveToBuffer: (palletId: number, bufferCellId: number) => Promise<{ message: string; pallet: any }>;
  createPallet: (request: CreatePalletRequestDto) => Promise<CreatePalletResponseDto>;
  defectParts: (palletId: number, quantity: number, description?: string, machineId?: number) => Promise<DefectPartsResponseDto>;
  redistributeParts: (sourcePalletId: number, distributions: PartDistribution[]) => Promise<RedistributePartsResponseDto>;
}

// Получение комнаты из localStorage
const getRoomFromStorage = (): string => {
  // Временно закомментировано - используем фиксированную комнату
  // try {
  //   const userData = localStorage.getItem('user');
  //   if (userData) {
  //     const user = JSON.parse(userData);
  //     if (user.department) {
  //       return `room:${user.department}`;
  //     }
  //     if (user.role === 'master') {
  //       return 'room:masterceh';
  //     }
  //   }
  //   return 'room:masterceh';
  // } catch (error) {
  //   console.error('Ошибка при получении комнаты из localStorage:', error);
  //   return 'room:masterceh';
  // }
  
  // Фиксированная комната (может быть несколько: room1, room2, etc.)
  return 'room:machinesnosmen';
};

// Пользовательский хук для управления данными о производственных поддонах
const useProductionPallets = (initialDetailId: number | null = null): UseProductionPalletsResult => {
  const [pallets, setPallets] = useState<ProductionPallet[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [currentDetailId, setCurrentDetailId] = useState<number | null>(initialDetailId);
  // Состояние для ячеек буфера и станков
  const [bufferCells, setBufferCells] = useState<BufferCellDto[]>([]);
  const [machines, setMachines] = useState<MachineDto[]>([]);
  // Состояние для количества нераспределенных деталей
  const [unallocatedQuantity, setUnallocatedQuantity] = useState<number>(0);
  
  // debounce refs
  const refreshTimeoutRef = useRef<number | null>(null);
  const REFRESH_DEBOUNCE_MS = 300;
  
  // Получаем комнату для WebSocket подключения
  const room = useMemo(() => getRoomFromStorage(), []);
  
  // Инициализируем WebSocket подключение
  const { 
    socket, 
    isConnected: isWebSocketConnected, 
    error: webSocketError 
  } = useWebSocketRoom({ 
    room,
    autoJoin: true 
  });

  // Функция для умного обновления массива поддонов
  const updatePalletsSmartly = useCallback((newPallets: ProductionPallet[]) => {
    setPallets(currentPallets => {
      if (currentPallets.length === 0) {
        return newPallets;
      }

      const currentPalletsMap = new Map(currentPallets.map(p => [p.id, p]));
      const updatedPallets: ProductionPallet[] = [];
      let hasChanges = false;

      newPallets.forEach(newPallet => {
        const currentPallet = currentPalletsMap.get(newPallet.id);
        
        if (!currentPallet) {
          updatedPallets.push(newPallet);
          hasChanges = true;
        } else {
          const palletChanged = JSON.stringify(currentPallet) !== JSON.stringify(newPallet);

          if (palletChanged) {
            updatedPallets.push(newPallet);
            hasChanges = true;
          } else {
            updatedPallets.push(currentPallet);
          }
        }
      });

      const newPalletIds = new Set(newPallets.map(p => p.id));
      const removedPallets = currentPallets.filter(p => !newPalletIds.has(p.id));
      if (removedPallets.length > 0) {
        hasChanges = true;
      }

      return hasChanges ? updatedPallets : currentPallets;
    });
  }, []);

  // Функция для умного обновления ячеек буфера
  const updateBufferCellsSmartly = useCallback((newBufferCells: BufferCellDto[]) => {
    setBufferCells(currentBufferCells => {
      if (currentBufferCells.length === 0) {
        return newBufferCells;
      }

      const currentBufferCellsMap = new Map(currentBufferCells.map(c => [c.id, c]));
      const updatedBufferCells: BufferCellDto[] = [];
      let hasChanges = false;

      newBufferCells.forEach(newCell => {
        const currentCell = currentBufferCellsMap.get(newCell.id);
        
        if (!currentCell) {
          updatedBufferCells.push(newCell);
          hasChanges = true;
        } else {
          const cellChanged = JSON.stringify(currentCell) !== JSON.stringify(newCell);

          if (cellChanged) {
            updatedBufferCells.push(newCell);
            hasChanges = true;
          } else {
            updatedBufferCells.push(currentCell);
          }
        }
      });

      const newCellIds = new Set(newBufferCells.map(c => c.id));
      const removedCells = currentBufferCells.filter(c => !newCellIds.has(c.id));
      if (removedCells.length > 0) {
        hasChanges = true;
      }

      return hasChanges ? updatedBufferCells : currentBufferCells;
    });
  }, []);
  
  // Функция для преобразования OperationDto в CurrentOperationDto
  const convertOperationToCurrentOperation = (operation: OperationDto | null): CurrentOperationDto | null => {
    if (!operation) return null;
    
    // Преобразуем OperationDto в CurrentOperationDto
    return {
      id: operation.id,
      status: operation.status as any, // Приводим к типу TaskStatus
      startedAt: operation.startedAt,
      completedAt: operation.completedAt,
      processStep: operation.processStep ? {
        id: operation.processStep.id,
        name: operation.processStep.name,
        sequence: operation.processStep.sequence ?? 0 // Используем 0 если sequence undefined
      } : {
        id: 0,
        name: 'Неизвестный этап',
        sequence: 0
      },
      completionStatus: operation.completionStatus,
      isCompletedForDetail: operation.isCompletedForDetail
    };
  };
  
  // Функция для получения поддонов для конкретной детали
  const fetchPallets = useCallback(async (detailId: number | null) => {
    if (detailId === null) {
      setPallets([]);
      setCurrentDetailId(null);
      return;
    }
     
    setLoading(true);
    setError(null);
    setCurrentDetailId(detailId);
    
    try {
      // Получаем данные о поддонах
      const fetchedPallets = await fetchAvailablePallets(detailId);
      
      if (fetchedPallets.length > 0) {
        // Проверяем, есть ли у первого поддона данные об операции
        const hasExistingOperations = fetchedPallets.some(p => p.currentOperation);
        
        if (hasExistingOperations) {
          // Убедимся, что currentOperation определен (не undefined)
          const normalizedPallets = fetchedPallets.map(pallet => ({
            ...pallet,
            // Если currentOperation === undefined, то преобразуем его в null для единообразия
            currentOperation: pallet.currentOperation === undefined ? null : pallet.currentOperation
          }));
          
          updatePalletsSmartly(normalizedPallets);
        } else {
          // Если данных об операциях нет, делаем дополнительные запросы
          const palletsWithOperations = await Promise.all(
            fetchedPallets.map(async (pallet) => {
              try {
                const operation = await getCurrentOperation(pallet.id);
                const convertedOperation = convertOperationToCurrentOperation(operation);
                return {
                  ...pallet,
                  currentOperation: convertedOperation // null или данные операции
                } as ProductionPallet;
              } catch (err) {
                console.error(`Ошибка при получении операции для поддона ${pallet.id}:`, err);
                return {
                  ...pallet,
                  currentOperation: null
                } as ProductionPallet;
              }
            })
          );
          
          updatePalletsSmartly(palletsWithOperations);
        }
      } else {
        // Если поддонов нет, просто устанавливаем пустой массив
        setPallets([]);
      }
    } catch (err) {
      console.error('Ошибка при получении поддонов:', err);
      setError(err instanceof Error ? err : new Error('Произошла неизвестная ошибка'));
    } finally {
      setLoading(false);
    }
  }, [updatePalletsSmartly]);

  // Функция для обновления данных поддонов
  const refreshPalletsData = useCallback(async (status: string) => {
    try {
      if (status !== 'updated') {
        console.warn('Игнорируем неожиданный status from socket:', status);
        return;
      }

      if (currentDetailId === null) return;

      if (refreshTimeoutRef.current) {
        window.clearTimeout(refreshTimeoutRef.current);
      }

      refreshTimeoutRef.current = window.setTimeout(async () => {
        try {
          const fetchedPallets = await fetchAvailablePallets(currentDetailId);
          const normalizedPallets = fetchedPallets.map(pallet => ({
            ...pallet,
            currentOperation: pallet.currentOperation === undefined ? null : pallet.currentOperation
          }));
          updatePalletsSmartly(normalizedPallets);
          console.log(`Данные поддонов обновлены (debounced).`);
        } catch (err) {
          console.error('Ошибка обновления данных поддонов:', err);
        }
      }, REFRESH_DEBOUNCE_MS);
    } catch (err) {
      console.error('Ошибка в refreshPalletsData:', err);
    }
  }, [currentDetailId, updatePalletsSmartly]);

  // Функция для обновления ячеек буфера
  const refreshBufferCells = useCallback(async (status: string) => {
    try {
      if (status !== 'updated') {
        console.warn('Игнорируем неожиданный status from socket для буфера:', status);
        return;
      }

      if (refreshTimeoutRef.current) {
        window.clearTimeout(refreshTimeoutRef.current);
      }

      refreshTimeoutRef.current = window.setTimeout(async () => {
        try {
          const bufferCellsData = await fetchBufferCellsBySegmentId();
          updateBufferCellsSmartly(bufferCellsData);
          console.log(`Ячейки буфера обновлены (debounced).`);
        } catch (err) {
          console.error('Ошибка обновления ячеек буфера:', err);
        }
      }, REFRESH_DEBOUNCE_MS);
    } catch (err) {
      console.error('Ошибка в refreshBufferCells:', err);
    }
  }, [updateBufferCellsSmartly]);

  // Функция для обновления данных конкретного поддона
  const refreshPalletData = useCallback(async (palletId: number) => {
    try {
      // Получаем текущий список поддонов и данные для текущей детали
      if (currentDetailId === null) return;
      
      // Получаем текущую операцию для поддона
      const operation = await getCurrentOperation(palletId);
      const convertedOperation = convertOperationToCurrentOperation(operation);
      
      // Обновляем состояние поддона в массиве
      setPallets(prevPallets => 
        prevPallets.map(pallet => {
          if (pallet.id === palletId) {
            return { 
              ...pallet, 
              currentOperation: convertedOperation // null или данные операции
            };
          }
          return pallet;
        })
      );
    } catch (err) {
      console.error(`Ошибка обновления данных поддона ${palletId}:`, err);
    }
  }, [currentDetailId]);

  // Настройка WebSocket обработчиков событий
  useEffect(() => {
    if (!socket || !isWebSocketConnected) return;

    console.log('Настройка WebSocket обработчиков для комнаты:', room);

    // Обработчик события изменения поддона
    const handlePalletEvent = async (data: { status: string }) => {
      console.log('Получено WebSocket событие pallet:event - status:', data.status);
      await refreshPalletsData(data.status);
    };

    // Обработчик события изменения настроек буфера
    const handleBufferSettingsEvent = async (data: { status: string }) => {
      console.log('Получено WebSocket событие buffer_settings:event - status:', data.status);
      await refreshBufferCells(data.status);
    };

    // Регистрируем обработчики событий
    socket.on('pallet:event', handlePalletEvent);
    socket.on('buffer_settings:event', handleBufferSettingsEvent);

    // Cleanup функция
    return () => {
      socket.off('pallet:event', handlePalletEvent);
      socket.off('buffer_settings:event', handleBufferSettingsEvent);

      // очистка debounce таймера при unmount/переподключении
      if (refreshTimeoutRef.current) {
        window.clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
      }
    };
  }, [socket, isWebSocketConnected, room, refreshPalletsData, refreshBufferCells]);

  // Функция для получения доступных поддонов (новая фнкция)
  const handleFetchAvailablePallets = useCallback(async (detailId: number) => {
    setLoading(true);
    setError(null);
    setCurrentDetailId(detailId);
    
    try {
      // Получаем данные о доступных поддонах
      const fetchedPallets = await fetchAvailablePallets(detailId);
      
      console.log('Полученные доступные поддоны:', fetchedPallets);
      
      // Нормализуем данные поддонов
      const normalizedPallets = fetchedPallets.map(pallet => ({
        ...pallet,
        currentOperation: pallet.currentOperation === undefined ? null : pallet.currentOperation
      }));
      
      updatePalletsSmartly(normalizedPallets);
    } catch (err) {
      console.error('Ошибка при получении доступных поддонов:', err);
      setError(err instanceof Error ? err : new Error('Произошла неизвестная ошибка'));
    } finally {
      setLoading(false);
    }
  }, [updatePalletsSmartly]);

  // Функция для изменения буферной ячейки поддона (используем новую функцию moveToBuffer)
  const handleUpdateBufferCell = useCallback(async (palletId: number, bufferCellId: number) => {
    try {
      // Вызываем новый API-метод для перемещения поддона в буфер
      await moveToBuffer(palletId, bufferCellId);
      
      // Обновляем данные о поддоне
      await refreshPalletData(palletId);
    } catch (err) {
      console.error(`Ошибка при обновлении буферной ячейки для поддона ${palletId}:`, err);
      throw err;
    }
  }, [refreshPalletData]);

  // Функция для взятия поддона в работу (новая функция)
  const handleTakeToWork = useCallback(async (palletId: number): Promise<TakeToWorkResponseDto> => {
    try {
      // Вызываем новый API-метод для взятия поддона в работу
      const response = await takeToWork(palletId);
      
      // Обновляем данные о поддоне
      await refreshPalletData(palletId);
      
      return response;
    } catch (err) {
      console.error(`Ошибка при взятии поддона ${palletId} в работу:`, err);
      throw err;
    }
  }, [refreshPalletData]);

  // Функция для завершения обработки поддона (новая функция)
  const handleCompleteProcessing = useCallback(async (palletId: number): Promise<CompleteProcessingResponseDto> => {
    try {
      // Вызываем новый API-метод для завершения обработки поддона
      const response = await completeProcessing(palletId);
      
      // Обновляем данные о поддоне
      await refreshPalletData(palletId);
      
      return response;
    } catch (err) {
      console.error(`Ошибка при завершении обработки поддона ${palletId}:`, err);
      throw err;
    }
  }, [refreshPalletData]);

  // Функция для перемещения поддона в буфер (новая функция)
  const handleMoveToBuffer = useCallback(async (palletId: number, bufferCellId: number): Promise<{ message: string; pallet: any }> => {
    try {
      // Вызываем новый API-метод для перемещения поддона в буфер
      const response = await moveToBuffer(palletId, bufferCellId);
      
      // Обновляем данные о поддоне
      await refreshPalletData(palletId);
      
      return response;
    } catch (err) {
      console.error(`Ошибка при перемещении поддона ${palletId} в буфер:`, err);
      throw err;
    }
  }, [refreshPalletData]);

  // Функция для перевода поддона в статус "В работу" (устаревшая, оставлена для совместимости)
  const handleStartPalletProcessing = useCallback(async (palletId: number) => {
    try {
      // Используем новую функцию takeToWork
      await takeToWork(palletId);
      
      // Обновляем данные о поддоне
      await refreshPalletData(palletId);
    } catch (err) {
      console.error(`Ошибка при переводе поддона ${palletId} в статус "В работу":`, err);
      throw err;
    }
  }, [refreshPalletData]);

  // Функция для перевода поддона в статус "Готово" (устаревшая, оставлена для совместимости)
  const handleCompletePalletProcessing = useCallback(async (palletId: number): Promise<CompleteProcessingResponseDto> => {
    try {
      // Используем новую функцию completeProcessing
      const response = await completeProcessing(palletId);
      
      // Обновляем данные о поддоне
      await refreshPalletData(palletId);
      
      return response;
    } catch (err) {
      console.error(`Ошибка при переводе поддона ${palletId} в статус "Готово":`, err);
      throw err;
    }
  }, [refreshPalletData]);

  // Функция для получения поддонов с количеством нераспределенных деталей
  const handleFetchPalletsWithUnallocated = useCallback(async (detailId: number): Promise<PalletsWithUnallocatedResponseDto> => {
    setLoading(true);
    setError(null);
    setCurrentDetailId(detailId);
    
    try {
      // Получаем данные о поддонах с количеством нераспределенных деталей
      const response = await fetchAvailablePalletsWithUnallocated(detailId);
      
      console.log('Полученные поддоны с нераспределенными деталями:', response);
      
      // Нормализуем данные поддонов
      const normalizedPallets = response.pallets.map(pallet => ({
        ...pallet,
        currentOperation: pallet.currentOperation === undefined ? null : pallet.currentOperation
      }));
      
      updatePalletsSmartly(normalizedPallets);
      setUnallocatedQuantity(response.unallocatedQuantity);
      
      return response;
    } catch (err) {
      console.error('Ошибка при получении поддонов с нераспределенными деталями:', err);
      setError(err instanceof Error ? err : new Error('Произошла неизвестная ошибка'));
      throw err;
    } finally {
      setLoading(false);
    }
  }, [updatePalletsSmartly]);

  // Функция для создания поддона
  const handleCreatePallet = useCallback(async (request: CreatePalletRequestDto): Promise<CreatePalletResponseDto> => {
    try {
      // Вызываем API для создания поддона
      const response = await createPalletByPart(request);
      
      // Обновляем список поддонов после создания
      if (currentDetailId) {
        await handleFetchPalletsWithUnallocated(currentDetailId);
      }
      
      return response;
    } catch (err) {
      console.error('Ошибка при создании поддона:', err);
      throw err;
    }
  }, [currentDetailId, handleFetchPalletsWithUnallocated]);

  // Функция для отбраковки деталей
  const handleDefectParts = useCallback(async (
    palletId: number, 
    quantity: number, 
    description?: string, 
    machineId?: number
  ): Promise<DefectPartsResponseDto> => {
    try {
      // Получаем данные пользователя и этапа
      const userData = getUserData();
      const stageId = getStageIdFromStorage();
      
      if (!userData) {
        throw new Error('Данные пользователя не найдены');
      }
      
      if (!stageId) {
        throw new Error('ID этапа не найден');
      }
      
      const request: DefectPartsRequestDto = {
        palletId,
        quantity,
        reportedById: userData.id,
        description,
        machineId,
        stageId
      };
      
      // Вызываем API для отбраковки деталей
      const response = await defectParts(request);
      
      // Обновляем список поддонов после отбраковки
      if (currentDetailId) {
        await handleFetchPalletsWithUnallocated(currentDetailId);
      }
      
      return response;
    } catch (err) {
      console.error('Ошибка при отбраковке деталей:', err);
      throw err;
    }
  }, [currentDetailId, handleFetchPalletsWithUnallocated]);

  // Функция для перераспределения деталей
  const handleRedistributeParts = useCallback(async (
    sourcePalletId: number, 
    distributions: PartDistribution[]
  ): Promise<RedistributePartsResponseDto> => {
    try {
      const request: RedistributePartsRequestDto = {
        sourcePalletId,
        distributions
      };
      
      // Вызываем API для перераспределения деталей
      const response = await redistributeParts(request);
      
      // Обновляем список поддонов после перераспределения
      if (currentDetailId) {
        await handleFetchPalletsWithUnallocated(currentDetailId);
      }
      
      return response;
    } catch (err) {
      console.error('Ошибка при перераспределении деталей:', err);
      throw err;
    }
  }, [currentDetailId, handleFetchPalletsWithUnallocated]);

  // Функция для загрузки ресурсов выбранного сегмента
  const loadSegmentResources = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Загружаем данные о ячейках буфера
      const bufferCellsData = await fetchBufferCellsBySegmentId();
      updateBufferCellsSmartly(bufferCellsData);
      
      // Примечание: в productionPalletsService.ts нет функции fetchMachinBySegmentId
      // Поэтому оставляем пустой массив для machines
      setMachines([]);
    } catch (err) {
      console.error('Ошибка при загрузке ресурсов сегмента:', err);
      setError(err instanceof Error ? err : new Error('Неизвестная ошибка при загрузке ресурсов'));
    } finally {
      setLoading(false);
    }
  }, [updateBufferCellsSmartly]);
  
  // Инициализация с начальным ID детали, если он предоставлен
  useEffect(() => {
    if (initialDetailId !== null && initialDetailId !== currentDetailId) {
      fetchPallets(initialDetailId);
    }
  }, [initialDetailId, currentDetailId, fetchPallets]);
  
  return {
    pallets,
    loading,
    error,
    unallocatedQuantity,
    isWebSocketConnected,
    webSocketError,
    fetchPallets,
    fetchAvailablePallets: handleFetchAvailablePallets,
    fetchPalletsWithUnallocated: handleFetchPalletsWithUnallocated,
    bufferCells,
    machines,
    loadSegmentResources,
    refreshPalletData,
    refreshPalletsData,
    updateBufferCell: handleUpdateBufferCell,
    startPalletProcessing: handleStartPalletProcessing,
    completePalletProcessing: handleCompletePalletProcessing,
    takeToWork: handleTakeToWork,
    completeProcessing: handleCompleteProcessing,
    moveToBuffer: handleMoveToBuffer,
    createPallet: handleCreatePallet,
    defectParts: handleDefectParts,
    redistributeParts: handleRedistributeParts
  };
};

export default useProductionPallets;