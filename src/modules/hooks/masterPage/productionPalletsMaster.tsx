// hooks/useProductionPallets.ts - обновленный с WebSocket интеграцией
import { useState, useEffect, useCallback, useMemo } from 'react';
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
import useWebSocket from './useWebSocket';

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
  refreshPalletData: (palletId: number) => Promise<void>;
  createPallet: (partId: number, quantity: number, palletName?: string) => Promise<CreatePalletResponse>;
  defectParts: (palletId: number, quantity: number, description?: string, machineId?: number) => Promise<DefectPartsResponse>;
  redistributeParts: (sourcePalletId: number, distributions: PartDistribution[]) => Promise<RedistributePartsResponse>;
}

// Получение комнаты из localStorage или конфигурации
const getRoomFromStorage = (): string => {
  try {
    // Получаем данные пользователя из localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      // Формируем название комнаты на основе роли или отдела пользователя
      if (user.department) {
        return `room:${user.department}`;
      }
      if (user.role === 'master') {
        return 'room:masterceh'; // Комната для мастеров цеха
      }
    }
    
    // Если данных пользователя нет, используем комнату по умолчанию
    return 'room:masterceh';
  } catch (error) {
    console.error('Ошибка при получении комнаты из localStorage:', error);
    return 'room:masterceh';
  }
};

const useProductionPallets = (initialDetailId: number | null = null): UseProductionPalletsResult => {
  const [pallets, setPallets] = useState<ProductionPallet[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [currentDetailId, setCurrentDetailId] = useState<number | null>(initialDetailId);
  const [unallocatedQuantity, setUnallocatedQuantity] = useState<number>(0);
  const [bufferCells, setBufferCells] = useState<BufferCellDto[]>([]);
  const [machines, setMachines] = useState<MachineDto[]>([]);
  
  // Получаем комнату для WebSocket подключения
  const room = useMemo(() => getRoomFromStorage(), []);
  
  // Инициализируем WebSocket подключение
  const { 
    socket, 
    isConnected: isWebSocketConnected, 
    error: webSocketError 
  } = useWebSocket({ 
    room,
    autoConnect: true 
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
  const refreshPalletData = useCallback(async (palletId: number) => {
    try {
      if (currentDetailId === null) return;
      
      // Получаем свежие данные всех поддонов (более надежно чем обновление одного)
      const fetchedData = await fetchProductionPalletsByDetailId(currentDetailId);
      
      // Обновляем состояние с проверкой изменений
      updatePalletsSmartly(fetchedData.pallets);
      setUnallocatedQuantity(fetchedData.unallocatedQuantity);
      
      console.log(`Данные поддона ${palletId} обновлены`);
    } catch (err) {
      console.error(`Ошибка обновления данных поддона ${palletId}:`, err);
    }
  }, [currentDetailId, updatePalletsSmartly]);
  
  // Настройка WebSocket обработчиков событий
  useEffect(() => {
    if (!socket || !isWebSocketConnected) return;

    console.log('Настройка WebSocket обработчиков для комнаты:', room);

    // Обработчик события изменения поддона
    const handlePalletEvent = async (data: { palletId: number }) => {
      console.log('Получено WebSocket событие - поддон изменен:', data.palletId);
      
      // Запрашиваем обновленные данные для этого поддона
      await refreshPalletData(data.palletId);
    };

    // Регистрируем обработчики событий
    socket.on('pallet:event', handlePalletEvent);

    // Cleanup функция
    return () => {
      socket.off('pallet:event', handlePalletEvent);
    };
  }, [socket, isWebSocketConnected, room, refreshPalletData, fetchPallets, currentDetailId]);
  
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
      const bufferCellsData = await fetchBufferCellsBySegmentId();
      setBufferCells(bufferCellsData);
      
      const machinesData = await fetchMachinBySegmentId();
      setMachines(machinesData);
    } catch (err) {
      console.error('Ошибка при загрузке ресурсов сегмента:', err);
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
    distributions: PartDistribution[]
  ): Promise<RedistributePartsResponse> => {
    try {
      setLoading(true);
      setError(null);

      const response = await redistributeParts(sourcePalletId, distributions);
      
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