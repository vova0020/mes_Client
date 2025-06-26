// src/modules/hooks/masterPage/usePackagingMaster.tsx
import { useState, useCallback } from 'react';
import { fetchPackagingByOrderId, PackagingDataDto } from '../../api/masterPage/ypakServiceMaster';

const usePackaging = () => {
  const [packagingData, setPackagingData] = useState<PackagingDataDto[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  // Функция загрузки упаковок по ID заказа
  const fetchPackaging = useCallback(async (orderId: number | null) => {
    if (orderId === null) {
      setPackagingData([]);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const data = await fetchPackagingByOrderId(orderId);
      // Сортируем по возрастанию ID
      const sortedData = data.sort((a, b) => a.id - b.id);
      setPackagingData(sortedData);
    } catch (err: any) {
      console.error("Ошибка при загрузке ��паковок:", err);
      setError(err);
      setPackagingData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Функция для очистки данных
  const clearPackaging = useCallback(() => {
    setPackagingData([]);
    setError(null);
    setLoading(false);
  }, []);

  return {
    packagingData,
    loading,
    error,
    fetchPackaging,
    clearPackaging
  };
};

export default usePackaging;