// src/modules/hooks/orderManagementHook/index.ts
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { 
  orderManagementApi, 
  Order, 
  OrderDetailsResponse, 
  OrderStatus,
  StatusUpdateResponse 
} from '../../api/orderManagementApi';
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
  return 'room:masterceh';
};

// Хук для получения списка заказов
export const useOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
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

  // Функция для умного обновления массива заказов
  const updateOrdersSmartly = useCallback((newOrders: Order[]) => {
    setOrders(currentOrders => {
      if (currentOrders.length === 0) {
        return newOrders;
      }

      const currentOrdersMap = new Map(currentOrders.map(o => [o.orderId, o]));
      const updatedOrders: Order[] = [];
      let hasChanges = false;

      newOrders.forEach(newOrder => {
        const currentOrder = currentOrdersMap.get(newOrder.orderId);
        
        if (!currentOrder) {
          updatedOrders.push(newOrder);
          hasChanges = true;
        } else {
          const orderChanged = JSON.stringify(currentOrder) !== JSON.stringify(newOrder);

          if (orderChanged) {
            updatedOrders.push(newOrder);
            hasChanges = true;
          } else {
            updatedOrders.push(currentOrder);
          }
        }
      });

      const newOrderIds = new Set(newOrders.map(o => o.orderId));
      const removedOrders = currentOrders.filter(o => !newOrderIds.has(o.orderId));
      if (removedOrders.length > 0) {
        hasChanges = true;
      }

      return hasChanges ? updatedOrders : currentOrders;
    });
  }, []);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await orderManagementApi.getOrders();
      updateOrdersSmartly(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Неизвестная ошибка');
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
          const data = await orderManagementApi.getOrders();
          updateOrdersSmartly(data);
          console.log(`Данные заказов обновлены (debounced).`);
        } catch (err) {
          console.error('Ошибка обновления данных заказов:', err);
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
    fetchOrders();
  }, [fetchOrders]);

  return {
    orders,
    loading,
    error,
    isWebSocketConnected,
    webSocketError,
    refetch: fetchOrders,
    refreshOrdersData,
  };
};

// Хук для получения деталей заказа
export const useOrderDetails = (orderId: number | null) => {
  const [orderDetails, setOrderDetails] = useState<OrderDetailsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
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

  // Функция для умного обновления деталей заказа
  const updateOrderDetailsSmartly = useCallback((newOrderDetails: OrderDetailsResponse) => {
    setOrderDetails(currentDetails => {
      if (!currentDetails) {
        return newOrderDetails;
      }

      const detailsChanged = JSON.stringify(currentDetails) !== JSON.stringify(newOrderDetails);
      return detailsChanged ? newOrderDetails : currentDetails;
    });
  }, []);

  const fetchOrderDetails = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await orderManagementApi.getOrderDetails(id);
      updateOrderDetailsSmartly(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Неизвестная ошибка');
    } finally {
      setLoading(false);
    }
  }, [updateOrderDetailsSmartly]);

  // Функция для обновления данных деталей заказа
  const refreshOrderDetailsData = useCallback(async (status: string) => {
    try {
      if (status !== 'updated' || !orderId) {
        return;
      }

      if (refreshTimeoutRef.current) {
        window.clearTimeout(refreshTimeoutRef.current);
      }

      refreshTimeoutRef.current = window.setTimeout(async () => {
        try {
          const data = await orderManagementApi.getOrderDetails(orderId);
          updateOrderDetailsSmartly(data);
          console.log(`Данные деталей заказа обновлены (debounced).`);
        } catch (err) {
          console.error('Ошибка обновления данных деталей заказа:', err);
        }
      }, REFRESH_DEBOUNCE_MS);
    } catch (err) {
      console.error('Ошибка в refreshOrderDetailsData:', err);
    }
  }, [orderId, updateOrderDetailsSmartly]);

  // Настройка WebSocket обработчиков событий
  useEffect(() => {
    if (!socket || !isWebSocketConnected) return;

    const handleOrderDetailEvent = async (data: { status: string }) => {
      await refreshOrderDetailsData(data.status);
    };

    socket.on('detail:event', handleOrderDetailEvent);

    return () => {
      socket.off('detail:event', handleOrderDetailEvent);
      if (refreshTimeoutRef.current) {
        window.clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
      }
    };
  }, [socket, isWebSocketConnected, refreshOrderDetailsData]);

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails(orderId);
    } else {
      setOrderDetails(null);
    }
  }, [orderId, fetchOrderDetails]);

  return {
    orderDetails,
    loading,
    error,
    isWebSocketConnected,
    webSocketError,
    refetch: orderId ? () => fetchOrderDetails(orderId) : undefined,
    refreshOrderDetailsData,
  };
};

// Хук для изменения статуса заказа
export const useOrderStatusUpdate = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateStatus = useCallback(async (orderId: number, status: OrderStatus): Promise<StatusUpdateResponse | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await orderManagementApi.updateOrderStatus(orderId, status);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Неизвестная ошибка');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const approveForLaunch = useCallback(async (orderId: number): Promise<StatusUpdateResponse | null> => {
    return updateStatus(orderId, 'LAUNCH_PERMITTED');
  }, [updateStatus]);

  const startProduction = useCallback(async (orderId: number): Promise<StatusUpdateResponse | null> => {
    return updateStatus(orderId, 'IN_PROGRESS');
  }, [updateStatus]);

  const completeOrder = useCallback(async (orderId: number): Promise<StatusUpdateResponse | null> => {
    return updateStatus(orderId, 'COMPLETED');
  }, [updateStatus]);

  const postponeOrder = useCallback(async (orderId: number): Promise<StatusUpdateResponse | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await orderManagementApi.postponeOrder(orderId);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Неизвестная ошибка');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteOrder = useCallback(async (orderId: number): Promise<{ message: string } | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await orderManagementApi.deleteOrder(orderId);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Неизвестная ошибка');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    updateStatus,
    approveForLaunch,
    startProduction,
    completeOrder,
    postponeOrder,
    deleteOrder,
    loading,
    error,
  };
};

// Комплексный хук для управления заказами
export const useOrderManagement = () => {
  const { orders, loading: ordersLoading, error: ordersError, refetch: refetchOrders, isWebSocketConnected, webSocketError } = useOrders();
  const { updateStatus, approveForLaunch, startProduction, completeOrder, postponeOrder, deleteOrder, loading: statusLoading, error: statusError } = useOrderStatusUpdate();
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const { orderDetails, loading: detailsLoading, error: detailsError, refetch: refetchDetails } = useOrderDetails(selectedOrderId);

  // Обновление статуса с автоматическим обновлением списка
  const updateOrderStatus = useCallback(async (orderId: number, status: OrderStatus) => {
    const result = await updateStatus(orderId, status);
    if (result) {
      // Обновляем список заказов
      await refetchOrders();
      // Если открыт детальный вид этого заказа, обновляем его тоже
      if (selectedOrderId === orderId && refetchDetails) {
        await refetchDetails();
      }
    }
    return result;
  }, [updateStatus, refetchOrders, selectedOrderId, refetchDetails]);

  // Разрешение к запуску с автоматическим обновлением
  const approveOrderForLaunch = useCallback(async (orderId: number) => {
    const result = await approveForLaunch(orderId);
    if (result) {
      await refetchOrders();
      if (selectedOrderId === orderId && refetchDetails) {
        await refetchDetails();
      }
    }
    return result;
  }, [approveForLaunch, refetchOrders, selectedOrderId, refetchDetails]);

  // Запуск производства с автоматическим обновлением
  const startOrderProduction = useCallback(async (orderId: number) => {
    const result = await startProduction(orderId);
    if (result) {
      await refetchOrders();
      if (selectedOrderId === orderId && refetchDetails) {
        await refetchDetails();
      }
    }
    return result;
  }, [startProduction, refetchOrders, selectedOrderId, refetchDetails]);

  // Завершение заказа с автоматическим обновлением
  const completeOrderProduction = useCallback(async (orderId: number) => {
    const result = await completeOrder(orderId);
    if (result) {
      await refetchOrders();
      if (selectedOrderId === orderId && refetchDetails) {
        await refetchDetails();
      }
    }
    return result;
  }, [completeOrder, refetchOrders, selectedOrderId, refetchDetails]);

  // Отложение заказа с автоматическим обновлением
  const postponeOrderWithUpdate = useCallback(async (orderId: number) => {
    const result = await postponeOrder(orderId);
    if (result) {
      await refetchOrders();
      if (selectedOrderId === orderId && refetchDetails) {
        await refetchDetails();
      }
    }
    return result;
  }, [postponeOrder, refetchOrders, selectedOrderId, refetchDetails]);

  // Удаление заказа с автоматическим обновлением
  const deleteOrderWithUpdate = useCallback(async (orderId: number) => {
    const result = await deleteOrder(orderId);
    if (result) {
      await refetchOrders();
      // Если удаляемый заказ был выбран, сбрасываем выбор
      if (selectedOrderId === orderId) {
        setSelectedOrderId(null);
      }
    }
    return result;
  }, [deleteOrder, refetchOrders, selectedOrderId]);

  // Изменение приоритета заказа с автоматическим обновлением
  const updateOrderPriority = useCallback(async (orderId: number, priority: number) => {
    try {
      const result = await orderManagementApi.updateOrderPriority(orderId, priority);
      if (result) {
        await refetchOrders();
      }
      return result;
    } catch (error) {
      console.error('Ошибка при изменении приоритета заказа:', error);
      throw error;
    }
  }, [refetchOrders]);

  return {
    // Данные
    orders,
    orderDetails,
    selectedOrderId,
    
    // Состояния загрузки
    ordersLoading,
    detailsLoading,
    statusLoading,
    loading: ordersLoading || detailsLoading || statusLoading,
    
    // WebSocket состояния
    isWebSocketConnected,
    webSocketError,
    
    // Ошибки
    ordersError,
    detailsError,
    statusError,
    error: ordersError || detailsError || statusError,
    
    // Действия
    setSelectedOrderId,
    updateOrderStatus,
    approveOrderForLaunch,
    startOrderProduction,
    completeOrderProduction,
    postponeOrderWithUpdate,
    deleteOrderWithUpdate,
    updateOrderPriority,
    refetchOrders,
    refetchDetails,
  };
};