// src/modules/hooks/orderManagementHook/index.ts
import { useState, useEffect, useCallback } from 'react';
import { 
  orderManagementApi, 
  Order, 
  OrderDetailsResponse, 
  OrderStatus,
  StatusUpdateResponse 
} from '../../api/orderManagementApi';

// Хук для получения списка заказов
export const useOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await orderManagementApi.getOrders();
      setOrders(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Неизвестная ошибка');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return {
    orders,
    loading,
    error,
    refetch: fetchOrders,
  };
};

// Хук для получения деталей заказа
export const useOrderDetails = (orderId: number | null) => {
  const [orderDetails, setOrderDetails] = useState<OrderDetailsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrderDetails = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await orderManagementApi.getOrderDetails(id);
      setOrderDetails(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Неизвестная ошибка');
    } finally {
      setLoading(false);
    }
  }, []);

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
    refetch: orderId ? () => fetchOrderDetails(orderId) : undefined,
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

  return {
    updateStatus,
    approveForLaunch,
    startProduction,
    completeOrder,
    loading,
    error,
  };
};

// Комплексный хук для управления заказами
export const useOrderManagement = () => {
  const { orders, loading: ordersLoading, error: ordersError, refetch: refetchOrders } = useOrders();
  const { updateStatus, approveForLaunch, startProduction, completeOrder, loading: statusLoading, error: statusError } = useOrderStatusUpdate();
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

  return {
    // Данные
    orders,
    orderDetails,
    selectedOrderId,
    
    // Состо��ния загрузки
    ordersLoading,
    detailsLoading,
    statusLoading,
    loading: ordersLoading || detailsLoading || statusLoading,
    
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
    refetchOrders,
    refetchDetails,
  };
};

// Хук для работы с WebSocket (если нужен)
export const useOrderManagementSocket = () => {
  const [statusUpdates, setStatusUpdates] = useState<any[]>([]);
  
  // Здесь можно добавить логику WebSocket при необходимости
  // useEffect(() => {
  //   const socket = io('http://localhost:3000');
  //   socket.emit('joinRoom', { room: 'order-management' });
  //   
  //   socket.on('orderStatusChanged', (data) => {
  //     setStatusUpdates(prev => [...prev, data]);
  //   });
  //   
  //   return () => {
  //     socket.close();
  //   };
  // }, []);

  return {
    statusUpdates,
  };
};