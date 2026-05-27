import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useWebSocketRoom } from '../../../../hooks/useWebSocketRoom';

export interface CustomMachine {
  id: number;
  name: string;
  status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE' | 'BROKEN';
  load_unit: string;
  noSmenTask: boolean;
  recommendedLoad: number;
  plannedQuantity: number;
  completedQuantity: number;
  productionType: 'SERIAL' | 'CUSTOM' | 'BOTH';
}

interface UseMachinesResult {
  machines: CustomMachine[];
  loading: boolean;
  error: Error | null;
  isWebSocketConnected: boolean;
  webSocketError: string | null;
  refreshMachines: () => Promise<void>;
}

const API_BASE_URL = 'http://localhost:5000';

const getSelectedStageIdFromStorage = (): number | null => {
  try {
    const selectedStageData = localStorage.getItem('selectedStage');
    if (!selectedStageData) {
      console.error('Отсутствуют данные selectedStage в localStorage');
      return null;
    }
    
    const parsedData = JSON.parse(selectedStageData);
    if (!parsedData) {
      console.error('Нет данных selectedStage');
      return null;
    }
    
    return parsedData.id;
  } catch (error) {
    console.error('Ошибка при получении stageId из localStorage:', error);
    return null;
  }
};

const fetchCustomMachinesBySegment = async (): Promise<CustomMachine[]> => {
  const stageId = getSelectedStageIdFromStorage();
  if (stageId === null) {
    throw new Error('Не выбран производственный участок');
  }

  const response = await fetch(`${API_BASE_URL}/custom/master/machines/by-segment?stageId=${stageId}`);
  if (!response.ok) {
    throw new Error('Ошибка при получении данных о станках');
  }
  return response.json();
};

const getRoomFromStorage = (): string => {
  return 'room:masterceh';
};

const useMachinesCustomMaster = (): UseMachinesResult => {
  const [machines, setMachines] = useState<CustomMachine[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const isLoadingRef = useRef<boolean>(false);
  const refreshTimeoutRef = useRef<number | null>(null);
  const REFRESH_DEBOUNCE_MS = 300;
  
  const room = useMemo(() => getRoomFromStorage(), []);
  
  const { 
    socket, 
    isConnected: isWebSocketConnected, 
    error: webSocketError 
  } = useWebSocketRoom({ 
    room,
    autoJoin: true 
  });

  const updateMachinesSmartly = useCallback((newMachines: CustomMachine[]) => {
    setMachines(currentMachines => {
      if (currentMachines.length === 0) {
        return newMachines;
      }

      const currentMachinesMap = new Map(currentMachines.map(m => [m.id, m]));
      const updatedMachines: CustomMachine[] = [];
      let hasChanges = false;

      newMachines.forEach(newMachine => {
        const currentMachine = currentMachinesMap.get(newMachine.id);
        
        if (!currentMachine) {
          updatedMachines.push(newMachine);
          hasChanges = true;
        } else {
          const machineChanged = JSON.stringify(currentMachine) !== JSON.stringify(newMachine);

          if (machineChanged) {
            updatedMachines.push(newMachine);
            hasChanges = true;
          } else {
            updatedMachines.push(currentMachine);
          }
        }
      });

      const newMachineIds = new Set(newMachines.map(m => m.id));
      const removedMachines = currentMachines.filter(m => !newMachineIds.has(m.id));
      if (removedMachines.length > 0) {
        hasChanges = true;
      }

      return hasChanges ? updatedMachines : currentMachines;
    });
  }, []);

  const fetchMachines = useCallback(async () => {
    if (isLoadingRef.current) {
      return;
    }

    isLoadingRef.current = true;
    setLoading(true);
    setError(null);
    
    try {
      const fetchedMachines = await fetchCustomMachinesBySegment();
      updateMachinesSmartly(fetchedMachines);
    } catch (err) {
      console.error('Ошибка при получении данных о станках:', err);
      setError(err instanceof Error ? err : new Error('Неизвестная ошибка при получении данных о станках'));
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  }, [updateMachinesSmartly]);

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
          const fetchedMachines = await fetchCustomMachinesBySegment();
          updateMachinesSmartly(fetchedMachines);
          console.log(`Данные станков обновлены (debounced).`);
        } catch (err) {
          console.error('Ошибка обновления данных станков:', err);
        }
      }, REFRESH_DEBOUNCE_MS);
    } catch (err) {
      console.error('Ошибка в refreshMachinesData:', err);
    }
  }, [updateMachinesSmartly]);

  const refreshMachines = fetchMachines;

  useEffect(() => {
    if (!socket || !isWebSocketConnected) return;

    console.log('Настройка WebSocket обработчиков для станков в комнате:', room);

    const handleMachineEvent = async (data: { status: string }) => {
      console.log('Получено WebSocket событие machine:event - status:', data.status);
      await refreshMachinesData(data.status);
    };

    socket.on('machine:event', handleMachineEvent);

    return () => {
      socket.off('machine:event', handleMachineEvent);

      if (refreshTimeoutRef.current) {
        window.clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
      }
    };
  }, [socket, isWebSocketConnected, room, refreshMachinesData]);

  useEffect(() => {
    fetchMachines();
  }, [fetchMachines]);

  useEffect(() => {
    const handleStageChange = (event: CustomEvent) => {
      const stage = event.detail;
      if (!stage?.finalStage) {
        setTimeout(() => {
          fetchMachines();
        }, 150);
      }
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
    isWebSocketConnected,
    webSocketError,
    refreshMachines
  };
};

export default useMachinesCustomMaster;
