import { useState, useEffect, useCallback } from 'react';
import { 
  ProductionPallet, 
  fetchAvailablePallets,
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
  TakeToWorkResponseDto
} from '../../api/machinNoSmenApi/productionPalletsService';

// Определение интерфейса результата хука
interface UseProductionPalletsResult {
  pallets: ProductionPallet[];
  loading: boolean;
  error: Error | null;
  bufferCells: BufferCellDto[];
  machines: MachineDto[];
  fetchPallets: (detailId: number | null) => Promise<void>;
  fetchAvailablePallets: (detailId: number) => Promise<void>;
  loadSegmentResources: () => Promise<void>;
  refreshPalletData: (palletId: number) => Promise<void>;
  updateBufferCell: (palletId: number, bufferCellId: number) => Promise<void>;
  startPalletProcessing: (palletId: number) => Promise<void>;
  completePalletProcessing: (palletId: number) => Promise<CompleteProcessingResponseDto>;
  takeToWork: (palletId: number) => Promise<TakeToWorkResponseDto>;
  completeProcessing: (palletId: number) => Promise<CompleteProcessingResponseDto>;
  moveToBuffer: (palletId: number, bufferCellId: number) => Promise<{ message: string; pallet: any }>;
}

// Пользовательский хук для управления данными о производственных поддонах
const useProductionPallets = (initialDetailId: number | null = null): UseProductionPalletsResult => {
  const [pallets, setPallets] = useState<ProductionPallet[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [currentDetailId, setCurrentDetailId] = useState<number | null>(initialDetailId);
  // Состояние для ячеек буфера и станков
  const [bufferCells, setBufferCells] = useState<BufferCellDto[]>([]);
  const [machines, setMachines] = useState<MachineDto[]>([]);
  
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
      
      // Отладочная информация
      // console.log('Полученные данные о поддонах:', fetchedPallets);
      
      if (fetchedPallets.length > 0) {
        // Проверяем, есть ли у первого поддона данные об операции
        const hasExistingOperations = fetchedPallets.some(p => p.currentOperation);
        
        if (hasExistingOperations) {
          // console.log('Поддоны уже содержат данные об операциях');
          
          // Убедимся, что currentOperation определен (не undefined)
          const normalizedPallets = fetchedPallets.map(pallet => ({
            ...pallet,
            // Если currentOperation === undefined, то преобразуем его в null для единообразия
            currentOperation: pallet.currentOperation === undefined ? null : pallet.currentOperation
          }));
          
          setPallets(normalizedPallets);
        } else {
          // console.log('Требуется дополнительный запрос для получения операций');
          
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
          
          setPallets(palletsWithOperations);
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
  }, []);

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

  // Функция для получения доступных поддонов (новая ф��нкция)
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
      
      setPallets(normalizedPallets);
    } catch (err) {
      console.error('Ошибка при получении доступных поддонов:', err);
      setError(err instanceof Error ? err : new Error('Произошла неизвестная ошибка'));
    } finally {
      setLoading(false);
    }
  }, []);

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

  // Функция для загрузки ресурсов выбранного сегмента
  const loadSegmentResources = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Загружаем данные о ячейках буфера
      const bufferCellsData = await fetchBufferCellsBySegmentId();
      // console.log('Получены данные о ячейках буфера:', bufferCellsData);
      setBufferCells(bufferCellsData);
      
      // Примечание: в productionPalletsService.ts нет функции fetchMachinBySegmentId
      // Поэтому оставляем пустой массив для machines
      setMachines([]);
    } catch (err) {
      console.error('Ошибка при загрузке ресурсов сегмента:', err);
      setError(err instanceof Error ? err : new Error('Неизвестная ошибка при загрузке ресурсов'));
    } finally {
      setLoading(false);
    }
  }, []);
  
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
    fetchPallets,
    fetchAvailablePallets: handleFetchAvailablePallets,
    bufferCells,
    machines,
    loadSegmentResources,
    refreshPalletData,
    updateBufferCell: handleUpdateBufferCell,
    startPalletProcessing: handleStartPalletProcessing,
    completePalletProcessing: handleCompletePalletProcessing,
    takeToWork: handleTakeToWork,
    completeProcessing: handleCompleteProcessing,
    moveToBuffer: handleMoveToBuffer
  };
};

export default useProductionPallets;