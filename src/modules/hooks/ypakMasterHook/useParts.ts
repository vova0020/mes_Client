import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { 
  partsApi, 
  PartDto, 
  PartsResponse, 
  PartsQueryParams, 
  PartsStatisticsDto,
  PackageInfoDto
} from '../../api/ypakMasterApi/partsApi';
import { useWebSocketRoom } from '../../../hooks/useWebSocketRoom';

// Получение комнаты из localStorage
const getRoomFromStorage = (): string => {
  return 'room:masterypack';
};

const useParts = () => {
  const [parts, setParts] = useState<PartDto[]>([]);
  const [packageInfo, setPackageInfo] = useState<PackageInfoDto>();
  const [partsCount, setPartsCount] = useState<number>(0);
  const [pagination, setPagination] = useState<PartsResponse['pagination']>();
  const [statistics, setStatistics] = useState<PartsStatisticsDto>();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [currentPackageId, setCurrentPackageId] = useState<string | number | null>(null);
  
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

  // Функция для умного обновления массива деталей
  const updatePartsSmartly = useCallback((response: PartsResponse) => {
    setParts(currentParts => {
      if (currentParts.length === 0) {
        return response.parts;
      }

      const currentPartsMap = new Map(currentParts.map(p => [p.partId, p]));
      const updatedParts: PartDto[] = [];
      let hasChanges = false;

      response.parts.forEach(newPart => {
        const currentPart = currentPartsMap.get(newPart.partId);
        
        if (!currentPart) {
          updatedParts.push(newPart);
          hasChanges = true;
        } else {
          const partChanged = JSON.stringify(currentPart) !== JSON.stringify(newPart);

          if (partChanged) {
            updatedParts.push(newPart);
            hasChanges = true;
          } else {
            updatedParts.push(currentPart);
          }
        }
      });

      const newPartIds = new Set(response.parts.map(p => p.partId));
      const removedParts = currentParts.filter(p => !newPartIds.has(p.partId));
      if (removedParts.length > 0) {
        hasChanges = true;
      }

      return hasChanges ? updatedParts : currentParts;
    });
    
    setPackageInfo(response.packageInfo);
    setPartsCount(response.partsCount);
    setPagination(response.pagination);
  }, []);

  // Функция для получения деталей упаковки
  const fetchPartsByPackageId = useCallback(async (
    packageId: string | number, 
    params?: Omit<PartsQueryParams, 'packageId'>
  ) => {
    setLoading(true);
    setError(null);
    setCurrentPackageId(packageId);

    try {
      const response = await partsApi.getPartsByPackageId(packageId, params);
      updatePartsSmartly(response);
    } catch (err: any) {
      console.error(`Ошибка при получении деталей для упаковки ${packageId}:`, err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [updatePartsSmartly]);

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
    } catch (err: any) {
      console.error(`Ошибка при получении детали ${partId} из упаковки ${packageId}:`, err);
      setError(err);
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
    } catch (err: any) {
      console.error(`Ошибка при получении статистики деталей для упаковки ${packageId}:`, err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Функция для обновления данных деталей
  const refreshPartsData = useCallback(async (status: string) => {
    try {
      if (status !== 'updated') {
        console.warn('Игнорируем неожиданный status from socket:', status);
        return;
      }

      if (currentPackageId === null) return;

      if (refreshTimeoutRef.current) {
        window.clearTimeout(refreshTimeoutRef.current);
      }

      refreshTimeoutRef.current = window.setTimeout(async () => {
        try {
          const data = await partsApi.getPartsByPackageId(currentPackageId);
          updatePartsSmartly(data);
          console.log(`Данные деталей обновлены (debounced).`);
        } catch (err) {
          console.error('Ошибка обновления данных деталей:', err);
        }
      }, REFRESH_DEBOUNCE_MS);
    } catch (err) {
      console.error('Ошибка в refreshPartsData:', err);
    }
  }, [currentPackageId, updatePartsSmartly]);

  // Настройка WebSocket обработчиков событий
  useEffect(() => {
    if (!socket || !isWebSocketConnected) return;

    console.log('Настройка WebSocket обработчиков для деталей в комнате:', room);

    const handlePartEvent = async (data: { status: string }) => {
      console.log('Получено WebSocket событие для деталей - status:', data.status);
      await refreshPartsData(data.status);
    };

    socket.on('detail:event', handlePartEvent);

    return () => {
      socket.off('detail:event', handlePartEvent);
      if (refreshTimeoutRef.current) {
        window.clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
      }
    };
  }, [socket, isWebSocketConnected, room, refreshPartsData]);

  // Функция для очистки данных о деталях
  const clearParts = useCallback(() => {
    setParts([]);
    setPackageInfo(undefined);
    setPartsCount(0);
    setPagination(undefined);
    setStatistics(undefined);
    setError(null);
    setLoading(false);
    setCurrentPackageId(null);
  }, []);

  return {
    parts,
    packageInfo,
    partsCount,
    pagination,
    statistics,
    loading,
    error,
    isWebSocketConnected,
    webSocketError: webSocketError as string | null,
    fetchPartsByPackageId,
    fetchPartFromPackage,
    fetchPartsStatistics,
    clearParts,
    refreshPartsData
  };
};

export default useParts;