// src/modules/hooks/useOrders.tsx
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import * as orderService from '../../api/machinNoSmenApi/orderService';
import { Order } from '../../api/machinNoSmenApi/orderService';
import { useWebSocketRoom } from '../../../hooks/useWebSocketRoom';

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
  return 'room:machinesnosmen';
};

const useOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [stageId, setStageId] = useState<number | null>(null);
  
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

  // Функция для обновления массива заказов
  const updateOrdersSmartly = useCallback((newOrders: Order[]) => {
    setOrders(newOrders);
  }, []);

  // Функция загрузки заказов
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await orderService.getAllOrders();
      updateOrdersSmartly(data);
    } catch (err: any) {
      console.error("Ошибка при загрузке заказов:", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [updateOrdersSmartly]);

  // Функция для обновления данных заказов
  const refreshOrdersData = useCallback(async (status: string) => {
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
          const data = await orderService.getAllOrders();
          updateOrdersSmartly(data);
          setLoading(false);
          console.log(`Данные заказов обновлены (debounced).`);
        } catch (err) {
          console.error('Ошибка обновления данных заказов:', err);
          setError(err instanceof Error ? err : new Error('Ошибка обновления заказов'));
          setLoading(false);
        }
      }, REFRESH_DEBOUNCE_MS);
    } catch (err) {
      console.error('Ошибка в refreshOrdersData:', err);
    }
  }, [updateOrdersSmartly]);

  // Настройка WebSocket обработчиков событий
  useEffect(() => {
    if (!socket || !isWebSocketConnected) return;

    console.log('Настройка WebSocket обработчиков для заказов в комнате:', room);

    const handleOrderEvent = async (data: { status: string }) => {
      console.log('Получено WebSocket событие для заказов - status:', data.status);
      await refreshOrdersData(data.status);
    };

    socket.on('order:event', handleOrderEvent);

    return () => {
      socket.off('order:event', handleOrderEvent);
      if (refreshTimeoutRef.current) {
        window.clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
      }
    };
  }, [socket, isWebSocketConnected, room, refreshOrdersData]);

  useEffect(() => {
    const savedStageId = localStorage.getItem('selectedMachineStageId');
    if (savedStageId) {
      setStageId(Number(savedStageId));
    }
  }, []);

  useEffect(() => {
    const handleStageChange = (event: Event) => {
      const customEvent = event as CustomEvent<number>;
      console.log('Этап изменен в useOrders:', customEvent.detail);
      setStageId(customEvent.detail);
    };

    window.addEventListener('machineStageChanged', handleStageChange);
    return () => window.removeEventListener('machineStageChanged', handleStageChange);
  }, []);

  useEffect(() => {
    if (stageId !== null) {
      fetchOrders();
    }
  }, [stageId, fetchOrders]);

  return {
    orders,
    loading,
    error,
    isWebSocketConnected,
    webSocketError,
    fetchOrders,
    refreshOrdersData
  };
};

export default useOrders;