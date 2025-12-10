import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Detail, fetchDetailsByOrderId } from '../../api/machinNoSmenApi/detailService';
import { useWebSocketRoom } from '../../../hooks/useWebSocketRoom';

// Определение интерфейса результата хука
interface UseDetailsResult {
  details: Detail[];
  loading: boolean;
  error: Error | null;
  isWebSocketConnected: boolean;
  webSocketError: string | null;
  fetchDetails: (orderId: number | null) => Promise<void>;
  refreshDetailsData: (status: string) => Promise<void>;
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
  return 'room:machinesnosmen';
};

// Пользовательский хук для управления данными о деталях
const useDetails = (initialOrderId: number | null = null): UseDetailsResult => {
  const [details, setDetails] = useState<Detail[]>([]);
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

  // Функция для умного обновления массива деталей
  const updateDetailsSmartly = useCallback((newDetails: Detail[]) => {
    setDetails(currentDetails => {
      if (currentDetails.length === 0) {
        return newDetails;
      }

      const currentDetailsMap = new Map(currentDetails.map(d => [d.id, d]));
      const updatedDetails: Detail[] = [];
      let hasChanges = false;

      newDetails.forEach(newDetail => {
        const currentDetail = currentDetailsMap.get(newDetail.id);
        
        if (!currentDetail) {
          updatedDetails.push(newDetail);
          hasChanges = true;
        } else {
          const detailChanged = JSON.stringify(currentDetail) !== JSON.stringify(newDetail);

          if (detailChanged) {
            updatedDetails.push(newDetail);
            hasChanges = true;
          } else {
            updatedDetails.push(currentDetail);
          }
        }
      });

      const newDetailIds = new Set(newDetails.map(d => d.id));
      const removedDetails = currentDetails.filter(d => !newDetailIds.has(d.id));
      if (removedDetails.length > 0) {
        hasChanges = true;
      }

      return hasChanges ? updatedDetails : currentDetails;
    });
  }, []);
  
  const [stageId, setStageId] = useState<number | null>(null);

  // Функция для получения деталей для конкретного заказа
  const fetchDetails = useCallback(async (orderId: number | null) => {
    if (orderId === null) {
      setDetails([]);
      setCurrentOrderId(null);
      return;
    }
    
    setLoading(true);
    setError(null);
    setCurrentOrderId(orderId);
    
    try {
      const fetchedDetails = await fetchDetailsByOrderId(orderId);
      updateDetailsSmartly(fetchedDetails);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Произошла неизвестная ошибка'));
    } finally {
      setLoading(false); 
    }
  }, [updateDetailsSmartly]);

  // Функция для обновления данных деталей
  const refreshDetailsData = useCallback(async (status: string) => {
    try {
      if (status !== 'updated') {
        console.warn('Игнорируем неожиданный status from socket:', status);
        return;
      }

      if (currentOrderId === null) return;

      if (refreshTimeoutRef.current) {
        window.clearTimeout(refreshTimeoutRef.current);
      }

      refreshTimeoutRef.current = window.setTimeout(async () => {
        try {
          const fetchedDetails = await fetchDetailsByOrderId(currentOrderId);
          updateDetailsSmartly(fetchedDetails);
          console.log(`Данные деталей обновлены (debounced).`);
        } catch (err) {
          console.error('Ошибка обновления данных деталей:', err);
        }
      }, REFRESH_DEBOUNCE_MS);
    } catch (err) {
      console.error('Ошибка в refreshDetailsData:', err);
    }
  }, [currentOrderId, updateDetailsSmartly]);

  // Настройка WebSocket обработчиков событий
  useEffect(() => {
    if (!socket || !isWebSocketConnected) return;

    console.log('Настройка WebSocket обработчиков для деталей в комнате:', room);

    const handleDetailEvent = async (data: { status: string }) => {
      console.log('Получено WebSocket событие для деталей - status:', data.status);
      await refreshDetailsData(data.status);
    };

    socket.on('detail:event', handleDetailEvent);

    return () => {
      socket.off('detail:event', handleDetailEvent);
      if (refreshTimeoutRef.current) {
        window.clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
      }
    };
  }, [socket, isWebSocketConnected, room, refreshDetailsData]);
  
  useEffect(() => {
    const savedStageId = localStorage.getItem('selectedMachineStageId');
    if (savedStageId) {
      setStageId(Number(savedStageId));
    }
  }, []);

  useEffect(() => {
    const handleStageChange = (event: Event) => {
      const customEvent = event as CustomEvent<number>;
      console.log('Этап изменен в useDetails:', customEvent.detail);
      setStageId(customEvent.detail);
    };

    window.addEventListener('machineStageChanged', handleStageChange);
    return () => window.removeEventListener('machineStageChanged', handleStageChange);
  }, []);

  useEffect(() => {
    if (stageId !== null && currentOrderId !== null) {
      fetchDetails(currentOrderId);
    }
  }, [stageId, currentOrderId, fetchDetails]);

  // Инициализация с начальным ID заказа
  useEffect(() => {
    if (initialOrderId !== null && initialOrderId !== currentOrderId) {
      fetchDetails(initialOrderId);
    }
  }, [initialOrderId, currentOrderId, fetchDetails]);
  
  return {
    details,
    loading,
    error,
    isWebSocketConnected,
    webSocketError,
    fetchDetails,
    refreshDetailsData
  };
};

export default useDetails;