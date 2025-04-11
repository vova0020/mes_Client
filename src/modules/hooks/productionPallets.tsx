import { useState, useEffect, useCallback } from 'react';
import { 
  ProductionPallet, 
  fetchProductionPalletsByDetailId,
  updatePalletMachine,
  updatePalletBufferCell
} from '../api/productionPalletsService';

// Определение интерфейса результата хука
interface UseProductionPalletsResult {
  pallets: ProductionPallet[];
  loading: boolean;
  error: Error | null;
  fetchPallets: (detailId: number | null) => Promise<void>;
  updateMachine: (palletId: number, machine: string) => Promise<void>;
  updateBufferCell: (palletId: number, bufferCellId: number) => Promise<void>;
}

// Пользовательский хук для управления данными о производственных поддонах
const useProductionPallets = (initialDetailId: number | null = null): UseProductionPalletsResult => {
  const [pallets, setPallets] = useState<ProductionPallet[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [currentDetailId, setCurrentDetailId] = useState<number | null>(initialDetailId);
  
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
      setPallets(fetchedPallets);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Произошла неизвестная ошибка'));
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Функция для обновления станка для поддона
  const updateMachine = useCallback(async (palletId: number, machineName: string) => {
    try {
      await updatePalletMachine(palletId, machineName);
      
      // Обновляем локальное состояние после успешного обновления на сервере
      setPallets(prevPallets => 
        prevPallets.map(pallet => {
          if (pallet.id === palletId) {
            // Пока что используем заглушку для данных о станке
            return { 
              ...pallet, 
              machine: { 
                id: 0, // Временное значение
                name: machineName, 
                status: 'ACTIVE' 
              } 
            };
          }
          return pallet;
        })
      );
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Ошибка при обновлении станка'));
      throw err;
    }
  }, []);
  
  // Функция для обновления ячейки буфера для поддона
  const updateBufferCell = useCallback(async (palletId: number, bufferCellId: number) => {
    try {
      await updatePalletBufferCell(palletId, bufferCellId);
      
      // Обновляем локальное состояние после успешного обновления на сервере
      setPallets(prevPallets => 
        prevPallets.map(pallet => {
          if (pallet.id === palletId) {
            // Пока что используем заглушку для данных о ячейке буфера
            return { 
              ...pallet, 
              bufferCell: { 
                id: bufferCellId, 
                code: `Cell-${bufferCellId}`, 
                bufferId: 1, 
                bufferName: "Основной буфер"
              } 
            };
          }
          return pallet;
        })
      );
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Ошибка при обновлении ячейки буфера'));
      throw err;
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
    updateBufferCell
  };
};

export default useProductionPallets;