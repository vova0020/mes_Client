import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { 
  fetchPackagingByOrderId, 
  fetchPackagingWorkers,
  assignPackagingWorker,
  updateAllowPackingOutsideLine,
  updatePackagingStatus,
  PackagingDataDto,
  PackagingWorkerDto
} from '../../api/ypakMasterApi/packagingMasterApi';
import { useWebSocketRoom } from '../../../hooks/useWebSocketRoom';

// Получение комнаты из localStorage
const getRoomFromStorage = (): string => {
  return 'room:masterypack';
};

interface UsePackagingDetailsResult {
  packagingItems: PackagingDataDto[];
  workers: PackagingWorkerDto[];
  loading: boolean;
  error: Error | null;
  isWebSocketConnected: boolean;
  webSocketError: string | null;
  fetchPackagingItems: (orderId: number | null) => Promise<void>;
  assignWorker: (packagingId: number, workerId: number) => Promise<void>;
  toggleAllowOutsidePacking: (packagingId: number, allow: boolean) => Promise<void>;
  updateStatus: (packagingId: number, status: 'in_progress' | 'completed' | 'partially_completed') => Promise<void>;
  refreshPackagingData: (status: string) => Promise<void>;
}

const usePackagingDetails = (initialOrderId: number | null = null): UsePackagingDetailsResult => {
  const [packagingItems, setPackagingItems] = useState<PackagingDataDto[]>([]);
  const [workers, setWorkers] = useState<PackagingWorkerDto[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [currentOrderId, setCurrentOrderId] = useState<number | null>(initialOrderId);
  
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
  
  // Функция для умного обновления массива упаковок
  const updatePackagingSmartly = useCallback((newPackaging: PackagingDataDto[]) => {
    setPackagingItems(currentPackaging => {
      if (currentPackaging.length === 0) {
        return newPackaging;
      }

      const currentPackagingMap = new Map(currentPackaging.map(p => [p.id, p]));
      const updatedPackaging: PackagingDataDto[] = [];
      let hasChanges = false;

      newPackaging.forEach(newPack => {
        const currentPack = currentPackagingMap.get(newPack.id);
        
        if (!currentPack) {
          updatedPackaging.push(newPack);
          hasChanges = true;
        } else {
          const packChanged = JSON.stringify(currentPack) !== JSON.stringify(newPack);

          if (packChanged) {
            updatedPackaging.push(newPack);
            hasChanges = true;
          } else {
            updatedPackaging.push(currentPack);
          }
        }
      });

      const newPackIds = new Set(newPackaging.map(p => p.id));
      const removedPacks = currentPackaging.filter(p => !newPackIds.has(p.id));
      if (removedPacks.length > 0) {
        hasChanges = true;
      }

      return hasChanges ? updatedPackaging : currentPackaging;
    });
  }, []);

  // Функция для получения данных об упаковках
  const fetchPackagingItems = useCallback(async (orderId: number | null) => {
    if (orderId === null) {
      setPackagingItems([]);
      setCurrentOrderId(null);
      return;
    }
    
    setLoading(true);
    setError(null);
    setCurrentOrderId(orderId);
    
    try {
      const fetchedItems = await fetchPackagingByOrderId(orderId);
      const sortedData = fetchedItems.sort((a, b) => a.id - b.id);
      updatePackagingSmartly(sortedData);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Произошла неизвестная ошибка'));
    } finally {
      setLoading(false); 
    }
  }, [updatePackagingSmartly]);
  
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
                newItem.distributed = Math.min(item.readyForPackaging, item.distributed + 1);
                break;
              case 'completed':
                newItem.completed = Math.min(item.readyForPackaging, item.completed + 1);
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
  
  // Функция для обновления данных упаковок
  const refreshPackagingData = useCallback(async (status: string) => {
    try {
      console.log('Получен запрос на обновление данных упаковок, status:', status, 'currentOrderId:', currentOrderId);
      
      // Принимаем различные статусы обновления
      if (!['updated', 'refresh', 'change', 'modify'].includes(status)) {
        console.warn('Неизвестный status от socket:', status, '- продолжаем обновление');
      }

      if (currentOrderId === null) {
        console.log('Пропускаем обновление: нет активного заказа');
        return;
      }

      // Очищаем предыдущий таймер
      if (refreshTimeoutRef.current) {
        window.clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
      }

      refreshTimeoutRef.current = window.setTimeout(async () => {
        try {
          console.log('Выполняем обновление данных упаковок для заказа:', currentOrderId);
          const data = await fetchPackagingByOrderId(currentOrderId);
          const sortedData = data.sort((a, b) => a.id - b.id);
          updatePackagingSmartly(sortedData);
          console.log(`Данные упаковок обновлены (debounced), получено ${data.length} элементов`);
        } catch (err) {
          console.error('Ошибка обновления данных упаковок:', err);
          setError(err instanceof Error ? err : new Error('Ошибка обновления данных'));
        } finally {
          refreshTimeoutRef.current = null;
        }
      }, REFRESH_DEBOUNCE_MS);
    } catch (err) {
      console.error('Ошибка в refreshPackagingData:', err);
      setError(err instanceof Error ? err : new Error('Ошибка обработки WebSocket события'));
    }
  }, [currentOrderId, updatePackagingSmartly]);

  // Загрузка работников при инициализации
  useEffect(() => {
    const loadWorkers = async () => {
      try {
        const workersData = await fetchPackagingWorkers();
        setWorkers(workersData);
      } catch (err) {
        console.error('Ошибка загрузки работников:', err);
      }
    };
    
    loadWorkers();
  }, []);

  // Настройка WebSocket обработчиков событий
  useEffect(() => {
    if (!socket || !isWebSocketConnected) {
      console.log('WebSocket не подключен, пропускаем настройку обработчиков');
      return;
    }

    console.log('Настройка WebSocket обработчиков для упаковок в комнате:', room, 'currentOrderId:', currentOrderId);

    const handlePackagingEvent = async (data: { status: string }) => {
      console.log('Получено WebSocket событие для упаковок - status:', data.status, 'currentOrderId:', currentOrderId);
      await refreshPackagingData(data.status);
    };

    // Подписываемся на события упаковок
    socket.on('package:event', handlePackagingEvent);
    
    // Также подписываемся на общие события обновления
    socket.on('packaging:updated', handlePackagingEvent);

    return () => {
      console.log('Отписываемся от WebSocket событий упаковок');
      socket.off('package:event', handlePackagingEvent);
      socket.off('packaging:updated', handlePackagingEvent);
      
      if (refreshTimeoutRef.current) {
        window.clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
      }
    };
  }, [socket, isWebSocketConnected, room, currentOrderId, refreshPackagingData]);

 // Реагируем на любые изменения initialOrderId — если он null, fetchPackagingItems очистит список
useEffect(() => {
  fetchPackagingItems(initialOrderId);
}, [initialOrderId]);

  
  return {
    packagingItems,
    workers,
    loading,
    error,
    isWebSocketConnected,
    webSocketError,
    fetchPackagingItems,
    assignWorker,
    toggleAllowOutsidePacking,
    updateStatus,
    refreshPackagingData
  };
};

export default usePackagingDetails;