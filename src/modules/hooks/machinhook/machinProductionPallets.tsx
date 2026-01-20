import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { 
  ProductionPallet, 
  fetchProductionPalletsByDetailId,
  BufferCellDto,
  MachineDto,
  fetchBufferCellsBySegmentId,
  OperationDto,
  getCurrentOperation,
  startPalletProcessing,
  completePalletProcessing,
  updateBufferCell,
  CompleteProcessingResponseDto,
  returnParts
} from '../../api/machineApi/machinProductionPalletsService';
import { DefectPalletPartsDto, DefectPartsResponse, RedistributePartsRequest, RedistributePartsResponse } from '../../api/machineApi/machineApi';
import { useWebSocketRoom } from '../../../hooks/useWebSocketRoom';

// Определение интерфейса результата хука
interface UseProductionPalletsResult {
  pallets: ProductionPallet[];
  loading: boolean;
  error: Error | null;
  bufferCells: BufferCellDto[];
  machines: MachineDto[];
  isWebSocketConnected: boolean;
  webSocketError: string | null;
  fetchPallets: (detailId: number | null) => Promise<void>;
  loadSegmentResources: () => Promise<void>;
  refreshPalletData: (palletId: number) => Promise<void>;
  refreshPalletsData: (status: string) => Promise<void>;
  updateBufferCell: (palletId: number, bufferCellId: number) => Promise<void>;
  startPalletProcessing: (palletId: number, machineId: number, operatorId: number, stageId: number) => Promise<void>;
  completePalletProcessing: (palletId: number, machineId: number, operatorId: number, stageId: number) => Promise<CompleteProcessingResponseDto>;
  defectPalletParts: (defectData: DefectPalletPartsDto) => Promise<DefectPartsResponse>;
  redistributeParts: (redistributeData: RedistributePartsRequest) => Promise<RedistributePartsResponse>;
  returnParts: (partId: number, palletId: number, quantity: number, returnToStageId: number) => Promise<any>;
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
  return 'room:machines';
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
      // Получаем данные о поддонах - новая структура API уже содержит всю необходимую информацию
      const fetchedPallets = await fetchProductionPalletsByDetailId(detailId);
      
      // Устанавливаем полученные данные напрямую
      // Новая структура API уже содержит currentStageProgress и другие необходимые поля
      updatePalletsSmartly(fetchedPallets || []);
      
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
          const fetchedPallets = await fetchProductionPalletsByDetailId(currentDetailId);
          updatePalletsSmartly(fetchedPallets || []);
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
      
      // Перезагружаем все данные о поддонах для обеспечения актуальности
      // Это проще и надежнее, чем обновлять отдельный поддон
      await fetchPallets(currentDetailId);
      
    } catch (err) {
      console.error(`Ошибка обновления данных поддона ${palletId}:`, err);
    }
  }, [currentDetailId, fetchPallets]);

  // Настройка WebSocket обработчиков событий
  useEffect(() => {
    if (!socket || !isWebSocketConnected) return;

    console.log('Настройка WebSocket обработчиков для поддонов в комнате:', room);

    const handlePalletEvent = async (data: { status: string }) => {
      console.log('Получено WebSocket событие pallet:event - status:', data.status);
      await refreshPalletsData(data.status);
    };

    const handleBufferSettingsEvent = async (data: { status: string }) => {
      console.log('Получено WebSocket событие buffer_settings:event - status:', data.status);
      await refreshBufferCells(data.status);
    };

    socket.on('pallet:event', handlePalletEvent);
    socket.on('buffer_settings:event', handleBufferSettingsEvent);

    return () => {
      socket.off('pallet:event', handlePalletEvent);
      socket.off('buffer_settings:event', handleBufferSettingsEvent);
      if (refreshTimeoutRef.current) {
        window.clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
      }
    };
  }, [socket, isWebSocketConnected, room, refreshPalletsData, refreshBufferCells]);

  // Функция для изменения буферной ячейки поддона
  const handleUpdateBufferCell = useCallback(async (palletId: number, bufferCellId: number) => {
    try {
      // Вызываем API-метод для обновления буферной ячейки
      await updateBufferCell(palletId, bufferCellId);
      
      // Обновляем данные о поддоне
      await refreshPalletData(palletId);
    } catch (err) {
      console.error(`Ошибка при обновлении буферной ячейки для поддона ${palletId}:`, err);
      throw err;
    }
  }, [refreshPalletData]);

  // Функция для перевода поддона в статус "В работу"
  const handleStartPalletProcessing = useCallback(async (palletId: number, machineId: number, operatorId: number, stageId: number) => {
    try {
      // Вызываем API-метод для перевода поддона в статус "В работу"
      await startPalletProcessing(palletId, machineId, operatorId, stageId);
      
      // Обновляем данные о поддоне
      await refreshPalletData(palletId);
    } catch (err) {
      console.error(`Ошибка при переводе поддона ${palletId} в статус "В работу":`, err);
      throw err;
    }
  }, [refreshPalletData]);

  // Функция для перевода поддона в статус "Готово"
  const handleCompletePalletProcessing = useCallback(async (palletId: number, machineId: number, operatorId: number, stageId: number): Promise<CompleteProcessingResponseDto> => {
    try {
      // Вызываем API-метод для перевода поддона в статус "Готово"
      const response = await completePalletProcessing(palletId, machineId, operatorId, stageId);
      
      // Обновляем данные о всех поддонах для обеспечения актуальности
      await refreshPalletData(palletId);
      
      return response;
    } catch (err) {
      console.error(`Ошибка при переводе поддона ${palletId} в статус "Готово":`, err);
      throw err;
    }
  }, [refreshPalletData]);

  // Функция для отбраковки деталей с поддона
  const handleDefectPalletParts = useCallback(async (defectData: DefectPalletPartsDto): Promise<DefectPartsResponse> => {
    try {
      // Используем API напрямую
      const { machineApi } = await import('../../api/machineApi/machineApi');
      const response = await machineApi.defectPalletParts(defectData);
      
      // Обновляем данные о поддоне после отбраковки
      await refreshPalletData(defectData.palletId);
      
      return response;
    } catch (err) {
      console.error(`Ошибка при отбраковке деталей с поддона ${defectData.palletId}:`, err);
      throw err;
    }
  }, [refreshPalletData]);

  // Функция для получения machineId из localStorage
  const getMachineId = useCallback((): number | undefined => {
    try {
      const assignmentsData = localStorage.getItem('assignments');
      if (!assignmentsData) return undefined;
      
      const data = JSON.parse(assignmentsData);
      return data.machines?.[0]?.id;
    } catch (error) {
      console.error('Ошибка при получении machineId из localStorage:', error);
      return undefined;
    }
  }, []);

  // Функция для перераспределения деталей между поддонами
  const handleRedistributeParts = useCallback(async (redistributeData: RedistributePartsRequest): Promise<RedistributePartsResponse> => {
    try {
      // Добавляем machineId из localStorage если он не указан
      if (!redistributeData.machineId) {
        redistributeData.machineId = getMachineId();
      }
      
      // Используем API напрямую
      const { machineApi } = await import('../../api/machineApi/machineApi');
      const response = await machineApi.redistributeParts(redistributeData);
      
      // Обновляем данные о всех поддонах после перераспределения
      if (currentDetailId) {
        await fetchPallets(currentDetailId);
      }
      
      return response;
    } catch (err) {
      console.error(`Ошибка при перераспределении деталей с поддона ${redistributeData.sourcePalletId}:`, err);
      throw err;
    }
  }, [currentDetailId, fetchPallets, getMachineId]);

  // Функция для возврата деталей в производство
  const handleReturnParts = useCallback(async (
    partId: number,
    palletId: number,
    quantity: number,
    returnToStageId: number
  ): Promise<any> => {
    try {
      const response = await returnParts({
        partId,
        palletId,
        quantity,
        returnToStageId
      });
      
      // Обновляем данные о всех поддонах после возврата
      if (currentDetailId) {
        await fetchPallets(currentDetailId);
      }
      
      return response;
    } catch (err) {
      console.error('Ошибка при возврате деталей:', err);
      throw err;
    }
  }, [currentDetailId, fetchPallets]);

  // Функция для загрузки ресурсов выбранного сегмента
  const loadSegmentResources = useCallback(async () => {
    // Не устанавливаем loading здесь, так как это может конфликтовать с загрузкой поддонов
    setError(null);

    try {
      // Загружаем данные о ячейках буфера
      const bufferCellsData = await fetchBufferCellsBySegmentId();
      updateBufferCellsSmartly(bufferCellsData);
      
      // Примечание: в productionPalletsService.ts нет функции fetchMachinesBySegmentId
      // Поэтому оставляем пустой массив для machines
      setMachines([]);
    } catch (err) {
      console.error('Ошибка при загрузке ресурсов сегмента:', err);
      // Не устанавливаем error здесь, так как это вспомогательная операция
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
    isWebSocketConnected,
    webSocketError,
    fetchPallets,
    bufferCells,
    machines,
    loadSegmentResources,
    refreshPalletData,
    refreshPalletsData,
    updateBufferCell: handleUpdateBufferCell,
    startPalletProcessing: handleStartPalletProcessing,
    completePalletProcessing: handleCompletePalletProcessing,
    defectPalletParts: handleDefectPalletParts,
    redistributeParts: handleRedistributeParts,
    returnParts: handleReturnParts
  };
};

export default useProductionPallets;