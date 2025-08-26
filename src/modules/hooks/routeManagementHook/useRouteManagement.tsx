import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { 
  routeManagementApi,
  RouteInfoDto,
  OrderForRoutesResponseDto,
  OrderPartsResponseDto,
  PartForRouteManagementDto,
  UpdatePartRouteDto,
  UpdatePartRouteResponseDto
} from '../../api/routeManagementApi/routeManagementApi';
import { useWebSocketRoom } from '../../../hooks/useWebSocketRoom';

// Типы состояний загрузки
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

// Тип для результата хука
interface UseRouteManagementResult {
  // Данные
  routes: RouteInfoDto[];
  orders: OrderForRoutesResponseDto[];
  selectedOrderParts: OrderPartsResponseDto | null;
  isWebSocketConnected: boolean;
  webSocketError: string | null;
  
  // Состояния загрузки
  routesLoading: LoadingState;
  ordersLoading: LoadingState;
  partsLoading: LoadingState;
  updatingRoute: boolean;
  
  // Ошибки
  routesError: Error | null;
  ordersError: Error | null;
  partsError: Error | null;
  updateError: Error | null;
  
  // Методы
  fetchRoutes: () => Promise<void>;
  fetchOrders: () => Promise<void>;
  fetchOrderParts: (orderId: number) => Promise<void>;
  updatePartRoute: (partId: number, routeId: number) => Promise<UpdatePartRouteResponseDto>;
  
  // Утилиты
  clearOrderParts: () => void;
  clearErrors: () => void;
}

/**
 * Хук для работы с управлением маршрутами
 * @param autoFetchRoutes - Автоматически загружать маршруты при инициализации (по умолчанию true)
 * @param autoFetchOrders - Автоматически загружать заказы при инициализации (по умолчанию true)
 * @returns Объект с данными и методами для работы с управлением маршрутами
 */
export const useRouteManagement = (
  autoFetchRoutes: boolean = true,
  autoFetchOrders: boolean = true
): UseRouteManagementResult => {
  // Состояния данных
  const [routes, setRoutes] = useState<RouteInfoDto[]>([]);
  const [orders, setOrders] = useState<OrderForRoutesResponseDto[]>([]);
  const [selectedOrderParts, setSelectedOrderParts] = useState<OrderPartsResponseDto | null>(null);
  
  // Состояния загрузки
  const [routesLoading, setRoutesLoading] = useState<LoadingState>('idle');
  const [ordersLoading, setOrdersLoading] = useState<LoadingState>('idle');
  const [partsLoading, setPartsLoading] = useState<LoadingState>('idle');
  const [updatingRoute, setUpdatingRoute] = useState(false);
  
  // Состояния ошибок
  const [routesError, setRoutesError] = useState<Error | null>(null);
  const [ordersError, setOrdersError] = useState<Error | null>(null);
  const [partsError, setPartsError] = useState<Error | null>(null);
  const [updateError, setUpdateError] = useState<Error | null>(null);

  // debounce refs
  const refreshTimeoutRef = useRef<number | null>(null);
  const REFRESH_DEBOUNCE_MS = 300;
  
  // Получаем комнату для WebSocket подключения
  const room = useMemo(() => 'room:technologist', []);
  
  // Инициализируем WebSocket подключение
  const { 
    socket, 
    isConnected: isWebSocketConnected, 
    error: webSocketError 
  } = useWebSocketRoom({ 
    room,
    autoJoin: true 
  });

  // Функция для умного обновления маршрутов
  const updateRoutesSmartly = useCallback((newRoutes: RouteInfoDto[]) => {
    setRoutes(currentRoutes => {
      if (currentRoutes.length === 0) {
        return newRoutes;
      }

      const currentRoutesMap = new Map(currentRoutes.map(r => [r.routeId, r]));
      const updatedRoutes: RouteInfoDto[] = [];
      let hasChanges = false;

      newRoutes.forEach(newRoute => {
        const currentRoute = currentRoutesMap.get(newRoute.routeId);
        
        if (!currentRoute) {
          updatedRoutes.push(newRoute);
          hasChanges = true;
        } else {
          const routeChanged = JSON.stringify(currentRoute) !== JSON.stringify(newRoute);

          if (routeChanged) {
            updatedRoutes.push(newRoute);
            hasChanges = true;
          } else {
            updatedRoutes.push(currentRoute);
          }
        }
      });

      const newRouteIds = new Set(newRoutes.map(r => r.routeId));
      const removedRoutes = currentRoutes.filter(r => !newRouteIds.has(r.routeId));
      if (removedRoutes.length > 0) {
        hasChanges = true;
      }

      return hasChanges ? updatedRoutes : currentRoutes;
    });
  }, []);

  // Функция для умного обновления заказов
  const updateOrdersSmartly = useCallback((newOrders: OrderForRoutesResponseDto[]) => {
    setOrders(currentOrders => {
      if (currentOrders.length === 0) {
        return newOrders;
      }

      const currentOrdersMap = new Map(currentOrders.map(o => [o.orderId, o]));
      const updatedOrders: OrderForRoutesResponseDto[] = [];
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

  // Функция для умного обновления деталей заказа
  const updateOrderPartsSmartly = useCallback((newOrderParts: OrderPartsResponseDto) => {
    setSelectedOrderParts(currentOrderParts => {
      if (!currentOrderParts) {
        return newOrderParts;
      }

      const orderPartsChanged = JSON.stringify(currentOrderParts) !== JSON.stringify(newOrderParts);
      return orderPartsChanged ? newOrderParts : currentOrderParts;
    });
  }, []);

  // Функция для загрузки всех маршрутов
  const fetchRoutes = useCallback(async (): Promise<void> => {
    try {
      setRoutesLoading('loading');
      setRoutesError(null);
      
      console.log('Загрузка списка маршрутов...');
      const data = await routeManagementApi.getRoutes();
      console.log('Получены маршруты:', data);
      
      updateRoutesSmartly(data);
      setRoutesLoading('success');
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Неизвестная ошибка при загрузке маршрутов');
      setRoutesError(error);
      setRoutesLoading('error');
      console.error('Ошибка при загрузке маршрутов:', error);
    }
  }, [updateRoutesSmartly]);

  // Функция для загрузки заказов
  const fetchOrders = useCallback(async (): Promise<void> => {
    try {
      setOrdersLoading('loading');
      setOrdersError(null);
      
      console.log('Загрузка списка заказов для управления маршрутами...');
      const data = await routeManagementApi.getOrders();
      console.log('Получены заказы:', data);
      
      updateOrdersSmartly(data);
      setOrdersLoading('success');
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Неизвестная ошибка при загрузке заказов');
      setOrdersError(error);
      setOrdersLoading('error');
      console.error('Ошибка при загрузке заказов:', error);
    }
  }, [updateOrdersSmartly]);

  // Функция для загрузки деталей заказа
  const fetchOrderParts = useCallback(async (orderId: number): Promise<void> => {
    try {
      setPartsLoading('loading');
      setPartsError(null);
      
      console.log(`Загрузка деталей заказа с ID=${orderId}...`);
      const data = await routeManagementApi.getOrderParts(orderId);
      console.log('Получены детали заказа:', data);
      
      setSelectedOrderParts(data);
      setPartsLoading('success');
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Неизвестная ошибка при загрузке деталей заказа');
      setPartsError(error);
      setPartsLoading('error');
      console.error('Ошибка при загрузке деталей заказа:', error);
    }
  }, []);

  // Функция для изменения маршрута детали
  const updatePartRoute = useCallback(async (partId: number, routeId: number): Promise<UpdatePartRouteResponseDto> => {
    try {
      setUpdatingRoute(true);
      setUpdateError(null);
      
      console.log(`Изменение маршрута детали с ID=${partId} на маршрут ${routeId}...`);
      const result = await routeManagementApi.updatePartRoute(partId, { routeId });
      console.log('Маршрут детали изменен:', result);
      
      // Обновляем данные о деталях заказа, если они загружены
      if (selectedOrderParts) {
        const updatedParts = selectedOrderParts.parts.map(part => {
          if (part.partId === partId) {
            return {
              ...part,
              currentRoute: result.newRoute
            };
          }
          return part;
        });
        
        setSelectedOrderParts({
          ...selectedOrderParts,
          parts: updatedParts
        });
      }
      
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Неизвестная ошибка при изменении маршрута детали');
      setUpdateError(error);
      console.error('Ошибка при изменении маршрута детали:', error);
      throw error;
    } finally {
      setUpdatingRoute(false);
    }
  }, [selectedOrderParts]);

  // Функция для очистки данных о деталях заказа
  const clearOrderParts = useCallback(() => {
    setSelectedOrderParts(null);
    setPartsError(null);
    setPartsLoading('idle');
    console.log('Данные о деталях заказа очищены');
  }, []);

  // Функция для очистки всех ошибок
  const clearErrors = useCallback(() => {
    setRoutesError(null);
    setOrdersError(null);
    setPartsError(null);
    setUpdateError(null);
    console.log('Все ошибки очищены');
  }, []);

  // Функции для обновления данных по WebSocket событиям
  const refreshRoutesData = useCallback(async (status: string) => {
    try {
      if (status !== 'updated') {
        console.warn('Игнорируем неожиданный status from socket для маршрутов:', status);
        return;
      }

      if (refreshTimeoutRef.current) {
        window.clearTimeout(refreshTimeoutRef.current);
      }

      refreshTimeoutRef.current = window.setTimeout(async () => {
        try {
          const data = await routeManagementApi.getRoutes();
          updateRoutesSmartly(data);
          console.log(`Маршруты обновлены (debounced).`);
        } catch (err) {
          console.error('Ошибка обновления маршрутов:', err);
        }
      }, REFRESH_DEBOUNCE_MS);
    } catch (err) {
      console.error('Ошибка в refreshRoutesData:', err);
    }
  }, [updateRoutesSmartly]);

  const refreshOrdersData = useCallback(async (status: string) => {
    try {
      if (status !== 'updated') {
        console.warn('Игнорируем неожиданный status from socket для заказов:', status);
        return;
      }

      if (refreshTimeoutRef.current) {
        window.clearTimeout(refreshTimeoutRef.current);
      }

      refreshTimeoutRef.current = window.setTimeout(async () => {
        try {
          const data = await routeManagementApi.getOrders();
          updateOrdersSmartly(data);
          console.log(`Заказы обновлены (debounced).`);
        } catch (err) {
          console.error('Ошибка обновления заказов:', err);
        }
      }, REFRESH_DEBOUNCE_MS);
    } catch (err) {
      console.error('Ошибка в refreshOrdersData:', err);
    }
  }, [updateOrdersSmartly]);

  const refreshOrderPartsData = useCallback(async (status: string) => {
    try {
      if (status !== 'updated') {
        console.warn('Игнорируем неожиданный status from socket для деталей:', status);
        return;
      }

      // Обновляем детали только если есть выбранный заказ
      if (!selectedOrderParts) {
        return;
      }

      if (refreshTimeoutRef.current) {
        window.clearTimeout(refreshTimeoutRef.current);
      }

      refreshTimeoutRef.current = window.setTimeout(async () => {
        try {
          const data = await routeManagementApi.getOrderParts(selectedOrderParts.order.orderId);
          updateOrderPartsSmartly(data);
          console.log(`Детали заказа обновлены (debounced).`);
        } catch (err) {
          console.error('Ошибка обновления деталей заказа:', err);
        }
      }, REFRESH_DEBOUNCE_MS);
    } catch (err) {
      console.error('Ошибка в refreshOrderPartsData:', err);
    }
  }, [selectedOrderParts, updateOrderPartsSmartly]);

  // Настройка WebSocket обработчиков событий
  useEffect(() => {
    if (!socket || !isWebSocketConnected) return;

    console.log('Настройка WebSocket обработчиков для управления маршрутами в комнате:', room);

    // Обработчик события изменения маршрутов
    const handleTechnologyRouteEvent = async (data: { status: string }) => {
      console.log('Получено WebSocket событие technology_route:event - status:', data.status);
      await refreshRoutesData(data.status);
    };

    // Обработчик события изменения заказов
    const handleOrderEvent = async (data: { status: string }) => {
      console.log('Получено WebSocket событие order:event - status:', data.status);
      await refreshOrdersData(data.status);
    };

    // Обработчик события изменения деталей
    const handleDetailEvent = async (data: { status: string }) => {
      console.log('Получено WebSocket событие detail:event - status:', data.status);
      await refreshOrderPartsData(data.status);
    };

    // Регистрируем обработчики событий
    socket.on('technology_route:event', handleTechnologyRouteEvent);
    socket.on('order:event', handleOrderEvent);
    socket.on('detail:event', handleDetailEvent);

    // Cleanup функция
    return () => {
      socket.off('technology_route:event', handleTechnologyRouteEvent);
      socket.off('order:event', handleOrderEvent);
      socket.off('detail:event', handleDetailEvent);

      // очистка debounce таймера при unmount/переподключении
      if (refreshTimeoutRef.current) {
        window.clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
      }
    };
  }, [socket, isWebSocketConnected, room, refreshRoutesData, refreshOrdersData, refreshOrderPartsData]);

  // Автоматическая загрузка данных при инициализации
  useEffect(() => {
    if (autoFetchRoutes) {
      fetchRoutes();
    }
  }, [autoFetchRoutes, fetchRoutes]);

  useEffect(() => {
    if (autoFetchOrders) {
      fetchOrders();
    }
  }, [autoFetchOrders, fetchOrders]);

  return {
    // Данные
    routes,
    orders,
    selectedOrderParts,
    isWebSocketConnected,
    webSocketError,
    
    // Состояния загрузки
    routesLoading,
    ordersLoading,
    partsLoading,
    updatingRoute,
    
    // Ошибки
    routesError,
    ordersError,
    partsError,
    updateError,
    
    // Методы
    fetchRoutes,
    fetchOrders,
    fetchOrderParts,
    updatePartRoute,
    
    // Утилиты
    clearOrderParts,
    clearErrors
  };
};