// src/modules/hooks/useOrders.tsx
import { useState, useEffect } from 'react';
import * as orderService from '../../api/ypakMasterApi/orderServiceMaster';
import { Order } from '../../api/ypakMasterApi/orderServiceMaster';

const useOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  // Функция загрузки заказов
  const fetchOrders = async () => {
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
    }
  };

  // Загрузка заказов при монтировании компонента
  useEffect(() => {
    fetchOrders();
  }, []);



  

  return {
    orders,
    loading,
    error,
    fetchOrders,
  
  };
};

export default useOrders;