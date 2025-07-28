import { useState, useEffect, useCallback } from 'react';
import { 
  routeManagementApi,
  RouteInfoDto,
  OrderForRoutesResponseDto,
  OrderPartsResponseDto,
  PartForRouteManagementDto,
  UpdatePartRouteDto,
  UpdatePartRouteResponseDto
} from '../../api/routeManagementApi/routeManagementApi';

// Типы состояний загрузки
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

// Тип для результата хука
interface UseRouteManagementResult {
  // Данные
  routes: RouteInfoDto[];
  orders: OrderForRoutesResponseDto[];
  selectedOrderParts: OrderPartsResponseDto | null;
  
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

  // Функция для загрузки всех маршрутов
  const fetchRoutes = useCallback(async (): Promise<void> => {
    try {
      setRoutesLoading('loading');
      setRoutesError(null);
      
      console.log('Загрузка списка маршрутов...');
      const data = await routeManagementApi.getRoutes();
      console.log('Получены маршруты:', data);
      
      setRoutes(data);
      setRoutesLoading('success');
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Неизвестная ошибка при загрузке маршрутов');
      setRoutesError(error);
      setRoutesLoading('error');
      console.error('Ошибка при загрузке маршрутов:', error);
    }
  }, []);

  // Функция для загрузки заказов
  const fetchOrders = useCallback(async (): Promise<void> => {
    try {
      setOrdersLoading('loading');
      setOrdersError(null);
      
      console.log('Загрузка списка заказов для управления маршрутами...');
      const data = await routeManagementApi.getOrders();
      console.log('Получены заказы:', data);
      
      setOrders(data);
      setOrdersLoading('success');
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Неизвестная ошибка при загрузке заказов');
      setOrdersError(error);
      setOrdersLoading('error');
      console.error('Ошибка при загрузке заказов:', error);
    }
  }, []);

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