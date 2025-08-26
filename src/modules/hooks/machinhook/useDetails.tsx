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

  // Функция для умного обновления данных
  const updateMachineDetailsSmartly = useCallback((newMachineDetails: MachineDetails) => {
    setMachineDetails(currentDetails => {
      if (!currentDetails) {
        return newMachineDetails;
      }

      const detailsChanged = JSON.stringify(currentDetails) !== JSON.stringify(newMachineDetails);
      return detailsChanged ? newMachineDetails : currentDetails;
    });
  }, []);

  // Функция для загрузки данных о задачах и деталях
  const fetchDetails = useCallback(async (): Promise<void> => {
    try {
      setLoading('loading');
      setError(null);

      const data = await getSmenOrders();
      updateMachineDetailsSmartly(data);
      setLoading('success');
    } catch (err) {
      setLoading('error');
      setError(err instanceof Error ? err : new Error('Неизвестная ошибка при загрузке деталей'));
      console.error('Ошибка при загрузке данных о деталях:', err);
    }
  }, [updateMachineDetailsSmartly]);

  // Функция для обновления данных деталей
  const refreshDetailsData = useCallback(async (status: string) => {
    try {
      // Обрабатываем события обновления, добавления и удаления
      if (status !== 'updated' && status !== 'added' && status !== 'created' && status !== 'deleted' && status !== 'removed') {
        console.warn('Игнорируем неожиданный status from socket:', status);
        return;
      }

      if (refreshTimeoutRef.current) {
        window.clearTimeout(refreshTimeoutRef.current);
      }

      refreshTimeoutRef.current = window.setTimeout(async () => {
        try {
          const data = await getSmenOrders();
          setMachineDetails(data); // Принудительное обновление при WebSocket событиях
          console.log(`Данные деталей обновлены (debounced) для status: ${status}`);
        } catch (err) {
          console.error('Ошибка обновления данных деталей:', err);
        }
      }, REFRESH_DEBOUNCE_MS);
    } catch (err) {
      console.error('Ошибка в refreshDetailsData:', err);
    }
  }, []);

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