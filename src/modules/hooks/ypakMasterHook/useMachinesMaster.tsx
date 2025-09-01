import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { 
  Machine, 
  fetchMachinesBySegment, 
  fetchMachineTasks,
  deleteTask,
  moveTask,
  MachineTask,
  fetchMachinesBySegmentId,
  MachineDto,
  updateTaskPriority,
  updatePackingTaskPriority,
  createPackingAssignment,
  startPackingTask,
  completePackingTask
} from '../../api/ypakMasterApi/machineMasterService';
import { useWebSocketRoom } from '../../../hooks/useWebSocketRoom';

// Получение комнаты из localStorage
const getRoomFromStorage = (): string => {
  return 'room:masterypack';
};

// Определение интерфейса результата хука
interface UseMachinesResult {
  machines: Machine[];
  loading: boolean;
  error: Error | null;
  isWebSocketConnected: boolean;
  webSocketError: string | null;
  fetchMachines: () => Promise<void>;
  refreshMachines: () => Promise<void>;
  refreshMachinesData: (status: string) => Promise<void>;
  
  // Новые функции для работы с заданиями
  machineTasks: MachineTask[];
  tasksLoading: boolean;
  tasksError: Error | null;
  fetchTasks: (machineId: number) => Promise<void>;
  clearTasks: () => void;
  removeTask: (taskId: number) => Promise<boolean>;
  transferTask: (taskId: number, targetMachineId: number) => Promise<boolean>;
  updatePriority: (taskId: number, priority: number) => Promise<boolean>;
  
  // Функции для работы с доступными станками
  availableMachines: MachineDto[];
  availableMachinesLoading: boolean;
  fetchAvailableMachines: () => Promise<void>;
  
  // Функция для создания назначения упаковки на станок
  assignPackageToMachine: (packageId: number, machineId: number) => Promise<{success: boolean, error?: {message: string}}>;
  
  // Функции для управления статусом заданий упаковки
  startPackingWork: (taskId: number, machineId: number) => Promise<boolean>;
  completePackingWork: (taskId: number, machineId: number) => Promise<boolean>;
}

/**
 * Хук для работы с данными о станках и их заданиях
 * @returns Объект с данными о станках, заданиях и методами для работы с ними
 */
const useMachines = (): UseMachinesResult => {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  
  // Состояния для заданий станка
  const [machineTasks, setMachineTasks] = useState<MachineTask[]>([]);
  const [tasksLoading, setTasksLoading] = useState<boolean>(false);
  const [tasksError, setTasksError] = useState<Error | null>(null);
  
  // Состояния для доступных станков
  const [availableMachines, setAvailableMachines] = useState<MachineDto[]>([]);
  const [availableMachinesLoading, setAvailableMachinesLoading] = useState<boolean>(false);
  
  // Текущий станок для отслеживания обновлений
  const [currentMachineId, setCurrentMachineId] = useState<number | null>(null);

  // Ref для предотвращения множественных запросов
  const isLoadingRef = useRef<boolean>(false);
  
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

  // Функция для обновления массива станков (временно без умного сравнения)
  const updateMachinesSmartly = useCallback((newMachines: Machine[]) => {
    console.log('updateMachinesSmartly вызвана с данными:', newMachines);
    console.log('Принудительно обновляем данные станков');
    setMachines(newMachines);
  }, []);

  // Функция для получения данных о станках
  const fetchMachines = useCallback(async () => {
    // Предотвращаем множественные одновременные запросы
    if (isLoadingRef.current) {
      return;
    }

    isLoadingRef.current = true;
    setLoading(true);
    setError(null);
    
    try {
      const fetchedMachines = await fetchMachinesBySegment();
      updateMachinesSmartly(fetchedMachines);
    } catch (err) {
      console.error('Ошибка при получении данных о станках:', err);
      setError(err instanceof Error ? err : new Error('Неизвестная ошибка при получении данных о станках'));
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  }, [updateMachinesSmartly]);
  
  // Функция для обновления данных о станках (алиас для fetchMachines для улучшения читаемости кода)
  const refreshMachines = fetchMachines;

  // Функция для обновления данных станков
  const refreshMachinesData = useCallback(async (status: string) => {
    try {
      if (status !== 'updated') {
        console.warn('Игнорируем неожиданный status from socket:', status);
        return;
      }

      if (refreshTimeoutRef.current) {
        window.clearTimeout(refreshTimeoutRef.current);
      }

      refreshTimeoutRef.current = window.setTimeout(async () => {
        try {
          const data = await fetchMachinesBySegment();
          updateMachinesSmartly(data);
          console.log(`Данные станков обновлены (debounced).`);
        } catch (err) {
          console.error('Ошибка обновления данных станков:', err);
        }
      }, REFRESH_DEBOUNCE_MS);
    } catch (err) {
      console.error('Ошибка в refreshMachinesData:', err);
    }
  }, [updateMachinesSmartly]);

  // Функция для получения заданий для станка
  const fetchTasks = useCallback(async (machineId: number) => {
    setTasksLoading(true);
    setTasksError(null);
    setCurrentMachineId(machineId);
    
    try {
      const tasks = await fetchMachineTasks(machineId);
      setMachineTasks(tasks);
    } catch (err) {
      console.error(`Ошибка при получении заданий для станка ${machineId}:`, err);
      setTasksError(err instanceof Error ? err : new Error(`Ошибка при получении заданий для станка ${machineId}`));
    } finally {
      setTasksLoading(false);
    }
  }, []);
  
  // Функция для очистки списка заданий
  const clearTasks = useCallback(() => {
    setMachineTasks([]);
  }, []);
  
  // Функция для удаления задания
  const removeTask = useCallback(async (taskId: number): Promise<boolean> => {
    try {
      await deleteTask(taskId);
      // Обновляем локальное состояние, удаляя задание из списка
      setMachineTasks(prev => prev.filter(task => task.taskId !== taskId));
      return true;
    } catch (err) {
      console.error(`Ошибка при удалении задания ${taskId}:`, err);
      return false;
    }
  }, []);
  
  // Функция для перемещения задания на другой станок
  const transferTask = useCallback(async (taskId: number, targetMachineId: number): Promise<boolean> => {
    try {
      await moveTask(taskId, targetMachineId);
      // Обновляем локальное состояние, удаляя перемещенное задание из списка текущего станка
      setMachineTasks(prev => prev.filter(task => task.taskId !== taskId));
      return true;
    } catch (err) {
      console.error(`Ошибка при перемещении задания ${taskId} на станок ${targetMachineId}:`, err);
      return false;
    }
  }, []);

  // Функция для обновления приоритета задания упаковки
  const updatePriority = useCallback(async (taskId: number, priority: number): Promise<boolean> => {
    try {
      await updatePackingTaskPriority(taskId, priority);
      // Обновляем локальное состояние - находим задание и обновляем его приоритет
      setMachineTasks(prev => prev.map(task => 
        task.taskId === taskId ? { ...task, priority } : task
      ));
      return true;
    } catch (err) {
      console.error(`Ошибка при обновлении приоритета для задания упаковки ${taskId}:`, err);
      return false;
    }
  }, []);
  
  // Функция для получения списка всех доступных станков для выбора
  const fetchAvailableMachines = useCallback(async () => {
    setAvailableMachinesLoading(true);
    
    try {
      const machines = await fetchMachinesBySegmentId();
      setAvailableMachines(machines);
    } catch (err) {
      console.error('Ошибка при получении списка доступных станков:', err);
    } finally {
      setAvailableMachinesLoading(false);
    }
  }, []);

  // Настройка WebSocket обработчиков событий
  useEffect(() => {
    if (!socket || !isWebSocketConnected) return;

    console.log('Настройка WebSocket обработчиков для станков упаковки в комнате:', room);

    const handleMachineEvent = async (data: { status: string }) => {
      console.log('Получено WebSocket событие machine:event - status:', data.status);
      await refreshMachinesData(data.status);
      
      // Если открыт TaskSidebar для какого-то станка, обновляем его задания
      if (currentMachineId !== null) {
        console.log('Обновляем задания для станка:', currentMachineId);
        await fetchTasks(currentMachineId);
      }
    };

    const handleTaskEvent = async (data: { status: string, machineId?: number }) => {
      console.log('Получено WebSocket событие task:event - status:', data.status, 'machineId:', data.machineId);
      // Если есть конкретный станок в состоянии заданий, обновляем его
      if (machineTasks.length > 0 && data.machineId) {
        await fetchTasks(data.machineId);
      }
    };

    socket.on('machine:event', handleMachineEvent);
    socket.on('task:event', handleTaskEvent);

    return () => {
      socket.off('machine:event', handleMachineEvent);
      socket.off('task:event', handleTaskEvent);
      if (refreshTimeoutRef.current) {
        window.clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
      }
    };
  }, [socket, isWebSocketConnected, room, refreshMachinesData, machineTasks, fetchTasks, currentMachineId]);

  // Функция для назначения упаковки на станок
  const assignPackageToMachine = useCallback(async (packageId: number, machineId: number): Promise<{success: boolean, error?: {message: string}}> => {
    try {
      await createPackingAssignment(packageId, machineId);
      return { success: true };
    } catch (err: any) {
      console.error(`Ошибка при назначении упаковки ${packageId} на станок ${machineId}:`, err);
      return { 
        success: false, 
        error: { 
          message: err?.response?.data?.message || err?.message || 'Не удалось назначить упаковку на станок' 
        } 
      };
    }
  }, []);

  // Функция для запуска работы над заданием упаковки
  const startPackingWork = useCallback(async (taskId: number, machineId: number): Promise<boolean> => {
    try {
      await startPackingTask(taskId, machineId);
      return true;
    } catch (err) {
      console.error(`Ошибка при запуске задания упаковки ${taskId}:`, err);
      return false;
    }
  }, []);

  // Функция для завершения работы над заданием упаковки
  const completePackingWork = useCallback(async (taskId: number, machineId: number): Promise<boolean> => {
    try {
      await completePackingTask(taskId, machineId);
      return true;
    } catch (err) {
      console.error(`Ошибка при завершении задания упаковки ${taskId}:`, err);
      return false;
    }
  }, []);



  // Загрузка данных о станках при первом рендере
  useEffect(() => {
    fetchMachines();
  }, [fetchMachines]);

  // Подписка на изменения выбранного этапа
  useEffect(() => {
    const handleStageChange = (event: CustomEvent) => {
      fetchMachines();
      fetchAvailableMachines();
    };

    window.addEventListener('stageChanged', handleStageChange as EventListener);
    
    return () => {
      window.removeEventListener('stageChanged', handleStageChange as EventListener);
    };
  }, [fetchMachines, fetchAvailableMachines]);
  
  return {
    machines,
    loading,
    error,
    isWebSocketConnected,
    webSocketError,
    fetchMachines,
    refreshMachines,
    refreshMachinesData,
    
    // Данные и функции для работы с заданиями
    machineTasks,
    tasksLoading,
    tasksError,
    fetchTasks,
    clearTasks,
    removeTask,
    transferTask,
    updatePriority,
    
    // Данные и функции для работы с доступными станками
    availableMachines,
    availableMachinesLoading,
    fetchAvailableMachines,
    
    // Функция для назначения упаковки на станок
    assignPackageToMachine,
    
    // Функции для управления статусом заданий упаковки
    startPackingWork,
    completePackingWork
  };
};

export default useMachines;