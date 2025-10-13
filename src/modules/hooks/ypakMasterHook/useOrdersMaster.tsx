// src/modules/hooks/useOrders.tsx
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import * as orderService from '../../api/ypakMasterApi/orderServiceMaster';
import { Order } from '../../api/ypakMasterApi/orderServiceMaster';
import { useWebSocketRoom } from '../../../hooks/useWebSocketRoom';

// Получение комнаты из localStorage
const getRoomFromStorage = (): string => {
  return 'room:masterypack';
};

const useOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const isLoadingRef = useRef<boolean>(false);
  
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

      const currentOrdersMap = new Map(currentOrders.map(o => [o.id, o]));
      const updatedOrders: Order[] = [];
      let hasChanges = false;

      newOrders.forEach(newOrder => {
        const currentOrder = currentOrdersMap.get(newOrder.id);
        
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

      const newOrderIds = new Set(newOrders.map(o => o.id));
      const removedOrders = currentOrders.filter(o => !newOrderIds.has(o.id));
      if (removedOrders.length > 0) {
        hasChanges = true;
      }

      return hasChanges ? updatedOrders : currentOrders;
    });
  }, []);

  // Функция загрузки заказов
  const fetchOrders = useCallback(async () => {
    // Предотвращаем множественные одновременные запросы
    if (isLoadingRef.current) {
      return;
    }

    isLoadingRef.current = true;
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
      isLoadingRef.current = false;
    }
  }, [updateOrdersSmartly]);

  // Функция для обновления данных заказов
  const refreshOrdersData = useCallback(async (status: string) => {
    const timestamp = new Date().toISOString();
    try {
      console.log(`[${timestamp}] Получен запрос на обновление данных заказов, status:`, status);
      console.log(`[${timestamp}] Текущее состояние:`, {
        ordersCount: orders.length,
        loading,
        isWebSocketConnected,
        hasTimeout: !!refreshTimeoutRef.current
      });
      
      if (!['updated', 'refresh', 'change', 'modify'].includes(status)) {
        console.warn('Неизвестный status от socket:', status, '- продолжаем обновление');
      }

      if (refreshTimeoutRef.current) {
        console.log(`[${timestamp}] Отменяем предыдущий timeout`);
        window.clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
      }

      refreshTimeoutRef.current = window.setTimeout(async () => {
        try {
          console.log(`[${new Date().toISOString()}] Выполняем обновление данных заказов (debounced)`);
          const data = await orderService.getAllOrders();
          updateOrdersSmartly(data);
          console.log(`[${new Date().toISOString()}] Данные заказов обновлены, получено ${data.length} элементов`);
        } catch (err) {
          console.error('Ошибка обновления данных заказов:', err);
          setError(err instanceof Error ? err : new Error('Ошибка обновления данных заказов'));
        } finally {
          refreshTimeoutRef.current = null;
        }
      }, REFRESH_DEBOUNCE_MS);
      
      console.log(`[${timestamp}] Установлен timeout на ${REFRESH_DEBOUNCE_MS}ms`);
    } catch (err) {
      console.error('Ошибка в refreshOrdersData:', err);
      setError(err instanceof Error ? err : new Error('Ошибка обработки WebSocket события'));
    }
  }, [updateOrdersSmartly, orders.length, loading, isWebSocketConnected]);

  // Настройка WebSocket обработчиков событий
  useEffect(() => {
    if (!socket || !isWebSocketConnected) return;

    console.log('🔌 Подписываемся на order:event, socket.id:', socket.id);

    const handleOrderEvent = async (data: { status: string }) => {
      console.log('🎯 ПОЛУЧЕНО order:event:', data);
      await refreshOrdersData(data.status);
    };

    const handlePackageEvent = async (data: { status: string }) => {
      console.log('📦 ПОЛУЧЕНО package:event в useOrdersMaster:', data);
      await refreshOrdersData(data.status);
    };

    socket.on('order:event', handleOrderEvent);
    socket.on('package:event', handlePackageEvent);
    
    console.log('✅ Активных слушателей order:event:', socket.listeners('order:event').length);
    console.log('✅ Активных слушателей package:event:', socket.listeners('package:event').length);

    return () => {
      socket.off('order:event', handleOrderEvent);
      socket.off('package:event', handlePackageEvent);
    };
  }, [socket, isWebSocketConnected, refreshOrdersData]);

  // Загрузка заказов при монтировании компонента
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Подписка на изменения выбранного этапа
  useEffect(() => {
    const handleStageChange = (event: CustomEvent) => {
      const stage = event.detail;
      console.log('Stage changed:', stage);
      // Загружаем данные для любого этапа
      fetchOrders();
    };

    window.addEventListener('stageChanged', handleStageChange as EventListener);
    
    return () => {
      window.removeEventListener('stageChanged', handleStageChange as EventListener);
    };
  }, [fetchOrders]);

  return {
    orders,
    loading,
    error,
    isWebSocketConnected,
    webSocketError: webSocketError as string | null,
    fetchOrders,
    refreshOrdersData
  };
};

export default useOrders;