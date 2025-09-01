import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { 
  YpakMachineDetails, 
  YpakTask,
  getMachineTask,
  sendToMonitors,
  startOperation,
  completeOperation,
  partiallyCompleteOperation,
  getPackingScheme,
  assignPalletToPackage,
  AssignPalletToPackageResponse
} from '../../api/ypakMachine/ypakMachineApi';
import { useWebSocketRoom } from '../../../hooks/useWebSocketRoom';

// Получение комнаты из localStorage
const getRoomFromStorage = (): string => {
  return 'room:machinesypack';
};

// Тип для состояния загрузки
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

// Интерфейс для результатов хука
interface UseYpakMachineResult {
  machineDetails: YpakMachineDetails | null;
  tasks: YpakTask[];
  loading: LoadingState;
  error: Error | null;
  isWebSocketConnected: boolean;
  webSocketError: string | null;
  refetch: () => Promise<void>;
  sendToMonitors: (taskId: number) => Promise<void>;
  startOperation: (taskId: number) => Promise<void>;
  completeOperation: (taskId: number) => Promise<void>;
  partiallyCompleteOperation: (taskId: number, packagedCount: number) => Promise<void>;
  getPackingScheme: (packageId: number) => Promise<string>;
  assignPalletToPackage: (palletId: number, packageId: number, quantity: number) => Promise<AssignPalletToPackageResponse>;
}

/**
 * Hook для работы с API станка упаковки
 * @returns Объект с данными и методами для работы со станком упаковки
 */
export const useYpakMachine = (): UseYpakMachineResult => {
  const [machineDetails, setMachineDetails] = useState<YpakMachineDetails | null>(null);
  const [loading, setLoading] = useState<LoadingState>('idle');
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
  }, [fetchMachineDetails]);

  // Функция для отправки задачи на мониторы
  const handleSendToMonitors = useCallback(async (taskId: number): Promise<void> => {
    try {
      await sendToMonitors(taskId);
      // Обновляем данные после успешного запроса
      await fetchMachineDetails();
    } catch (error) {
      console.error('Ошибка при отправке задачи на мониторы:', error);
      throw error;
    }
  }, [fetchMachineDetails]);

  // Функция для перевода задачи в работу
  const handleStartOperation = useCallback(async (taskId: number): Promise<void> => {
    try {
      await startOperation(taskId);
      // Обновляем данные после успешного запроса
      await fetchMachineDetails();
    } catch (error) {
      console.error('Ошибка при переводе задачи в работу:', error);
      throw error;
    }
  }, [fetchMachineDetails]);

  // Функция для завершения задачи
  const handleCompleteOperation = useCallback(async (taskId: number): Promise<void> => {
    try {
      await completeOperation(taskId);
      // Обновляем данные после успешного запроса
      await fetchMachineDetails();
    } catch (error) {
      console.error('Ошибка при завершении задачи:', error);
      throw error;
    }
  }, [fetchMachineDetails]);

  // Функция для частичного завершения задачи
  const handlePartiallyCompleteOperation = useCallback(async (taskId: number, packagedCount: number): Promise<void> => {
    try {
      await partiallyCompleteOperation(taskId, packagedCount);
      // Обновляем данные после успешного запроса
      await fetchMachineDetails();
    } catch (error) {
      console.error('Ошибка при частичном завершении задачи:', error);
      throw error;
    }
  }, [fetchMachineDetails]);

  // Функция для получения схемы укладки
  const handleGetPackingScheme = useCallback(async (packageId: number): Promise<string> => {
    try {
      const blob = await getPackingScheme(packageId);
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error('Ошибка при получении схемы укладки:', error);
      throw error;
    }
  }, []);

  // Функция для назначения поддона на упаковку
  const handleAssignPalletToPackage = useCallback(async (
    palletId: number, 
    packageId: number, 
    quantity: number
  ): Promise<AssignPalletToPackageResponse> => {
    try {
      const result = await assignPalletToPackage(palletId, packageId, quantity);
      // Обновляем данные после успешного запроса
      await fetchMachineDetails();
      return result;
    } catch (error) {
      console.error('Ошибка при назначении поддона на упаковку:', error);
      throw error;
    }
  }, [fetchMachineDetails]);

  // Функция для обновления данных станка
  const refreshMachineData = useCallback(async (status: string) => {
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
          const data = await getMachineTask();
          setMachineDetails(data);
          console.log(`Данные станка упаковки обновлены (debounced).`);
        } catch (err) {
          console.error('Ошибка обновления данных станка:', err);
        }
      }, REFRESH_DEBOUNCE_MS);
    } catch (err) {
      console.error('Ошибка в refreshMachineData:', err);
    }
  }, []);

  // Настройка WebSocket обработчиков событий
  useEffect(() => {
    if (!socket || !isWebSocketConnected) return;

    console.log('Настройка WebSocket обработчиков для станка упаковки в комнате:', room);

    const handleYpakEvent = async (data: { status: string }) => {
      console.log('Получено WebSocket событие для станка упаковки - status:', data.status);
      await refreshMachineData(data.status);
    };

    socket.on('package:event', handleYpakEvent);

    return () => {
      socket.off('package:event', handleYpakEvent);
      if (refreshTimeoutRef.current) {
        window.clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
      }
    };
  }, [socket, isWebSocketConnected, room, refreshMachineData]);

  // Получение списка всех задач
  const tasks = machineDetails?.tasks || [];

  return {
    machineDetails,
    tasks,
    loading,
    error,
    isWebSocketConnected,
    webSocketError,
    refetch: fetchMachineDetails,
    sendToMonitors: handleSendToMonitors,
    startOperation: handleStartOperation,
    completeOperation: handleCompleteOperation,
    partiallyCompleteOperation: handlePartiallyCompleteOperation,
    getPackingScheme: handleGetPackingScheme,
    assignPalletToPackage: handleAssignPalletToPackage
  };
};

export default useYpakMachine;