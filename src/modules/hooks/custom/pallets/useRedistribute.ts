import { useState, useCallback } from 'react';
import { redistributeApi, RedistributeRequest, RedistributeResponse } from '../../../api/custom/pallets/redistributeApi';

export const useRedistribute = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const redistributeParts = useCallback(async (data: RedistributeRequest): Promise<RedistributeResponse> => {
    setLoading(true);
    setError(null);
    try {
      const result = await redistributeApi.redistributeParts(data);
      return result;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Ошибка перераспределения деталей';
      setError(errorMessage);
      console.error('Ошибка перераспределения:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    redistributeParts
  };
};
