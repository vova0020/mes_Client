
import { useState, useCallback, useEffect } from 'react';
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
      // Получаем данные о поддонах - новая структура API уже содержит всю необходимую информацию
      const fetchedPallets = await fetchProductionPalletsByDetailId(detailId);
      
      // Отладочная информация
      // console.log('Полученные данные о поддонах:', fetchedPallets);
      
      // Устанавливаем полученные данные напрямую
      // Новая структура API уже содержит currentStageProgress и другие необходимые поля
      setPallets(fetchedPallets || []);
      
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
      
      // Перезагружаем все данные о поддонах для обеспечения актуальности
      // Это проще и надежнее, чем обновлять отдельный поддон
      await fetchPallets(currentDetailId);
      
    } catch (err) {
      console.error(`Ошибка обновления данных поддона ${palletId}:`, err);
    }
  }, [currentDetailId, fetchPallets]);

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
      // console.log(`Ответ API при завершении обработки поддона ${palletId}:`, response);
      
      // Обновляем данные о всех поддонах для обеспечения актуальности
      await refreshPalletData(palletId);
      
      return response;
    } catch (err) {
      console.error(`Ошибка при переводе поддона ${palletId} в статус "Готово":`, err);
      throw err;
    }
  }, [refreshPalletData]);

  // Функция для загрузки ресурсов выбранного сегмента
  const loadSegmentResources = useCallback(async () => {
    // Не устанавливаем loading здесь, так как это может конфликтовать с загрузкой поддонов
    setError(null);

    try {
      // Загружаем данные о ячейках буфера
      const bufferCellsData = await fetchBufferCellsBySegmentId();
      // console.log('Получены данные о ячейках буфера:', bufferCellsData);
      setBufferCells(bufferCellsData);
      
      // Примечание: в productionPalletsService.ts нет функции fetchMachinesBySegmentId
      // Поэтому оставляем пустой массив для machines
      setMachines([]);
    } catch (err) {
      console.error('Ошибка при загрузке ресурсов сегмента:', err);
      // Не устанавливаем error здесь, так как это вспомогательная операция
      // setError(err instanceof Error ? err : new Error('Неизвестная ошибка при загрузке ресурсов'));
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
