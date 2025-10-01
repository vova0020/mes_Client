// src/modules/hooks/useOrders.tsx
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import * as orderService from '../../api/masterPage/orderServiceMaster';
import { Order } from '../../api/masterPage/orderServiceMaster';
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
  }, [socket, isWebSocketConnected, room]);

  // Загрузка заказов при монтировании компонента
  useEffect(() => {
    fetchOrders();
  }, []);

  // Подписка на изменения выбранного этапа
  useEffect(() => {
    const handleStageChange = (event: CustomEvent) => {
      const stage = event.detail;
      if (!stage?.finalStage) {
        // Загружаем данные для обычного этапа
        setTimeout(() => {
          fetchOrders();
        }, 100);
      } else {
        // Очищаем данные при переходе на финальный этап
        setOrders([]);
        setError(null);
        setLoading(false);
      }
    };

    window.addEventListener('stageChanged', handleStageChange as EventListener);
    
    return () => {
      window.removeEventListener('stageChanged', handleStageChange as EventListener);
    };
  }, []);

  // Создание нового заказа
  const createOrder = async (orderData: Partial<Order>) => {
    try {
      const newOrder = await orderService.createOrder(orderData);
      setOrders(prev => [...prev, newOrder]);
      return newOrder;
    } catch (err: any) {
      console.error("Ошибка при создании заказа:", err);
      setError(err);
      throw err;
    }
  };

  // Обновление заказа
  const updateOrder = async (id: number, orderData: Partial<Order>) => {
    try {
      const updatedOrder = await orderService.updateOrder(id, orderData);
      setOrders(prev => prev.map(order => order.id === id ? updatedOrder : order));
      return updatedOrder;
    } catch (err: any) {
      console.error("Ошибка при обновлении заказа:", err);
      setError(err);
      throw err;
    }
  };

  // Удаление заказа
  const deleteOrder = async (id: number) => {
    try {
      await orderService.deleteOrder(id);
      setOrders(prev => prev.filter(order => order.id !== id));
    } catch (err: any) {
      console.error("Ошибка при удалении заказа:", err);
      setError(err);
      throw err;
    }
  };

  return {
    orders,
    loading,
    error,
    isWebSocketConnected,
    webSocketError,
    fetchOrders,
    refreshOrdersData,
    createOrder,
    updateOrder,
    deleteOrder
  };
};

export default useOrders;