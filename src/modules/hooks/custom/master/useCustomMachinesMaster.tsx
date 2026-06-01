import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { machineAssignmentsApi, AssignmentOrder } from '../../../api/custom/machines/machineAssignmentsApi';
import { useWebSocketRoom } from '../../../../hooks/useWebSocketRoom';

interface UseCustomMachinesResult {
  orders: AssignmentOrder[];
  loading: boolean;
  error: Error | null;
  isWebSocketConnected: boolean;
  webSocketError: string | null;
  fetchAssignments: (machineId: number) => Promise<void>;
  refreshAssignments: () => Promise<void>;
}

const getRoomFromStorage = (): string => {
  return 'room:masterceh';
};

const useCustomMachinesMaster = (machineId: number | null): UseCustomMachinesResult => {
  const [orders, setOrders] = useState<AssignmentOrder[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [currentMachineId, setCurrentMachineId] = useState<number | null>(machineId);

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

  const updateOrdersSmartly = useCallback((newOrders: AssignmentOrder[]) => {
    setOrders(currentOrders => {
      if (currentOrders.length === 0) {
        return newOrders;
      }

      const hasChanges = JSON.stringify(currentOrders) !== JSON.stringify(newOrders);
      return hasChanges ? newOrders : currentOrders;
    });
  }, []);

  const fetchAssignments = useCallback(async (machineId: number) => {
    if (isLoadingRef.current) {
      return;
    }

    isLoadingRef.current = true;
    setLoading(true);
    setError(null);
    setCurrentMachineId(machineId);
    
    try {
      const response = await machineAssignmentsApi.getMachineAssignments(machineId);
      updateOrdersSmartly(response.orders);
    } catch (err) {
      console.error('Ошибка при получении заданий:', err);
      setError(err instanceof Error ? err : new Error('Ошибка при получении заданий'));
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  }, [updateOrdersSmartly]);

  const refreshAssignmentsData = useCallback(async (status: string) => {
    try {
      if (status !== 'updated') {
        console.warn('Игнорируем неожиданный status from socket:', status);
        return;
      }

      if (!currentMachineId) {
        return;
      }

      if (refreshTimeoutRef.current) {
        window.clearTimeout(refreshTimeoutRef.current);
      }

      refreshTimeoutRef.current = window.setTimeout(async () => {
        try {
          const response = await machineAssignmentsApi.getMachineAssignments(currentMachineId);
          updateOrdersSmartly(response.orders);
          console.log(`Задания станка ${currentMachineId} обновлены (debounced).`);
        } catch (err) {
          console.error('Ошибка обновления заданий станков:', err);
        }
      }, REFRESH_DEBOUNCE_MS);
    } catch (err) {
      console.error('Ошибка в refreshAssignmentsData:', err);
    }
  }, [currentMachineId, updateOrdersSmartly]);

  const refreshAssignments = useCallback(async () => {
    if (currentMachineId) {
      await fetchAssignments(currentMachineId);
    }
  }, [currentMachineId, fetchAssignments]);

  useEffect(() => {
    if (!socket || !isWebSocketConnected) return;

    console.log('Настройка WebSocket для сменных заданий индивидуального производства в комнате:', room);

    const handleMachineTaskEvent = async (data: { status: string; machineId?: number }) => {
      console.log('Получено WebSocket событие machine_task:event - status:', data.status, 'machineId:', data.machineId);
      await refreshAssignmentsData(data.status);
    };

    socket.on('machine_task:event', handleMachineTaskEvent);

    return () => {
      socket.off('machine_task:event', handleMachineTaskEvent);

      if (refreshTimeoutRef.current) {
        window.clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
      }
    };
  }, [socket, isWebSocketConnected, room, refreshAssignmentsData]);

  return {
    orders,
    loading,
    error,
    isWebSocketConnected,
    webSocketError,
    fetchAssignments,
    refreshAssignments
  };
};

export default useCustomMachinesMaster;
