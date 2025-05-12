import { useState, useEffect, useCallback } from 'react';
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
  CompleteProcessingResponseDto
} from '../../api/machineApi/machinProductionPalletsService';

// Определение интерфейса результата хука
interface UseProductionPalletsResult {
  pallets: ProductionPallet[];
  loading: boolean;
  error: Error | null;
  bufferCells: BufferCellDto[];
  machines: MachineDto[];
  fetchPallets: (detailId: number | null) => Promise<void>;
  loadSegmentResources: () => Promise<void>;
  refreshPalletData: (palletId: number) => Promise<void>;
  updateBufferCell: (palletId: number, bufferCellId: number) => Promise<void>;
  startPalletProcessing: (palletId: number) => Promise<void>;
  completePalletProcessing: (palletId: number) => Promise<CompleteProcessingResponseDto>;
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
      const fetchedPallets = await fetchProductionPalletsByDetailId(detailId);
      
      // Отладочная информация
      console.log('Полученные данные о поддонах:', fetchedPallets);
      
      if (fetchedPallets.length > 0) {
        // Проверяем, есть ли у первого поддона данные об операции
        const hasExistingOperations = fetchedPallets.some(p => p.currentOperation);
        
        if (hasExistingOperations) {
          console.log('Поддоны уже содержат данные об операциях');
          
          // Убедимся, что currentOperation определен (не undefined)
          const normalizedPallets = fetchedPallets.map(pallet => ({
            ...pallet,
            // Если currentOperation === undefined, то преобразуем его в null для единообразия
            currentOperation: pallet.currentOperation === undefined ? null : pallet.currentOperation
          }));
          
          setPallets(normalizedPallets);
        } else {
          console.log('Требуется дополнительный запрос для получения операций');
          
          // Если данных об операциях нет, делаем дополнительные запросы
          const palletsWithOperations = await Promise.all(
            fetchedPallets.map(async (pallet) => {
              try {
                const operation = await getCurrentOperation(pallet.id);
                return {
                  ...pallet,
                  currentOperation: operation // null или данные операции
                };
              } catch (err) {
                console.error(`Ошибка при получении операции для поддона ${pallet.id}:`, err);
                return {
                  ...pallet,
                  currentOperation: null
                };
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
      
      // Обновляем состояние поддона в массиве
      setPallets(prevPallets => 
        prevPallets.map(pallet => {
          if (pallet.id === palletId) {
            return { 
              ...pallet, 
              currentOperation: operation // null или данные операции
            };
          }
          return pallet;
        })
      );
    } catch (err) {
      console.error(`Ошибка обновления данных поддона ${palletId}:`, err);
    }
  }, [currentDetailId]);

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
  const handleStartPalletProcessing = useCallback(async (palletId: number) => {
    try {
      // Вызываем API-метод для перевода поддона в статус "В работу"
      await startPalletProcessing(palletId);
      
      // Обновляем данные о поддоне
      await refreshPalletData(palletId);
    } catch (err) {
      console.error(`Ошибка при переводе поддона ${palletId} в статус "В работу":`, err);
      throw err;
    }
  }, [refreshPalletData]);

  // Функция для перевода поддона в статус "Готово"
  const handleCompletePalletProcessing = useCallback(async (palletId: number): Promise<CompleteProcessingResponseDto> => {
    try {
      // Вызываем API-метод для перевода поддона в статус "Готово"
      const response = await completePalletProcessing(palletId);
      
      // Отладочный вывод для проверки структуры ответа
      console.log(`Ответ API при завершении обработки поддона ${palletId}:`, response);
      
      // Обновляем данные о поддоне с учетом новой структуры ответа API
      if (response && response.pallet) {
        // Обновляем информацию о поддоне в списке
        setPallets(prevPallets => 
          prevPallets.map(pallet => {
            if (pallet.id === palletId) {
              // Создаем обновленный поддон на основе ответа API
              const updatedPallet = response.pallet;
              
              // Обновляем информацию о текущей операции
              return { 
                ...pallet, 
                ...updatedPallet,
                currentOperation: response.operation,
                currentStepId: updatedPallet.currentStepId,
                currentStep: updatedPallet.currentStep,
              };
            }
            return pallet;
          })
        );
        
        // Выводим информацию о следующем шаге
        if (response.nextStep) {
          console.log(`Следующий шаг для поддона ${palletId}: ${response.nextStep}`);
        }
      } else {
        // Если в ответе нет полной информации о поддоне, делаем стандартное обновление
        await refreshPalletData(palletId);
      }
      
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
      console.log('Получены данные о ячейках буфера:', bufferCellsData);
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
    bufferCells,
    machines,
    loadSegmentResources,
    refreshPalletData,
    updateBufferCell: handleUpdateBufferCell,
    startPalletProcessing: handleStartPalletProcessing,
    completePalletProcessing: handleCompletePalletProcessing
  };
};

export default useProductionPallets;
