import { useState, useCallback, useEffect } from 'react';
import { 
  YpakMachineDetails, 
  YpakTask,
  getMachineTask,
  sendToMonitors,
  startOperation,
  completeOperation,
  partiallyCompleteOperation,
  getPackingScheme
} from '../../api/ypakMachine/ypakMachineApi';

// Тип для состояния загрузки
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

// Интерфейс для результатов хука
interface UseYpakMachineResult {
  machineDetails: YpakMachineDetails | null;
  tasks: YpakTask[];
  loading: LoadingState;
  error: Error | null;
  refetch: () => Promise<void>;
  sendToMonitors: (operationId: number) => Promise<void>;
  startOperation: (operationId: number) => Promise<void>;
  completeOperation: (operationId: number) => Promise<void>;
  partiallyCompleteOperation: (operationId: number, packagedCount: number) => Promise<void>;
  getPackingScheme: (ypakId: number) => Promise<string>;
}

/**
 * Hook для работы с API станка упаковки
 * @returns Объект с данными и методам�� для работы со станком упаковки
 */
export const useYpakMachine = (): UseYpakMachineResult => {
  const [machineDetails, setMachineDetails] = useState<YpakMachineDetails | null>(null);
  const [loading, setLoading] = useState<LoadingState>('idle');
  const [error, setError] = useState<Error | null>(null);

  // Функция для загрузки данных о задачах станка упаковки
  const fetchMachineDetails = useCallback(async (): Promise<void> => {
    try {
      setLoading('loading');
      setError(null);

      const data = await getMachineTask();
      setMachineDetails(data);
      setLoading('success');
    } catch (err) {
      setLoading('error');
      setError(err instanceof Error ? err : new Error('Неизвестная ошибка при загрузке данных'));
      console.error('Ошибка при загрузке данных о станке упаковки:', err);
    }
  }, []);

  // Загрузка данных при первом рендере
  useEffect(() => {
    fetchMachineDetails();
    
    // Настраиваем периодическое обновление данных каждые 30 секунд
    const intervalId = setInterval(() => {
      fetchMachineDetails();
    }, 30000);
    
    return () => {
      clearInterval(intervalId);
    };
  }, [fetchMachineDetails]);

  // Функция для отправки задачи на мониторы
  const handleSendToMonitors = useCallback(async (operationId: number): Promise<void> => {
    try {
      await sendToMonitors(operationId);
      // Обновляем данные после успешного запроса
      await fetchMachineDetails();
    } catch (error) {
      console.error('Ошибка при отправке задачи на мониторы:', error);
      throw error;
    }
  }, [fetchMachineDetails]);

  // Функция для перевода задачи в работу
  const handleStartOperation = useCallback(async (operationId: number): Promise<void> => {
    try {
      await startOperation(operationId);
      // Обновляем данные после успешного запроса
      await fetchMachineDetails();
    } catch (error) {
      console.error('Ошибка при переводе задачи в работу:', error);
      throw error;
    }
  }, [fetchMachineDetails]);

  // Функция для завершения задачи
  const handleCompleteOperation = useCallback(async (operationId: number): Promise<void> => {
    try {
      await completeOperation(operationId);
      // Обновляем данные после успешного запроса
      await fetchMachineDetails();
    } catch (error) {
      console.error('Ошибка при завершении задачи:', error);
      throw error;
    }
  }, [fetchMachineDetails]);

  // Функция для частичного завершения задачи
  const handlePartiallyCompleteOperation = useCallback(async (operationId: number, packagedCount: number): Promise<void> => {
    try {
      await partiallyCompleteOperation(operationId, packagedCount);
      // Обновляем данные после успешного запроса
      await fetchMachineDetails();
    } catch (error) {
      console.error('Ошибка при частичном завершении задачи:', error);
      throw error;
    }
  }, [fetchMachineDetails]);

  // Функция для получения схемы укладки
  const handleGetPackingScheme = useCallback(async (ypakId: number): Promise<string> => {
    try {
      const blob = await getPackingScheme(ypakId);
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error('Ошибка при получении схемы укладки:', error);
      throw error;
    }
  }, []);

  // Получение списка всех задач
  const tasks = machineDetails?.tasks || [];

  return {
    machineDetails,
    tasks,
    loading,
    error,
    refetch: fetchMachineDetails,
    sendToMonitors: handleSendToMonitors,
    startOperation: handleStartOperation,
    completeOperation: handleCompleteOperation,
    partiallyCompleteOperation: handlePartiallyCompleteOperation,
    getPackingScheme: handleGetPackingScheme
  };
};

export default useYpakMachine;