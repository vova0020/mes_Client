import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { 
  customOrderStatisticsApi, 
  CustomOrderStatistics, 
  CustomOrderDetailedStatistics 
} from '../../../api/custom';
import { useWebSocketRoom } from '../../../../hooks/useWebSocketRoom';

export const useCustomOrderStatistics = () => {
  const [orders, setOrders] = useState<CustomOrderStatistics[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const refreshTimeoutRef = useRef<number | null>(null);
  const REFRESH_DEBOUNCE_MS = 300;
  
  const room = useMemo(() => 'room:technologist', []);
  
  const { 
    socket, 
    isConnected: isWebSocketConnected, 
    error: webSocketError 
  } = useWebSocketRoom({ 
    room,
    autoJoin: true 
  });

  const updateOrdersSmartly = useCallback((newOrders: CustomOrderStatistics[]) => {
    setOrders(currentOrders => {
      if (currentOrders.length === 0) {
        return newOrders;
      }

      const currentOrdersMap = new Map(currentOrders.map(o => [o.customOrderId, o]));
      const updatedOrders: CustomOrderStatistics[] = [];
      let hasChanges = false;

      newOrders.forEach(newOrder => {
        const currentOrder = currentOrdersMap.get(newOrder.customOrderId);
        
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

      const newOrderIds = new Set(newOrders.map(o => o.customOrderId));
      const removedOrders = currentOrders.filter(o => !newOrderIds.has(o.customOrderId));
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
      const data = await customOrderStatisticsApi.getAllOrders();
      updateOrdersSmartly(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Неизвестная ошибка');
    } finally {
      setLoading(false);
    }
  }, [updateOrdersSmartly]);

  const refreshOrdersData = useCallback(async (status: string) => {
    try {
      if (status !== 'updated') {
        return;
      }

      if (refreshTimeoutRef.current) {
        window.clearTimeout(refreshTimeoutRef.current);
      }

      refreshTimeoutRef.current = window.setTimeout(async () => {
        try {
          const data = await customOrderStatisticsApi.getAllOrders();
          updateOrdersSmartly(data);
        } catch (err) {
          console.error('Ошибка обновления данных заказов:', err);
        }
      }, REFRESH_DEBOUNCE_MS);
    } catch (err) {
      console.error('Ошибка в refreshOrdersData:', err);
    }
  }, [updateOrdersSmartly]);

  useEffect(() => {
    if (!socket || !isWebSocketConnected) return;

    const handleCustomOrderEvent = async (data: { status: string }) => {
      await refreshOrdersData(data.status);
    };

    socket.on('custom-order:event', handleCustomOrderEvent);

    return () => {
      socket.off('custom-order:event', handleCustomOrderEvent);
      if (refreshTimeoutRef.current) {
        window.clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
      }
    };
  }, [socket, isWebSocketConnected, refreshOrdersData]);

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
  };
};

export const useCustomOrderDetailedStatistics = (orderId: number | null) => {
  const [orderDetails, setOrderDetails] = useState<CustomOrderDetailedStatistics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const refreshTimeoutRef = useRef<number | null>(null);
  const REFRESH_DEBOUNCE_MS = 300;
  
  const room = useMemo(() => 'room:technologist', []);
  
  const { 
    socket, 
    isConnected: isWebSocketConnected, 
    error: webSocketError 
  } = useWebSocketRoom({ 
    room,
    autoJoin: true 
  });

  const updateOrderDetailsSmartly = useCallback((newOrderDetails: CustomOrderDetailedStatistics) => {
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
      const data = await customOrderStatisticsApi.getOrderDetails(id);
      updateOrderDetailsSmartly(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Неизвестная ошибка');
    } finally {
      setLoading(false);
    }
  }, [updateOrderDetailsSmartly]);

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
          const data = await customOrderStatisticsApi.getOrderDetails(orderId);
          updateOrderDetailsSmartly(data);
        } catch (err) {
          console.error('Ошибка обновления данных деталей заказа:', err);
        }
      }, REFRESH_DEBOUNCE_MS);
    } catch (err) {
      console.error('Ошибка в refreshOrderDetailsData:', err);
    }
  }, [orderId, updateOrderDetailsSmartly]);

  useEffect(() => {
    if (!socket || !isWebSocketConnected) return;

    const handleCustomOrderDetailEvent = async (data: { status: string }) => {
      await refreshOrderDetailsData(data.status);
    };

    socket.on('custom-order:event', handleCustomOrderDetailEvent);

    return () => {
      socket.off('custom-order:event', handleCustomOrderDetailEvent);
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
  };
};
