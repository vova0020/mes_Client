import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { machineTasksApi, Task, PartDetail } from '../../../api/custom/machine-tasks/machineTasksApi';
import { getLocalMachineIds } from '../../../api/machineApi/machineApi';
import { useWebSocketRoom } from '../../../../hooks/useWebSocketRoom';

export type LoadingState = 'loading' | 'success' | 'error';

interface UseMachineTasksResult {
  tasks: Task[];
  parts: PartDetail[];
  loading: LoadingState;
  error: Error | null;
  selectedPallet: number | null;
  machineId: number | undefined;
  selectedStageId: number | null;
  loadTasks: () => Promise<void>;
  loadParts: (customPalletId: number) => Promise<void>;
  refetch: () => Promise<void>;
  isSocketConnected: boolean;
  isWebSocketConnected: boolean;
  webSocketError: string | null;
}

const ROOM_NAME = 'room:machines';

const getRoomFromStorage = (): string => {
  try {
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      if (user.department) return `room:${user.department}`;
      if (user.role === 'master') return 'room:masterceh';
    }
  } catch (e) {
    // ignore
  }
  return ROOM_NAME;
};

export const useMachineTasks = (machineId?: number, stageId?: number): UseMachineTasksResult => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [parts, setParts] = useState<PartDetail[]>([]);
  const [loading, setLoading] = useState<LoadingState>('loading');
  const [error, setError] = useState<Error | null>(null);
  const [selectedPallet, setSelectedPallet] = useState<number | null>(null);
  const [effectiveMachineId, setEffectiveMachineId] = useState<number | undefined>(machineId);
  const [selectedStageId, setSelectedStageId] = useState<number | null>(stageId || null);
  const [isSocketConnected, setIsSocketConnected] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  const REFRESH_DEBOUNCE_MS = 300;
  const refreshTimeoutRef = useRef<number | null>(null);
  const loadingRef = useRef<boolean>(false);

  const room = useMemo(() => getRoomFromStorage(), []);
  const {
    socket,
    isConnected: isWebSocketConnected,
    error: webSocketError
  } = useWebSocketRoom({ room, autoJoin: true });

  // Получение machineId из localStorage если не передан
  useEffect(() => {
    if (machineId === undefined) {
      const localIds = getLocalMachineIds();
      if (localIds && typeof localIds.machineId === 'number') {
        setEffectiveMachineId(localIds.machineId);
      } else {
        console.warn('ID станка не найден в localStorage и не передан в параметрах');
      }
    } else {
      setEffectiveMachineId(machineId);
    }

    // Получение stageId из localStorage если не передан
    if (stageId === undefined) {
      const savedStageId = localStorage.getItem('selectedMachineStageId');
      if (savedStageId) {
        setSelectedStageId(Number(savedStageId));
      }
    }
  }, [machineId, stageId]);

  // Слушаем изменение этапа
  useEffect(() => {
    const handleStageChange = (event: Event) => {
      const customEvent = event as CustomEvent<number>;
      const newStageId = customEvent.detail;
      console.log('Этап изменен в useMachineTasks:', newStageId);
      
      if (selectedStageId !== newStageId) {
        setSelectedStageId(newStageId);
        setIsInitialized(false); // Сбрасываем флаг для перезагрузки
      }
    };

    window.addEventListener('machineStageChanged', handleStageChange);
    return () => window.removeEventListener('machineStageChanged', handleStageChange);
  }, [selectedStageId]);

  const loadTasks = useCallback(async (): Promise<void> => {
    if (!effectiveMachineId || !selectedStageId || loadingRef.current) return;
    
    try {
      loadingRef.current = true;
      setLoading('loading');
      setError(null);
      const data = await machineTasksApi.getTasks(effectiveMachineId, selectedStageId);
      setTasks(data);
      setLoading('success');
      console.log(`[useMachineTasks] Loaded ${data.length} tasks for machine ${effectiveMachineId}, stage ${selectedStageId}`);
    } catch (err) {
      setLoading('error');
      setError(err instanceof Error ? err : new Error('Неизвестная ошибка'));
      console.error('Ошибка при загрузке заданий станка:', err);
    } finally {
      loadingRef.current = false;
    }
  }, [effectiveMachineId, selectedStageId]);

  const loadParts = useCallback(async (customPalletId: number): Promise<void> => {
    if (!selectedStageId || loadingRef.current) return;
    
    try {
      loadingRef.current = true;
      setLoading('loading');
      setError(null);
      setSelectedPallet(customPalletId);
      const data = await machineTasksApi.getPartDetails(customPalletId, selectedStageId);
      setParts(data);
      setLoading('success');
      console.log(`[useMachineTasks] Loaded ${data.length} parts for pallet ${customPalletId}`);
    } catch (err) {
      setLoading('error');
      setError(err instanceof Error ? err : new Error('Неизвестная ошибка'));
      console.error('Ошибка при загрузке деталей поддона:', err);
    } finally {
      loadingRef.current = false;
    }
  }, [selectedStageId]);

  // Дебаунсированное обновление данных
  const refreshData = useCallback(async () => {
    try {
      if (!effectiveMachineId || !selectedStageId) return;

      console.log('[useMachineTasks] refreshData');

      if (refreshTimeoutRef.current) {
        window.clearTimeout(refreshTimeoutRef.current);
      }

      refreshTimeoutRef.current = window.setTimeout(async () => {
        try {
          const data = await machineTasksApi.getTasks(effectiveMachineId, selectedStageId);
          setTasks(data);
          
          // Если выбран поддон, также обновляем его детали
          if (selectedPallet) {
            const partsData = await machineTasksApi.getPartDetails(selectedPallet, selectedStageId);
            setParts(partsData);
          }
          
          if (loading === 'loading') setLoading('success');
          console.log('[useMachineTasks] data refreshed');
        } catch (err) {
          console.error('Ошибка обновления данных заданий:', err);
          setLoading('error');
          setError(err instanceof Error ? err : new Error('Ошибка обновления'));
        } finally {
          refreshTimeoutRef.current = null;
        }
      }, REFRESH_DEBOUNCE_MS) as unknown as number;
    } catch (err) {
      console.error('Ошибка в refreshData:', err);
    }
  }, [effectiveMachineId, selectedStageId, selectedPallet, loading]);

  // WebSocket подписка
  useEffect(() => {
    if (!socket || !effectiveMachineId) return;

    const handleTasksUpdate = (payload: any) => {
      console.log('[SOCKET] tasks:update payload:', payload);
      void refreshData();
    };

    const handleMachineUpdate = (payload: any) => {
      console.log('[SOCKET] machine:update payload:', payload);
      void refreshData();
    };

    const connectHandler = () => {
      console.log('[SOCKET] connect - re-joining room:', room);
      setIsSocketConnected(true);
      try {
        socket.emit('join', room, (ack: any) => console.log('[SOCKET] join ack:', ack));
      } catch (e) {}
      // Используем прямой вызов API вместо loadTasks для избежания циклических зависимостей
      if (selectedStageId) {
        machineTasksApi.getTasks(effectiveMachineId, selectedStageId)
          .then(data => {
            setTasks(data);
            setLoading('success');
          })
          .catch(err => {
            console.error('Ошибка при загрузке заданий:', err);
            setLoading('error');
            setError(err instanceof Error ? err : new Error('Ошибка загрузки'));
          });
      }
    };

    const disconnectHandler = (reason: any) => {
      console.log('[SOCKET] disconnect', reason);
      setIsSocketConnected(false);
    };

    socket.on('tasks:update', handleTasksUpdate);
    socket.on('machine:tasks:update', handleTasksUpdate);
    socket.on('machine:update', handleMachineUpdate);
    socket.on('pallet:update', handleTasksUpdate);
    socket.on('connect', connectHandler);
    socket.on('disconnect', disconnectHandler);

    if ((socket as any).connected) {
      connectHandler();
    }

    return () => {
      socket.off('tasks:update', handleTasksUpdate);
      socket.off('machine:tasks:update', handleTasksUpdate);
      socket.off('machine:update', handleMachineUpdate);
      socket.off('pallet:update', handleTasksUpdate);
      socket.off('connect', connectHandler);
      socket.off('disconnect', disconnectHandler);
      if (refreshTimeoutRef.current) {
        window.clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, effectiveMachineId, selectedStageId, room]);

  // Инициальная загрузка
  useEffect(() => {
    if (!effectiveMachineId || !selectedStageId || isInitialized) return;
    setIsInitialized(true);
    void loadTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveMachineId, selectedStageId]);

  return {
    tasks,
    parts,
    loading,
    error,
    selectedPallet,
    machineId: effectiveMachineId,
    selectedStageId,
    loadTasks,
    loadParts,
    refetch: loadTasks,
    isSocketConnected,
    isWebSocketConnected: !!isWebSocketConnected,
    webSocketError: webSocketError ? String(webSocketError) : null,
  };
};