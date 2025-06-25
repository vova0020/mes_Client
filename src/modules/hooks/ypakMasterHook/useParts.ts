import { useState, useCallback, useEffect } from 'react';
import { 
  partsApi, 
  PartDto, 
  PartsResponse, 
  PartsQueryParams, 
  PartsStatisticsDto,
  PackageInfoDto
} from '../../api/ypakMasterApi/partsApi';

interface UsePartsResult {
  parts: PartDto[];
  packageInfo?: PackageInfoDto;
  partsCount: number;
  pagination?: PartsResponse['pagination'];
  statistics?: PartsStatisticsDto;
  loading: boolean;
  error: Error | null;
  fetchPartsByPackageId: (packageId: string | number, params?: Omit<PartsQueryParams, 'packageId'>) => Promise<void>;
  fetchPartFromPackage: (packageId: string | number, partId: string | number) => Promise<PartDto | null>;
  fetchPartsStatistics: (packageId: string | number) => Promise<void>;
  clearParts: () => void;
}

export const useParts = (initialPackageId?: string | number): UsePartsResult => {
  const [parts, setParts] = useState<PartDto[]>([]);
  const [packageInfo, setPackageInfo] = useState<PackageInfoDto>();
  const [partsCount, setPartsCount] = useState<number>(0);
  const [pagination, setPagination] = useState<PartsResponse['pagination']>();
  const [statistics, setStatistics] = useState<PartsStatisticsDto>();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  // Функция для получения деталей упаковки
  const fetchPartsByPackageId = useCallback(async (
    packageId: string | number, 
    params?: Omit<PartsQueryParams, 'packageId'>
  ) => {
    setLoading(true);
    setError(null);

    try {
      const response = await partsApi.getPartsByPackageId(packageId, params);
      setParts(response.parts);
      setPackageInfo(response.packageInfo);
      setPartsCount(response.partsCount);
      setPagination(response.pagination);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(`Ошибка при получении деталей для упаковки ${packageId}`);
      setError(error);
      console.error('Ошибка в useParts.fetchPartsByPackageId:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Функция для получения конкретной детали из упаковки
  const fetchPartFromPackage = useCallback(async (
    packageId: string | number, 
    partId: string | number
  ): Promise<PartDto | null> => {
    setLoading(true);
    setError(null);

    try {
      const part = await partsApi.getPartFromPackage(packageId, partId);
      return part;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(`Ошибка при получении детали ${partId} из упаковки ${packageId}`);
      setError(error);
      console.error('Ошибка в useParts.fetchPartFromPackage:', error);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Функция для получения статистики по деталям упаковки
  const fetchPartsStatistics = useCallback(async (packageId: string | number) => {
    setLoading(true);
    setError(null);

    try {
      const stats = await partsApi.getPartsStatistics(packageId);
      setStatistics(stats);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(`Ошибка при получении статистики деталей для упаковки ${packageId}`);
      setError(error);
      console.error('Ошибка в useParts.fetchPartsStatistics:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Функция для очистки дан��ых о деталях
  const clearParts = useCallback(() => {
    setParts([]);
    setPackageInfo(undefined);
    setPartsCount(0);
    setPagination(undefined);
    setStatistics(undefined);
    setError(null);
  }, []);

  // Инициализация с начальным ID упаковки
  useEffect(() => {
    if (initialPackageId) {
      fetchPartsByPackageId(initialPackageId);
    }
  }, [initialPackageId, fetchPartsByPackageId]);

  return {
    parts,
    packageInfo,
    partsCount,
    pagination,
    statistics,
    loading,
    error,
    fetchPartsByPackageId,
    fetchPartFromPackage,
    fetchPartsStatistics,
    clearParts
  };
};