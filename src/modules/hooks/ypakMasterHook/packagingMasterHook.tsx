import { useState, useCallback, useEffect } from 'react';
import { 
  fetchPackagingByOrderId, 
  fetchPackagingWorkers,
  assignPackagingWorker,
  updateAllowPackingOutsideLine,
  updatePackagingStatus,
  PackagingDataDto,
  PackagingWorkerDto
} from '../../api/ypakMasterApi/packagingMasterApi';

interface UsePackagingDetailsResult {
  packagingItems: PackagingDataDto[];
  workers: PackagingWorkerDto[];
  loading: boolean;
  error: Error | null;
  fetchPackagingItems: (orderId: number | null) => Promise<void>;
  assignWorker: (packagingId: number, workerId: number) => Promise<void>;
  toggleAllowOutsidePacking: (packagingId: number, allow: boolean) => Promise<void>;
  updateStatus: (packagingId: number, status: 'in_progress' | 'completed' | 'partially_completed') => Promise<void>;
}

const usePackagingDetails = (initialOrderId: number | null = null): UsePackagingDetailsResult => {
  const [packagingItems, setPackagingItems] = useState<PackagingDataDto[]>([]);
  const [workers, setWorkers] = useState<PackagingWorkerDto[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  
  // Функция для получения данных об упаковках
  const fetchPackagingItems = useCallback(async (orderId: number | null) => {
    if (orderId === null) {
      setPackagingItems([]);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const fetchedItems = await fetchPackagingByOrderId(orderId);
      setPackagingItems(fetchedItems);
      
      // Загружаем список сотрудников, если ещё не загружен
      // if (workers.length === 0) {
      //   const fetchedWorkers = await fetchPackagingWorkers();
      //   setWorkers(fetchedWorkers);
      // }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Произошла неизвестная ошибка'));
    } finally {
      setLoading(false); 
    }
  }, [workers.length]);
  
  // Функция для назначения упаковщика
  const assignWorker = useCallback(async (packagingId: number, workerId: number) => {
    try {
      await assignPackagingWorker(packagingId, workerId);
      
      // Обновляем локальное состояние после успешного назначения
      setPackagingItems(prevItems => 
        prevItems.map(item => 
          item.id === packagingId 
            ? { 
                ...item, 
                assignedPackager: workers.find(w => w.id === workerId)?.name 
              } 
            : item
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Ошибка при назначении упаковщика'));
      throw err;
    }
  }, [workers]);
  
  // Функция для обновления разрешения упаковки вне линии
  const toggleAllowOutsidePacking = useCallback(async (packagingId: number, allow: boolean) => {
    try {
      await updateAllowPackingOutsideLine(packagingId, allow);
      
      // Обновляем локальное состояние после успешного обновления
      setPackagingItems(prevItems => 
        prevItems.map(item => 
          item.id === packagingId 
            ? { ...item, allowPackingOutsideLine: allow } 
            : item
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Ошибка при обновлении разрешения упаковки вне линии'));
      throw err;
    }
  }, []);
  
  // Функция ��ля обновления статуса упаковки
  const updateStatus = useCallback(async (packagingId: number, status: 'in_progress' | 'completed' | 'partially_completed') => {
    try {
      await updatePackagingStatus(packagingId, status);
      
      // Обновляем локальное состояние после успешного обновления статуса
      // В реальном случае, лучше перезагрузить данные с сервера для получения актуальных значений
      // Но для демонстрации просто увеличим счетчики
      setPackagingItems(prevItems => 
        prevItems.map(item => {
          if (item.id === packagingId) {
            let newItem = { ...item };
            
            switch (status) {
              case 'in_progress':
                newItem.allocated = Math.min(item.readyForPackaging, item.allocated + 1);
                break;
              case 'completed':
                newItem.packed = Math.min(item.readyForPackaging, item.packed + 1);
                break;
              case 'partially_completed':
                newItem.assembled = Math.min(item.readyForPackaging, item.assembled + 1);
                break;
            }
            
            return newItem;
          }
          return item;
        })
      );
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Ошибка при обновлении статуса упаковки'));
      throw err;
    }
  }, []);
  
  // Инициализация с начальным ID заказа, если он предоставлен
  useEffect(() => {
    if (initialOrderId !== null) {
      fetchPackagingItems(initialOrderId);
    }
  }, [initialOrderId, fetchPackagingItems]);
  
  return {
    packagingItems,
    workers,
    loading,
    error,
    fetchPackagingItems,
    assignWorker,
    toggleAllowOutsidePacking,
    updateStatus
  };
};

export default usePackagingDetails;