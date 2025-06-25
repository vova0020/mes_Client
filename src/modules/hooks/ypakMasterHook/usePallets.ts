import { useState, useCallback, useEffect } from 'react';
import { 
  palletsApi, 
  PalletDto, 
  PalletsResponse, 
  PalletsQueryParams, 
  PalletsStatisticsDto,
  PartInfoDto
} from '../../api/ypakMasterApi/palletsApi';

interface UsePalletsResult {
  pallets: PalletDto[];
  partInfo?: PartInfoDto;
  palletsCount: number;
  pagination?: PalletsResponse['pagination'];
  statistics?: PalletsStatisticsDto;
  loading: boolean;
  error: Error | null;
  fetchPalletsByPartId: (partId: string | number, params?: PalletsQueryParams) => Promise<void>;
  fetchPalletByPartAndPalletId: (partId: string | number, palletId: string | number) => Promise<PalletDto | null>;
  fetchPalletsStatistics: (partId: string | number) => Promise<void>;
  clearPallets: () => void;
}

export const usePallets = (initialPartId?: string | number): UsePalletsResult => {
  const [pallets, setPallets] = useState<PalletDto[]>([]);
  const [partInfo, setPartInfo] = useState<PartInfoDto>();
  const [palletsCount, setPalletsCount] = useState<number>(0);
  const [pagination, setPagination] = useState<PalletsResponse['pagination']>();
  const [statistics, setStatistics] = useState<PalletsStatisticsDto>();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  // Функция для получения поддонов детали
  const fetchPalletsByPartId = useCallback(async (
    partId: string | number, 
    params?: PalletsQueryParams
  ) => {
    setLoading(true);
    setError(null);

    try {
      const response = await palletsApi.getPalletsByPartId(partId, params);
      setPallets(response.pallets);
      setPartInfo(response.partInfo);
      setPalletsCount(response.palletsCount);
      setPagination(response.pagination);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(`Ошибка при получении поддонов для детали ${partId}`);
      setError(error);
      console.error('Ошибка в usePallets.fetchPalletsByPartId:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Функция для получения конкретного поддона
  const fetchPalletByPartAndPalletId = useCallback(async (
    partId: string | number, 
    palletId: string | number
  ): Promise<PalletDto | null> => {
    setLoading(true);
    setError(null);

    try {
      const pallet = await palletsApi.getPalletByPartAndPalletId(partId, palletId);
      return pallet;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(`Ошибка при получении поддона ${palletId} для детали ${partId}`);
      setError(error);
      console.error('Ошибка в usePallets.fetchPalletByPartAndPalletId:', error);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Функция для получения статистики по поддонам детали
  const fetchPalletsStatistics = useCallback(async (partId: string | number) => {
    setLoading(true);
    setError(null);

    try {
      const stats = await palletsApi.getPalletsStatistics(partId);
      setStatistics(stats);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(`Ошибка при получении статистики поддонов для детали ${partId}`);
      setError(error);
      console.error('Ошибка в usePallets.fetchPalletsStatistics:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Функция для очистки данных о поддонах
  const clearPallets = useCallback(() => {
    setPallets([]);
    setPartInfo(undefined);
    setPalletsCount(0);
    setPagination(undefined);
    setStatistics(undefined);
    setError(null);
  }, []);

  // Инициализация с начальным ID детали
  useEffect(() => {
    if (initialPartId) {
      fetchPalletsByPartId(initialPartId);
    }
  }, [initialPartId, fetchPalletsByPartId]);

  return {
    pallets,
    partInfo,
    palletsCount,
    pagination,
    statistics,
    loading,
    error,
    fetchPalletsByPartId,
    fetchPalletByPartAndPalletId,
    fetchPalletsStatistics,
    clearPallets
  };
};