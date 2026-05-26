import { useState, useCallback } from 'react';
import { customOrdersApi, CustomOrder, CustomOrderDetails } from '../../../api/custom/orders/customOrdersApi';

export const useCustomOrders = () => {
  const [orders, setOrders] = useState<CustomOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<CustomOrderDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrdersByStage = useCallback(async (stageId: number) => {
    setLoading(true);
    setError(null);
    try {
      const data = await customOrdersApi.getOrdersByStage(stageId);
      setOrders(data);
      return data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Ошибка загрузки заказов';
      setError(errorMessage);
      console.error('Ошибка загрузки заказов:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchOrderById = useCallback(async (orderId: number) => {
    setLoading(true);
    setError(null);
    try {
      const data = await customOrdersApi.getOrderById(orderId);
      setSelectedOrder(data);
      return data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Ошибка загрузки заказа';
      setError(errorMessage);
      console.error('Ошибка загрузки заказа:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    orders,
    selectedOrder,
    loading,
    error,
    fetchOrdersByStage,
    fetchOrderById
  };
};
