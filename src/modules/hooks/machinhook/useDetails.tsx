
import { useState, useEffect, useCallback } from 'react';
import { getSmenOrders } from '../../api/machineApi/detailService';

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
  refetch: () => Promise<void>;
  tasks: Task[];
  getTasksByOrderId: (orderId: number | null) => Task[];
  getUniqueOrders: () => Order[];
}

/**
 * Хук для работы с данными о деталях и задачах станка
 * @returns Объект с данными о задачах и деталях
 */
export const useDetails = (): UseDetailsResult => {
  const [machineDetails, setMachineDetails] = useState<MachineDetails | null>(null);
  const [loading, setLoading] = useState<LoadingState>('loading');
  const [error, setError] = useState<Error | null>(null);

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
    refetch: fetchDetails,
    tasks,
    getTasksByOrderId,
    getUniqueOrders
  };
};
