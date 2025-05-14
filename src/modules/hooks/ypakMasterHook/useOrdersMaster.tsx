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
    fetchOrders,
    createOrder,
    updateOrder,
    deleteOrder
  };
};

export default useOrders;