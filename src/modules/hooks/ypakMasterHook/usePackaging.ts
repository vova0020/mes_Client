import { useState, useCallback, useEffect } from 'react';
import { packagingApi, PackageDto, PackagesResponse, PackagingQueryParams } from '../../api/ypakMasterApi/packagingApi';

interface UsePackagingResult {
  packages: PackageDto[];
  pagination?: PackagesResponse['pagination'];
  loading: boolean;
  error: Error | null;
  fetchPackages: (params?: PackagingQueryParams) => Promise<void>;
  fetchPackagesByOrderId: (orderId: string | number) => Promise<void>;
  fetchPackageById: (packageId: string | number) => Promise<PackageDto | null>;
  clearPackages: () => void;
}

export const usePackaging = (initialParams?: PackagingQueryParams): UsePackagingResult => {
  const [packages, setPackages] = useState<PackageDto[]>([]);
  const [pagination, setPagination] = useState<PackagesResponse['pagination']>();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  // Функция для получения списка упаковок с фильтрами
  const fetchPackages = useCallback(async (params?: PackagingQueryParams) => {
    setLoading(true);
    setError(null);

    try {
      const response = await packagingApi.getPackages(params);
      setPackages(response.packages);
      setPagination(response.pagination);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Ошибка при получении упаковок');
      setError(error);
      console.error('Ошибка в usePackaging.fetchPackages:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Функция для получения упаковок по ID заказа
  const fetchPackagesByOrderId = useCallback(async (orderId: string | number) => {
    setLoading(true);
    setError(null);

    try {
      const response = await packagingApi.getPackagesByOrderId(orderId);
      setPackages(response.packages);
      setPagination(response.pagination);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(`Ошибка при получении упаковок для заказа ${orderId}`);
      setError(error);
      console.error('Ошибка в usePackaging.fetchPackagesByOrderId:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Функция для получения конкретной упаковки по ID
  const fetchPackageById = useCallback(async (packageId: string | number): Promise<PackageDto | null> => {
    setLoading(true);
    setError(null);

    try {
      const packageData = await packagingApi.getPackageById(packageId);
      return packageData;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(`Ошибка при получении упаковки ${packageId}`);
      setError(error);
      console.error('Ошибка в usePackaging.fetchPackageById:', error);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Функция для очистки списка упаковок
  const clearPackages = useCallback(() => {
    setPackages([]);
    setPagination(undefined);
    setError(null);
  }, []);

  // Инициализация с начальными параметрами
  useEffect(() => {
    if (initialParams) {
      fetchPackages(initialParams);
    }
  }, [initialParams, fetchPackages]);

  return {
    packages,
    pagination,
    loading,
    error,
    fetchPackages,
    fetchPackagesByOrderId,
    fetchPackageById,
    clearPackages
  };
};