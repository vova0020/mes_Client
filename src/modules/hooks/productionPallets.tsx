import { useState, useEffect, useCallback } from 'react';
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
  getCurrentOperation
} from '../api/productionPalletsService';

// Определение интерфейса результата хука
interface UseProductionPalletsResult {
  pallets: ProductionPallet[];
  loading: boolean;
  error: Error | null;
  bufferCells: BufferCellDto[];
  machines: MachineDto[];
  fetchPallets: (detailId: number | null) => Promise<void>;
  updateMachine: (palletId: number, machine: string, processStepId?: number) => Promise<void>;
  updateBufferCell: (palletId: number, bufferCellId: number) => Promise<void>;
  loadSegmentResources: () => Promise<void>;
  refreshPalletData: (palletId: number) => Promise<void>;
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
      const fetchedPallets = await fetchProductionPalletsByDetailId(detailId);
      
      // Для каждого поддона получаем текущую операцию
      const palletsWithOperations = await Promise.all(
        fetchedPallets.map(async (pallet) => {
          try {
            const operation = await getCurrentOperation(pallet.id);
            return {
              ...pallet,
              currentOperation: operation || undefined
            };
          } catch (err) {
            console.error(`Ошибка получения операции для поддона ${pallet.id}:`, err);
            return pallet;
          }
        })
      );
      
      setPallets(palletsWithOperations);
    } catch (err) {
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
              currentOperation: operation || undefined
            };
          }
          return pallet;
        })
      );
    } catch (err) {
      console.error(`Ошибка обновления данных поддона ${palletId}:`, err);
    }
  }, [currentDetailId]);
  
  // Функция для обновления станка для поддона
  const updateMachine = useCallback(async (
    palletId: number, 
    machineName: string, 
    processStepId: number = 1
  ) => {
    try {
      // Находим выбранный станок из загруженных данных
      const selectedMachine = machines.find(machine => machine.name === machineName);
      
      if (!selectedMachine) {
        throw new Error(`Станок с именем "${machineName}" не найден`);
      }
      
      // Вызываем обновленную функцию с новым API
      const operation = await updatePalletMachine(palletId, machineName, processStepId);
      
      // Обновляем локальное состояние после успешного обновления на сервере
      setPallets(prevPallets => 
        prevPallets.map(pallet => {
          if (pallet.id === palletId) {
            return { 
              ...pallet, 
              machine: selectedMachine,
              bufferCell: null, // Поддон больше не в буфере
              currentOperation: operation as OperationDto | undefined
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
      // Находим выбранную ячейку буфера из загруженных данных
      const selectedBufferCell = bufferCells.find(cell => cell.id === bufferCellId);
      
      if (!selectedBufferCell) {
        throw new Error(`Ячейка буфера с ID ${bufferCellId} не найдена`);
      }
      
      // Вызываем обновленную функцию с новым API
      const operation = await updatePalletBufferCell(palletId, bufferCellId);
      
      // Обновляем локальное состояние после успешного обновления на сервере
      setPallets(prevPallets => 
        prevPallets.map(pallet => {
          if (pallet.id === palletId) {
            return { 
              ...pallet, 
              bufferCell: selectedBufferCell,
              machine: null, // Поддон больше не на станке
              currentOperation: operation as OperationDto | undefined
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
      // Загружаем данные о ячейках буфера
      const bufferCellsData = await fetchBufferCellsBySegmentId();
      console.log('Получены данные о ячейках буфера:', bufferCellsData);
      setBufferCells(bufferCellsData);
      
      // Загружаем данные о станках
      const machinesData = await fetchMachinBySegmentId();
      console.log('Получены данные о станках:', machinesData);
      // Данные уже должны иметь правильный формат благодаря изменениям в API
      setMachines(machinesData);
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
    updateMachine,
    updateBufferCell,
    bufferCells,
    machines,
    loadSegmentResources,
    refreshPalletData
  };
};

export default useProductionPallets;