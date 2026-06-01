import { useState, useCallback } from 'react';
import { customPalletsApi, PalletsResponse, CreatePalletRequest, CustomPallet, PalletDetailsResponse } from '../../../api/custom/pallets/customPalletsApi';

export const useCustomPallets = () => {
  const [pallets, setPallets] = useState<PalletsResponse | null>(null);
  const [palletDetails, setPalletDetails] = useState<PalletDetailsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrderPallets = useCallback(async (orderId: number, stageId?: number) => {
    setLoading(true);
    setError(null);
    try {
      const data = await customPalletsApi.getOrderPallets(orderId, stageId);
      setPallets(data);
      return data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Ошибка загрузки поддонов';
      setError(errorMessage);
      console.error('Ошибка загрузки поддонов:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPalletParts = useCallback(async (palletId: number, stageId?: number) => {
    setLoading(true);
    setError(null);
    try {
      const data = await customPalletsApi.getPalletParts(palletId, stageId);
      setPalletDetails(data);
      return data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Ошибка загрузки деталей поддона';
      setError(errorMessage);
      console.error('Ошибка загрузки деталей поддона:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createPallet = useCallback(async (orderId: number, data: CreatePalletRequest) => {
    setLoading(true);
    setError(null);
    try {
      const newPallet = await customPalletsApi.createPallet(orderId, data);
      // Обновляем список поддонов после создания
      await fetchOrderPallets(orderId);
      return newPallet;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Ошибка создания поддона';
      setError(errorMessage);
      console.error('Ошибка создания поддона:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchOrderPallets]);

  const deletePallet = useCallback(async (palletId: number, orderId: number) => {
    setLoading(true);
    setError(null);
    try {
      const result = await customPalletsApi.deletePallet(palletId);
      // Обновляем список поддонов после удаления
      await fetchOrderPallets(orderId);
      return result;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Ошибка удаления поддона';
      setError(errorMessage);
      console.error('Ошибка удаления поддона:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchOrderPallets]);

  return {
    pallets,
    palletDetails,
    loading,
    error,
    fetchOrderPallets,
    fetchPalletParts,
    createPallet,
    deletePallet
  };
};
