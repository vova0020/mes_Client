// src/modules/hooks/useOrders.tsx
import { useState, useEffect, useCallback, useRef } from 'react';
import * as orderService from '../../api/ypakMasterApi/orderServiceMaster';
import { Order } from '../../api/ypakMasterApi/orderServiceMaster';

const useOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const isLoadingRef = useRef<boolean>(false);

  // Функция загрузки заказов
  const fetchOrders = useCallback(async () => {
    // Предотвращаем множественные одновременные запросы
    if (isLoadingRef.current) {
      console.log('Запрос уже выполняется, пропускаем...');
      return;
    }

    isLoadingRef.current = true;
    setLoading(true);
    // Важно: сбрасываем ошибку при каждой попытке загрузки
    setError(null);
    
    try {
      const data = await orderService.getAllOrders();
      setOrders(data);
    } catch (err: any) {
      console.error("Ошибка при загрузке заказов:", err);
      setError(err);
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  }, []);

  // Загрузка заказов при монтировании компонента
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Подписка на изменения выбранного этапа
  useEffect(() => {
    const handleStageChange = (event: CustomEvent) => {
      console.log('Получено событие изменения этапа в useOrders (ypak):', event.detail);
      // Добавляем небольшую задержку для предотвращения множественных запросов
      setTimeout(() => {
        fetchOrders(); // Перезагружаем заказы при изменении этапа
      }, 100);
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
    fetchOrders,
  };
};

export default useOrders;