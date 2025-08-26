import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { 
  productionOrdersApi, 
  ProductionOrderResponseDto, 
  CreateProductionOrderDto, 
  UpdateProductionOrderDto,
  UpdateOrderStatusDto,
  OrderStatus,
  DeleteProductionOrderResponse,
  PackageDirectoryResponseDto
} from '../../api/productionOrdersApi/productionOrdersApi';
import { useWebSocketRoom } from '../../../hooks/useWebSocketRoom';

// Типы состояний загрузки
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

// Тип для результата хука
interface UseProductionOrdersResult {
  orders: ProductionOrderResponseDto[];
  loading: LoadingState;
  error: Error | null;
  selectedOrder: ProductionOrderResponseDto | null;
  isWebSocketConnected: boolean;
  webSocketError: string | null;
  
  // Операции CRUD
  createOrder: (createDto: CreateProductionOrderDto) => Promise<ProductionOrderResponseDto>;
  updateOrder: (id: number, updateDto: UpdateProductionOrderDto) => Promise<ProductionOrderResponseDto>;
  updateOrderStatus: (id: number, status: OrderStatus) => Promise<ProductionOrderResponseDto>;
  deleteOrder: (id: number) => Promise<void>;
  fetchOrders: (status?: OrderStatus) => Promise<void>;
  fetchOrderById: (id: number) => Promise<ProductionOrderResponseDto>;
  
  // Управление выбранным заказом
  selectOrder: (orderId: number | null) => void;
  clearSelection: () => void;
  
  // Состояния операций
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  isUpdatingStatus: boolean;
}

/**
 * Хук для работы с производственными заказами
 * @param autoFetch - Автоматически загружать данные при инициализации (по умолчанию true)
 * @param statusFilter - Фильтр по статусу для автоматической загрузки
 * @returns Объект с данными и методами для работы с заказами
 */
export const useProductionOrders = (
  autoFetch: boolean = true, 
  statusFilter?: OrderStatus
): UseProductionOrdersResult => {
  const [orders, setOrders] = useState<ProductionOrderResponseDto[]>([]);
  const [loading, setLoading] = useState<LoadingState>('idle');
  const [error, setError] = useState<Error | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<ProductionOrderResponseDto | null>(null);
  
  // Состояния для отдельных операций
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

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

  // Функция для умного обновления массива заказов
  const updateOrdersSmartly = useCallback((newOrders: ProductionOrderResponseDto[]) => {
    setOrders(currentOrders => {
      if (currentOrders.length === 0) {
        return newOrders;
      }

      const currentOrdersMap = new Map(currentOrders.map(o => [o.orderId, o]));
      const updatedOrders: ProductionOrderResponseDto[] = [];
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

  // Функция для загрузки всех заказов
  const fetchOrders = useCallback(async (status?: OrderStatus): Promise<void> => {
    try {
      setLoading('loading');
      setError(null);
      
      console.log('Загрузка списка производственных заказов...', status ? `со статусом ${status}` : '');
      const data = await productionOrdersApi.findAll(status);
      console.log('Получены производственные заказы:', data);
      
      updateOrdersSmartly(data);
      setLoading('success');
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Неизвестная ошибка при загрузке заказов');
      setError(error);
      setLoading('error');
      console.error('Ошибка при загрузке производственных заказов:', error);
    }
  }, [updateOrdersSmartly]);

  // Функция ��ля получения заказа по ID
  const fetchOrderById = useCallback(async (id: number): Promise<ProductionOrderResponseDto> => {
    try {
      console.log(`Загрузка производственного заказа с ID=${id}...`);
      const data = await productionOrdersApi.findById(id);
      console.log('Получен производственный заказ:', data);
      return data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Неизвестная ошибка при загрузке заказа');
      setError(error);
      console.error('Ошибка при загрузке производственного заказа:', error);
      throw error;
    }
  }, []);

  // Функция для создания нового заказа
  const createOrder = useCallback(async (createDto: CreateProductionOrderDto): Promise<ProductionOrderResponseDto> => {
    try {
      setIsCreating(true);
      setError(null);
      
      console.log('Создание нового производственного заказа:', createDto);
      const newOrder = await productionOrdersApi.create(createDto);
      console.log('Производственный заказ создан:', newOrder);
      
      // Добавляем новый заказ в список
      setOrders(prev => [...prev, newOrder]);
      
      return newOrder;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Неизвестная ошибка при создании заказа');
      setError(error);
      console.error('Ошибка при создании производственного заказа:', error);
      throw error;
    } finally {
      setIsCreating(false);
    }
  }, []);

  // Функция для обновления заказа
  const updateOrder = useCallback(async (id: number, updateDto: UpdateProductionOrderDto): Promise<ProductionOrderResponseDto> => {
    try {
      setIsUpdating(true);
      setError(null);
      
      console.log(`Обновление производственного заказа с ID=${id}:`, updateDto);
      const updatedOrder = await productionOrdersApi.update(id, updateDto);
      console.log('Производственный заказ обновлен:', updatedOrder);
      
      // Обновляем заказ в списке
      setOrders(prev => prev.map(order => order.orderId === id ? updatedOrder : order));
      
      // Если обновляемый заказ был выбран, обновляем и его
      if (selectedOrder?.orderId === id) {
        setSelectedOrder(updatedOrder);
      }
      
      return updatedOrder;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Неизвестная ошибка при обновлении заказа');
      setError(error);
      console.error('Ошибка при обновлении производственного заказа:', error);
      throw error;
    } finally {
      setIsUpdating(false);
    }
  }, [selectedOrder]);

  // Функция для изменения статуса заказа
  const updateOrderStatus = useCallback(async (id: number, status: OrderStatus): Promise<ProductionOrderResponseDto> => {
    try {
      setIsUpdatingStatus(true);
      setError(null);
      
      console.log(`Изменение статуса производственного заказа с ID=${id} на ${status}`);
      const updatedOrder = await productionOrdersApi.updateStatus(id, { status });
      console.log('Статус производственного заказа изменен:', updatedOrder);
      
      // Обновляем заказ в списке
      setOrders(prev => prev.map(order => order.orderId === id ? updatedOrder : order));
      
      // Если обновляемый заказ был выбран, обновляем и его
      if (selectedOrder?.orderId === id) {
        setSelectedOrder(updatedOrder);
      }
      
      return updatedOrder;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Неизвестная ошибка при изменении статуса заказа');
      setError(error);
      console.error('Ошибка при изменении статуса производственного заказа:', error);
      throw error;
    } finally {
      setIsUpdatingStatus(false);
    }
  }, [selectedOrder]);

  // Функция для удаления заказа
  const deleteOrder = useCallback(async (id: number): Promise<void> => {
    try {
      setIsDeleting(true);
      setError(null);
      
      console.log(`Удаление производственного заказа с ID=${id}...`);
      const result = await productionOrdersApi.remove(id);
      console.log('Производственный заказ удален:', result.message);
      
      // Удаляем заказ из списка
      setOrders(prev => prev.filter(order => order.orderId !== id));
      
      // Если удаляемый заказ был выбран, сбрасываем выбор
      if (selectedOrder?.orderId === id) {
        setSelectedOrder(null);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Неизвестная ошибка при удалении заказа');
      setError(error);
      console.error('Ошибка при удалении производственного заказа:', error);
      throw error;
    } finally {
      setIsDeleting(false);
    }
  }, [selectedOrder]);

  // Функция для выбора заказа
  const selectOrder = useCallback((orderId: number | null) => {
    if (orderId === null) {
      setSelectedOrder(null);
      return;
    }
    
    const order = orders.find(ord => ord.orderId === orderId);
    if (order) {
      setSelectedOrder(order);
      console.log('Выбран производственный заказ:', order);
    } else {
      console.warn(`Производственный заказ с ID=${orderId} не найден в списке`);
    }
  }, [orders]);

  // Функция для сброса выбора
  const clearSelection = useCallback(() => {
    setSelectedOrder(null);
    console.log('Выбор произво��ственного заказа сброшен');
  }, []);

  // Функция для обновления данных заказов
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
          const data = await productionOrdersApi.findAll(statusFilter);
          updateOrdersSmartly(data);
          console.log(`Производственные заказы обновлены (debounced).`);
        } catch (err) {
          console.error('Ошибка обновления заказов:', err);
        }
      }, REFRESH_DEBOUNCE_MS);
    } catch (err) {
      console.error('Ошибка в refreshOrdersData:', err);
    }
  }, [statusFilter, updateOrdersSmartly]);

  // Настройка WebSocket обработчиков событий
  useEffect(() => {
    if (!socket || !isWebSocketConnected) return;

    console.log('Настройка WebSocket обработчиков для заказов в комнате:', room);

    // Обработчик события изменения заказов
    const handleOrderEvent = async (data: { status: string }) => {
      console.log('Получено WebSocket событие order:event - status:', data.status);
      await refreshOrdersData(data.status);
    };

    // Регистрируем обработчик события
    socket.on('order:event', handleOrderEvent);

    // Cleanup функция
    return () => {
      socket.off('order:event', handleOrderEvent);

      // очистка debounce таймера при unmount/переподключении
      if (refreshTimeoutRef.current) {
        window.clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
      }
    };
  }, [socket, isWebSocketConnected, room, refreshOrdersData]);

  // Автоматическая загрузка данных при инициализации
  useEffect(() => {
    if (autoFetch) {
      fetchOrders(statusFilter);
    }
  }, [autoFetch, statusFilter, fetchOrders]);

  return {
    orders,
    loading,
    error,
    selectedOrder,
    isWebSocketConnected,
    webSocketError,
    
    // Операции CRUD
    createOrder,
    updateOrder,
    updateOrderStatus,
    deleteOrder,
    fetchOrders,
    fetchOrderById,
    
    // Управление выбранным заказом
    selectOrder,
    clearSelection,
    
    // Состояния операций
    isCreating,
    isUpdating,
    isDeleting,
    isUpdatingStatus
  };
};