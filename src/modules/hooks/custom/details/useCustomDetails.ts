import { useState, useCallback } from 'react';
import { customDetailsApi, OrderDetailsResponse } from '../../../api/custom/details/customDetailsApi';

export const useCustomDetails = () => {
  const [orderDetails, setOrderDetails] = useState<OrderDetailsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrderDetails = useCallback(async (orderId: number) => {
    setLoading(true);
    setError(null);
    try {
      const data = await customDetailsApi.getOrderDetails(orderId);
      setOrderDetails(data);
      return data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Ошибка загрузки деталей заказа';
      setError(errorMessage);
      console.error('Ошибка загрузки деталей:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    orderDetails,
    loading,
    error,
    fetchOrderDetails
  };
};
