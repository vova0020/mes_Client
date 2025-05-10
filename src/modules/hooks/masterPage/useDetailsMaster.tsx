import { useState, useEffect, useCallback } from 'react';
import { Detail, fetchDetailsByOrderId } from '../../api/masterPage/detailServiceMaster'; 

// Определение интерфейса результата хука
interface UseDetailsResult {
  details: Detail[];
  loading: boolean;
  error: Error | null;
  fetchDetails: (orderId: number | null) => Promise<void>;
}

// Пользовательский хук для управления данными о деталях
const useDetails = (initialOrderId: number | null = null): UseDetailsResult => {
  const [details, setDetails] = useState<Detail[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  
  // Функция для получения деталей для конкретного заказа
  // Мемоизируем функцию с useCallback, чтобы она не пересоздавалась п��и каждом рендере
  const fetchDetails = useCallback(async (orderId: number | null) => {
    if (orderId === null) {
      setDetails([]);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const fetchedDetails = await fetchDetailsByOrderId(orderId);
      setDetails(fetchedDetails);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Произошла неизвестная ошибка'));
    } finally {
      setLoading(false); 
    }
  }, []); // Пустой массив зависимостей означает, что функция создается только один раз
  
  // Инициализация с начальным ID заказа, если он предоставлен
  useEffect(() => {
    if (initialOrderId !== null) {
      fetchDetails(initialOrderId);
    }
  }, [initialOrderId, fetchDetails]); // Теперь fetchDetails стабильна и не вызывает циклов
  
  return {
    details,
    loading,
    error,
    fetchDetails
  };
};

export default useDetails;