import { useState } from 'react';
import {
  uploadCustomOrderFile,
  saveCustomOrderFromFile,
  Part,
  SaveOrderRequest,
} from '../../../api/custom/order-management/customOrderManagementApi';

interface UseCustomOrderManagementReturn {
  uploadFile: (file: File) => Promise<Part[]>;
  saveOrder: (orderData: SaveOrderRequest) => Promise<number | null>;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
}

/**
 * Хук для работы с API индивидуального производства
 */
export const useCustomOrderManagement = (): UseCustomOrderManagementReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => {
    setError(null);
  };

  const uploadFile = async (file: File): Promise<Part[]> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await uploadCustomOrderFile(file);

      if (response.success && response.data.parts) {
        return response.data.parts;
      } else {
        throw new Error(response.message || 'Ошибка при парсинге файла');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Неизвестная ошибка';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const saveOrder = async (orderData: SaveOrderRequest): Promise<number | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await saveCustomOrderFromFile(orderData);

      if (response.success && response.data?.orderId) {
        return response.data.orderId;
      } else {
        throw new Error(response.message || 'Ошибка при сохранении заказа');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Неизвестная ошибка';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    uploadFile,
    saveOrder,
    isLoading,
    error,
    clearError,
  };
};
