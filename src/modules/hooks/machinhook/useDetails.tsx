import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { getSmenOrders } from '../../api/machineApi/detailService';
import { useWebSocketRoom } from '../../../hooks/useWebSocketRoom';

// Типы для данных, которые возвращает API
export interface Detail {
  id: number;
  article: string;
  name: string;
  material: string;
  size: string;
  totalNumber: number;
}

export interface Order {
  id: number;
  runNumber: string;
  name: string;
  progress: number;
}

export interface Task {
  operationId: number;
  processStepId: number;
  processStepName: string;
  priority: number;
  quantity: number;
  detail: Detail;
  order: Order;
  readyForProcessing: number;
  completed: number;
}

export interface MachineDetails {
  machineId: number;
  machineName: string;
  tasks: Task[];
}

// Типы состояний загрузки
export type LoadingState = 'loading' | 'success' | 'error';

// Тип для результата хука
interface UseDetailsResult {
  machineDetails: MachineDetails | null;
  loading: LoadingState;
  error: Error | null;
  isWebSocketConnected: boolean;
  webSocketError: string | null;
  refetch: () => Promise<void>;
  refreshDetailsData: (status: string) => Promise<void>;
  tasks: Task[];
  getTasksByOrderId: (orderId: number | null) => Task[];
  getUniqueOrders: () => Order[];
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

/**
 * Хук для работы с данными о деталях и задачах станка
 * @returns Объект с данными о задачах и деталях
 */
export const useDetails = (): UseDetailsResult => {
  const [machineDetails, setMachineDetails] = useState<MachineDetails | null>(null);
  const [loading, setLoading] = useState<LoadingState>('loading');
  const [error, setError] = useState<Error | null>(null);
  
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



  // Функция для загрузки данных о задачах и деталях
  const fetchDetails = useCallback(async (): Promise<void> => {
    try {
      setLoading('loading');
      setError(null);

      const data = await getSmenOrders();
      setMachineDetails(data);
      setLoading('success');
    } catch (err) {
      setLoading('error');
      setError(err instanceof Error ? err : new Error('Неизвестная ошибка при загрузке деталей'));
      console.error('Ошибка при загрузке данных о деталях:', err);
    }
  }, []);

  // Функция для обновления данных деталей
  const refreshDetailsData = useCallback(async (status: string) => {
    try {
      const validStatuses = ['updated', 'added', 'created', 'deleted', 'removed', 'connected'];
      if (!validStatuses.includes(status)) {
        console.warn('[useDetails] ignoring unexpected status:', status);
        return;
      }

      if (refreshTimeoutRef.current) {
        window.clearTimeout(refreshTimeoutRef.current);
      }

      refreshTimeoutRef.current = window.setTimeout(async () => {
        try {
          console.log('[useDetails] fetching data for status:', status);
          const data = await getSmenOrders();
          
          // Обрабатываем пустые данные корректно
          if (data && typeof data === 'object') {
            setMachineDetails(data);
            console.log('[useDetails] data updated, tasks count:', data.tasks?.length || 0);
          } else {
            console.warn('[useDetails] received invalid data:', data);
          }
        } catch (err) {
          console.error('[useDetails] error updating data:', err);
        }
      }, REFRESH_DEBOUNCE_MS);
    } catch (err) {
      console.error('[useDetails] error in refreshDetailsData:', err);
    }
  }, []);

  // Настройка WebSocket обработчиков событий
useEffect(() => {
  const s = socket;
  if (!s) {
    console.log('[useDetails] socket отсутствует — обработчики не ставим');
    return;
  }

  console.log('[useDetails] Настройка WebSocket handlers. room=', room, ' socket.id=', (s as any).id);

  const handleDetailEvent = async (data: { status: string }) => {
    try {
      console.log('[useDetails] got detail:event', data);
      await refreshDetailsData(data.status);
    } catch (err) {
      console.error('[useDetails] handleDetailEvent error', err);
    }
  };

  // debug: логировать абсолютно все входящие события для этого socket
  const onAny = (...args: any[]) => {
    // Первый аргумент в onAny — имя события. В некоторых версиях socket.io это (event, ...args)
    console.log('[useDetails] onAny event:', ...args);
  };

  const attachHandlers = () => {
    try {
      s.off('detail:event', handleDetailEvent); // защита от дублей
      s.on('detail:event', handleDetailEvent);
      // подписка на onAny для отладки:
      // @ts-ignore
      if (typeof s.onAny === 'function') s.onAny(onAny);
      console.log('[useDetails] handlers attached for detail:event');
    } catch (err) {
      console.error('[useDetails] attachHandlers error', err);
    }
  };

  const onConnect = () => {
    console.log('[useDetails] socket reconnected, re-attaching handlers for room:', room);
    attachHandlers();
    // Обновляем данные при переподключении
    refreshDetailsData('connected').catch(e => console.warn('[useDetails] refresh on reconnect failed:', e));
  };

  s.on('connect', onConnect);

  // если уже подключён, сразу прикрепляем
  if ((s as any).connected) {
    attachHandlers();
  }

  return () => {
    try {
      s.off('connect', onConnect);
      s.off('detail:event', handleDetailEvent);
      // @ts-ignore
      if (typeof s.offAny === 'function') s.offAny(onAny);
      if (refreshTimeoutRef.current) {
        window.clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
      }
      console.log('[useDetails] cleanup socket handlers for room=', room);
    } catch (err) {
      console.error('[useDetails] cleanup error', err);
    }
  };
}, [socket, room, refreshDetailsData]);



  // Загрузка данных при первом рендере
  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);



  // Получение списка всех задач
  const tasks = machineDetails?.tasks || [];

  // Функция для фильтрации задач по ID заказа
  const getTasksByOrderId = useCallback((orderId: number | null): Task[] => {
    if (!orderId) return tasks;
    return tasks.filter(task => task.order.id === orderId);
  }, [tasks]);

  // Функция для получения уникальных заказов
  const getUniqueOrders = useCallback((): Order[] => {
    if (!tasks.length) return [];

    const uniqueOrderIds = new Set<number>();
    const uniqueOrders: Order[] = [];

    tasks.forEach(task => {
      if (!uniqueOrderIds.has(task.order.id)) {
        uniqueOrderIds.add(task.order.id);
        uniqueOrders.push(task.order);
      }
    });

    return uniqueOrders;
  }, [tasks]);

  return {
    machineDetails,
    loading,
    error,
    isWebSocketConnected,
    webSocketError,
    refetch: fetchDetails,
    refreshDetailsData,
    tasks,
    getTasksByOrderId,
    getUniqueOrders
  };
};