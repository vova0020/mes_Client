import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { 
  palletsApi, 
  PalletDto, 
  PalletsResponse, 
  PalletsQueryParams, 
  PalletsStatisticsDto,
  PartInfoDto
} from '../../api/ypakMasterApi/palletsApi';
import { useWebSocketRoom } from '../../../hooks/useWebSocketRoom';

// Получение комнаты из localStorage
const getRoomFromStorage = (): string => {
  return 'room:masterypack';
};

const usePallets = () => {
  const [pallets, setPallets] = useState<PalletDto[]>([]);
  const [partInfo, setPartInfo] = useState<PartInfoDto>();
  const [palletsCount, setPalletsCount] = useState<number>(0);
  const [pagination, setPagination] = useState<PalletsResponse['pagination']>();
  const [statistics, setStatistics] = useState<PalletsStatisticsDto>();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [currentPartId, setCurrentPartId] = useState<string | number | null>(null);
  const [currentParams, setCurrentParams] = useState<PalletsQueryParams | undefined>(undefined);
  
  // debounce refs
  const refreshTimeoutRef = useRef<number | null>(null);
  const REFRESH_DEBOUNCE_MS = 300;
  
  // Получаем комнату для WebSocket подключения
  const room = useMemo(() => getRoomFromStorage(), []);
  
  // Инициализируем WebSocket подключение
  const { 
    socket, 
    isConnected: isWebSocketConnected, 
    error: webSocketError 
  } = useWebSocketRoom({ 
    room,
    autoJoin: true 
  });

  // Функция для умного обновления массива поддонов
  const updatePalletsSmartly = useCallback((response: PalletsResponse) => {
    setPallets(currentPallets => {
      if (currentPallets.length === 0) {
        return response.pallets;
      }

      const currentPalletsMap = new Map(currentPallets.map(p => [p.palletId, p]));
      const updatedPallets: PalletDto[] = [];
      let hasChanges = false;

      response.pallets.forEach(newPallet => {
        const currentPallet = currentPalletsMap.get(newPallet.palletId);
        
        if (!currentPallet) {
          updatedPallets.push(newPallet);
          hasChanges = true;
        } else {
          const palletChanged = JSON.stringify(currentPallet) !== JSON.stringify(newPallet);

          if (palletChanged) {
            updatedPallets.push(newPallet);
            hasChanges = true;
          } else {
            updatedPallets.push(currentPallet);
          }
        }
      });

      const newPalletIds = new Set(response.pallets.map(p => p.palletId));
      const removedPallets = currentPallets.filter(p => !newPalletIds.has(p.palletId));
      if (removedPallets.length > 0) {
        hasChanges = true;
      }

      return hasChanges ? updatedPallets : currentPallets;
    });
    
    setPartInfo(response.partInfo);
    setPalletsCount(response.palletsCount);
    setPagination(response.pagination);
  }, []);

  // Функция для получения поддонов детали
  const fetchPalletsByPartId = useCallback(async (
    partId: string | number, 
    params?: PalletsQueryParams
  ) => {
    setLoading(true);
    setError(null);
    setCurrentPartId(partId);
    setCurrentParams(params);

    try {
      const response = await palletsApi.getPalletsByPartId(partId, params);
      updatePalletsSmartly(response);
    } catch (err: any) {
      console.error(`Ошибка при получении поддонов для детали ${partId}:`, err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [updatePalletsSmartly]);

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
    } catch (err: any) {
      console.error(`Ошибка при получении поддона ${palletId} для детали ${partId}:`, err);
      setError(err);
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
    } catch (err: any) {
      console.error(`Ошибка при получении статистики поддонов для детали ${partId}:`, err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Функция для обновления данных поддонов
  const refreshPalletsData = useCallback(async (status: string) => {
    try {
      if (status !== 'updated') {
        console.warn('Игнорируем неожиданный status from socket:', status);
        return;
      }

      if (currentPartId === null) return;

      if (refreshTimeoutRef.current) {
        window.clearTimeout(refreshTimeoutRef.current);
      }

      refreshTimeoutRef.current = window.setTimeout(async () => {
        try {
          const data = await palletsApi.getPalletsByPartId(currentPartId, currentParams);
          updatePalletsSmartly(data);
          console.log(`Данные поддонов обновлены (debounced).`);
        } catch (err) {
          console.error('Ошибка обновления данных поддонов:', err);
        }
      }, REFRESH_DEBOUNCE_MS);
    } catch (err) {
      console.error('Ошибка в refreshPalletsData:', err);
    }
  }, [currentPartId, currentParams, updatePalletsSmartly]);

  // Настройка WebSocket обработчиков событий
  useEffect(() => {
    if (!socket || !isWebSocketConnected) return;

    console.log('Настройка WebSocket обработчиков для поддонов в комнате:', room);

    const handlePalletEvent = async (data: { status: string }) => {
      console.log('Получено WebSocket событие для поддонов - status:', data.status);
      await refreshPalletsData(data.status);
    };

    socket.on('pallet:event', handlePalletEvent);

    return () => {
      socket.off('pallet:event', handlePalletEvent);
      if (refreshTimeoutRef.current) {
        window.clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
      }
    };
  }, [socket, isWebSocketConnected, room, refreshPalletsData]);

  // Функция для очистки данных о поддонах
  const clearPallets = useCallback(() => {
    setPallets([]);
    setPartInfo(undefined);
    setPalletsCount(0);
    setPagination(undefined);
    setStatistics(undefined);
    setError(null);
    setLoading(false);
    setCurrentPartId(null);
    setCurrentParams(undefined);
  }, []);

  return {
    pallets,
    partInfo,
    palletsCount,
    pagination,
    statistics,
    loading,
    error,
    isWebSocketConnected,
    webSocketError: webSocketError as string | null,
    fetchPalletsByPartId,
    fetchPalletByPartAndPalletId,
    fetchPalletsStatistics,
    clearPallets,
    refreshPalletsData
  };
};

export default usePallets;