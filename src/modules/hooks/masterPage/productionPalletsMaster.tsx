// hooks/useProductionPallets.ts - обновленный с WebSocket интеграцией
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  ProductionPallet, 
  fetchProductionPalletsByDetailId,
  updatePalletMachine,
  updatePalletBufferCell,
  BufferCellDto,
  MachineDto,
  fetchBufferCellsBySegmentId,
  fetchMachinBySegmentId,
  OperationDto,
  createPalletByPart,
  CreatePalletResponse,
  defectParts,
  DefectPartsResponse,
  redistributeParts,
  RedistributePartsResponse,
  PartDistribution,
} from '../../api/masterPage/productionPalletsServiceMaster';
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
  updateMachine: (palletId: number, machine: string, segmentId: number) => Promise<void>;
  updateBufferCell: (palletId: number, bufferCellId: number) => Promise<void>;
  loadSegmentResources: () => Promise<void>;
  refreshPalletData: (status: string) => Promise<void>;
  createPallet: (partId: number, quantity: number, palletName?: string) => Promise<CreatePalletResponse>;
  defectParts: (palletId: number, quantity: number, description?: string, machineId?: number) => Promise<DefectPartsResponse>;
  redistributeParts: (sourcePalletId: number, distributions: PartDistribution[], machineId?: number) => Promise<RedistributePartsResponse>;
}

// Получение комнаты из localStorage или конфигурации
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
  return 'room:masterceh';
};

const useProductionPallets = (initialDetailId: number | null = null): UseProductionPalletsResult => {
  const [pallets, setPallets] = useState<ProductionPallet[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [currentDetailId, setCurrentDetailId] = useState<number | null>(initialDetailId);
  const [unallocatedQuantity, setUnallocatedQuantity] = useState<number>(0);
  const [bufferCells, setBufferCells] = useState<BufferCellDto[]>([]);
  const [machines, setMachines] = useState<MachineDto[]>([]);
  
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
      // Если текущий массив пуст, просто устанавливаем новые данные
      if (currentPallets.length === 0) {
        return newPallets;
      }

      // Создаем Map для быстрого поиска по ID
      const currentPalletsMap = new Map(currentPallets.map(p => [p.id, p]));
      const updatedPallets: ProductionPallet[] = [];
      let hasChanges = false;

      newPallets.forEach(newPallet => {
        const currentPallet = currentPalletsMap.get(newPallet.id);
        
        if (!currentPallet) {
          // Новый поддон - добавляем
          updatedPallets.push(newPallet);
          hasChanges = true;
        } else {
          // Проверяем, изменился ли поддон
          const palletChanged = (
            JSON.stringify(currentPallet.currentOperation) !== JSON.stringify(newPallet.currentOperation) ||
            currentPallet.quantity !== newPallet.quantity ||
            JSON.stringify(currentPallet.machine) !== JSON.stringify(newPallet.machine) ||
            JSON.stringify(currentPallet.bufferCell) !== JSON.stringify(newPallet.bufferCell)
          );

          if (palletChanged) {
            updatedPallets.push(newPallet);
            hasChanges = true;
            console.log(`Поддон ${newPallet.id} обновлен:`, {
              old: currentPallet,
              new: newPallet
            });
          } else {
            // Поддон не изменился - оставляем старый
            updatedPallets.push(currentPallet);
          }
        }
      });

      // Проверяем удаленные поддоны
      const newPalletIds = new Set(newPallets.map(p => p.id));
      const removedPallets = currentPallets.filter(p => !newPalletIds.has(p.id));
      if (removedPallets.length > 0) {
        hasChanges = true;
        console.log('Удаленные поддоны:', removedPallets.map(p => p.id));
      }

      // Возвращаем обновленный массив только если были изменения
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
      const fetchedData = await fetchProductionPalletsByDetailId(detailId);
      
      setUnallocatedQuantity(fetchedData.unallocatedQuantity);
      
      if (fetchedData.pallets.length > 0) {
        const normalizedPallets = fetchedData.pallets.map(pallet => ({
          ...pallet,
          currentOperation: pallet.currentOperation === undefined ? null : pallet.currentOperation
        }));
        
        // Используем умное обновление
        updatePalletsSmartly(normalizedPallets);
      } else {
        setPallets([]);
      }
    } catch (err) {
      console.error('Ошибка при получении поддонов:', err);
      setError(err instanceof Error ? err : new Error('Произошла неизвестная ошибка'));
    } finally {
      setLoading(false);
    }
  }, [updatePalletsSmartly]);

  // Функция для обновления данных конкретного поддона
  const refreshPalletData = useCallback(async (status: string) => {
    try {
      // реагируем только на ожидаемый сигнал
      if (status !== 'updated') {
        console.warn('Игнорируем неожиданный status from socket:', status);
        return;
      }

      if (currentDetailId === null) return;

      // debounce: сбрасываем предыдущий таймер
      if (refreshTimeoutRef.current) {
        window.clearTimeout(refreshTimeoutRef.current);
      }

      refreshTimeoutRef.current = window.setTimeout(async () => {
        try {
          const fetchedData = await fetchProductionPalletsByDetailId(currentDetailId);

          const normalizedPallets = fetchedData.pallets.map(p => ({
            ...p,
            currentOperation: p.currentOperation === undefined ? null : p.currentOperation
          }));

          updatePalletsSmartly(normalizedPallets);
          setUnallocatedQuantity(fetchedData.unallocatedQuantity);

          console.log(`Данные поддонов обновлены (debounced).`);
        } catch (err) {
          console.error('Ошибка обновления данных поддонов:', err);
        }
      }, REFRESH_DEBOUNCE_MS);
    } catch (err) {
      console.error('Ошибка в refreshPalletData:', err);
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
  
  // Настройка WebSocket обработчиков событий
  useEffect(() => {
    if (!socket || !isWebSocketConnected) return;

    console.log('Настройка WebSocket обработчиков для комнаты:', room);

    // Обработчик события изменения поддона
    const handlePalletEvent = async (data: { status: string }) => {
      console.log('Получено WebSocket событие pallet:event - status:', data.status);
      await refreshPalletData(data.status);
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
  }, [socket, isWebSocketConnected, room, refreshPalletData, refreshBufferCells]);
  
  // Функция для обновления станка для поддона
  const updateMachine = useCallback(async (
    palletId: number, 
    machineName: string, 
    segmentId: number 
  ) => {
    try {
      const selectedMachine = machines.find(machine => machine.name === machineName);
      
      if (!selectedMachine) {
        throw new Error(`Станок с именем "${machineName}" не найден`);
      }
      
      const operation = await updatePalletMachine(palletId, machineName);
      
      // Обновляем локальное состояние
      setPallets(prevPallets => 
        prevPallets.map(pallet => {
          if (pallet.id === palletId) {
            return { 
              ...pallet, 
              machine: selectedMachine,
              bufferCell: null,
              currentOperation: operation as OperationDto
            };
          }
          return pallet;
        })
      );
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Ошибка при обновлении станка'));
      throw err;
    }
  }, [machines]);
  
  // Функция для обновления ячейки буфера для поддона
  const updateBufferCell = useCallback(async (palletId: number, bufferCellId: number) => {
    try {
      const selectedBufferCell = bufferCells.find(cell => cell.id === bufferCellId);
      
      if (!selectedBufferCell) {
        throw new Error(`Ячейка буфера с ID ${bufferCellId} не найдена`);
      }
      
      const operation = await updatePalletBufferCell(palletId, bufferCellId);
      
      // Обновляем локальное состояние
      setPallets(prevPallets => 
        prevPallets.map(pallet => {
          if (pallet.id === palletId) {
            return { 
              ...pallet, 
              bufferCell: selectedBufferCell,
              machine: null,
              currentOperation: operation as OperationDto
            };
          }
          return pallet;
        })
      );
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Ошибка при обновлении ячейки буфера'));
      throw err;
    }
  }, [bufferCells]);

  // Функция для загрузки ресурсов выбранного сегмента
  const loadSegmentResources = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Загружаем ресурсы параллельно и независимо друг от друга
      const [bufferCellsResult, machinesResult] = await Promise.allSettled([
        fetchBufferCellsBySegmentId(),
        fetchMachinBySegmentId()
      ]);

      // Обрабатываем результат загрузки ячеек буфера
      if (bufferCellsResult.status === 'fulfilled') {
        setBufferCells(bufferCellsResult.value);
      } else {
        console.warn('Не удалось загрузить ячейки буфера:', bufferCellsResult.reason);
        setBufferCells([]);
      }

      // Обрабатываем результат загрузки станков
      if (machinesResult.status === 'fulfilled') {
        setMachines(machinesResult.value);
      } else {
        console.warn('Не удалось загрузить станки:', machinesResult.reason);
        setMachines([]);
      }

      // Устанавливаем ошибку только если оба запроса завершились неудачно
      if (bufferCellsResult.status === 'rejected' && machinesResult.status === 'rejected') {
        setError(new Error('Не удалось загрузить ресурсы сегмента'));
      }
    } catch (err) {
      console.error('Критическая ошибка при загрузке ресурсов сегмента:', err);
      setError(err instanceof Error ? err : new Error('Неизвестная ошибка при загрузке ресурсов'));
    } finally {
      setLoading(false);
    }
  }, []);

  // Остальные функции остаются без изменений...
  const createPallet = useCallback(async (
    partId: number,
    quantity: number,
    palletName?: string
  ): Promise<CreatePalletResponse> => {
    try {
      setLoading(true);
      setError(null);

      const response = await createPalletByPart(partId, quantity, palletName);
      
      if (currentDetailId === partId) {
        await fetchPallets(currentDetailId);
      }

      return response;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Ошибка при создании поддона');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [currentDetailId, fetchPallets]);

  const defectPartsHandler = useCallback(async (
    palletId: number,
    quantity: number,
    description?: string,
    machineId?: number
  ): Promise<DefectPartsResponse> => {
    try {
      setLoading(true);
      setError(null);

      const response = await defectParts(palletId, quantity, description, machineId);
      
      if (currentDetailId) {
        await fetchPallets(currentDetailId);
      }

      return response;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Ошибка при отбраковке деталей');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [currentDetailId, fetchPallets]);

  const redistributePartsHandler = useCallback(async (
    sourcePalletId: number,
    distributions: PartDistribution[],
    machineId?: number
  ): Promise<RedistributePartsResponse> => {
    try {
      setLoading(true);
      setError(null);

      const response = await redistributeParts(sourcePalletId, distributions, machineId);
      
      if (currentDetailId) {
        await fetchPallets(currentDetailId);
      }

      return response;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Ошибка при перераспределении деталей');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [currentDetailId, fetchPallets]);
  
  // Инициализация с начальным ID детали
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
    updateMachine,
    updateBufferCell,
    bufferCells,
    machines,
    loadSegmentResources,
    refreshPalletData,
    createPallet,
    defectParts: defectPartsHandler,
    redistributeParts: redistributePartsHandler
  };
};

export default useProductionPallets;
