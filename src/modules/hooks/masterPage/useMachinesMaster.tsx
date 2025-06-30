import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Machine, 
  fetchMachinesBySegment, 
  fetchMachineTasks,
  deleteTask,
  moveTask,
  MachineTask,
  fetchMachinesBySegmentId,
  MachineDto,
  updateTaskPriority
} from '../../api/masterPage/machineMasterService';

// Определение интерфейса результата хука
interface UseMachinesResult {
  machines: Machine[];
  loading: boolean;
  error: Error | null;
  fetchMachines: () => Promise<void>;
  refreshMachines: () => Promise<void>;
  
  // Новые функции для работы с заданиями
  machineTasks: MachineTask[];
  tasksLoading: boolean;
  tasksError: Error | null;
  fetchTasks: (machineId: number) => Promise<void>;
  clearTasks: () => void;
  removeTask: (operationId: number) => Promise<boolean>;
  transferTask: (operationId: number, targetMachineId: number) => Promise<boolean>;
  updatePriority: (partId: number, machineId: number, priority: number) => Promise<boolean>;
  
  // Функции для работы с доступными станками
  availableMachines: MachineDto[];
  availableMachinesLoading: boolean;
  fetchAvailableMachines: () => Promise<void>;
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

  // Ref ��ля предотвращения множественных запросов
  const isLoadingRef = useRef<boolean>(false);

  // Функция для получения данных о станках
  const fetchMachines = useCallback(async () => {
    // Предотвращаем множественные одновременные запросы
    if (isLoadingRef.current) {
      // console.log('Запрос машин уже выполняется, пропускаем...');
      return;
    }

    isLoadingRef.current = true;
    setLoading(true);
    setError(null);
    
    try {
      const fetchedMachines = await fetchMachinesBySegment();
      setMachines(fetchedMachines);
    } catch (err) {
      console.error('Ошибка при получении данных о станках:', err);
      setError(err instanceof Error ? err : new Error('Неизвестная ошибка при получении данных о станках'));
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  }, []);
  
  // Функция для обновления данных о станках (алиас для fetchMachines для улучшения читаемости кода)
  const refreshMachines = fetchMachines;

  // ��ункция для получения заданий для станка
  const fetchTasks = useCallback(async (machineId: number) => {
    setTasksLoading(true);
    setTasksError(null);
    
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
  const removeTask = useCallback(async (operationId: number): Promise<boolean> => {
    try {
      await deleteTask(operationId);
      // Обновляем локальное состояние, удаляя задание из списка
      setMachineTasks(prev => prev.filter(task => task.operationId !== operationId));
      return true;
    } catch (err) {
      console.error(`Ошибка при удалении за��ания ${operationId}:`, err);
      return false;
    }
  }, []);
  
  // Функция для перемещения задания на другой станок
  const transferTask = useCallback(async (operationId: number, targetMachineId: number): Promise<boolean> => {
    try {
      await moveTask(operationId, targetMachineId);
      // Обновляем локальное состояние, удаляя перемещенное задание из списка текущего станка
      setMachineTasks(prev => prev.filter(task => task.operationId !== operationId));
      return true;
    } catch (err) {
      console.error(`Ошибка при перемещении задания ${operationId} на станок ${targetMachineId}:`, err);
      return false;
    }
  }, []);

  // Функция для обновления приоритета задания
  const updatePriority = useCallback(async (partId: number, machineId: number, priority: number): Promise<boolean> => {
    try {
      await updateTaskPriority(partId, machineId, priority);
      // Обновляем локальное состояние - находим задание и обновляем его приоритет
      setMachineTasks(prev => prev.map(task => 
        task.operationId === partId ? { ...task, priority } : task
      ));
      return true;
    } catch (err) {
      console.error(`Ошибка при обновлении приоритета для детали ${partId} на станке ${machineId}:`, err);
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

  // Загрузка данных о станках при первом рендере
  useEffect(() => {
    fetchMachines();
  }, [fetchMachines]);

  // Подписка на изменения выбранного этапа
  useEffect(() => {
    const handleStageChange = (event: CustomEvent) => {
      // console.log('Получено событие изменения этапа в useMachines:', event.detail);
      // Добавляем небольшую задержку для предотвращения множественных запросов
      setTimeout(() => {
        fetchMachines(); // Перезагружаем данные о станках при изменении этапа
      }, 150);
    };

    window.addEventListener('stageChanged', handleStageChange as EventListener);
    
    return () => {
      window.removeEventListener('stageChanged', handleStageChange as EventListener);
    };
  }, [fetchMachines]);
  
  return {
    machines,
    loading,
    error,
    fetchMachines,
    refreshMachines,
    
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
    fetchAvailableMachines
  };
};

export default useMachines;