import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { packagingApi, PackageDto, PackagesResponse, PackagingQueryParams } from '../../api/ypakMasterApi/packagingApi';
import { useWebSocketRoom } from '../../../hooks/useWebSocketRoom';

// Получение комнаты из localStorage
const getRoomFromStorage = (): string => {
  return 'room:masterypack';
};

const usePackaging = () => {
  const [packages, setPackages] = useState<PackageDto[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  
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

  // Функция для умного обновления массива упаковок
  const updatePackagesSmartly = useCallback((newPackages: PackageDto[]) => {
    setPackages(currentPackages => {
      if (currentPackages.length === 0) {
        return newPackages;
      }

      const currentPackagesMap = new Map(currentPackages.map(p => [p.id, p]));
      const updatedPackages: PackageDto[] = [];
      let hasChanges = false;

      newPackages.forEach(newPackage => {
        const currentPackage = currentPackagesMap.get(newPackage.id);
        
        if (!currentPackage) {
          updatedPackages.push(newPackage);
          hasChanges = true;
        } else {
          const packageChanged = JSON.stringify(currentPackage) !== JSON.stringify(newPackage);

          if (packageChanged) {
            updatedPackages.push(newPackage);
            hasChanges = true;
          } else {
            updatedPackages.push(currentPackage);
          }
        }
      });

      const newPackageIds = new Set(newPackages.map(p => p.id));
      const removedPackages = currentPackages.filter(p => !newPackageIds.has(p.id));
      if (removedPackages.length > 0) {
        hasChanges = true;
      }

      return hasChanges ? updatedPackages : currentPackages;
    });
  }, []);

  // Функция для получения списка упаковок с фильтрами
  const fetchPackages = useCallback(async (params?: PackagingQueryParams) => {
    setLoading(true);
    setError(null);

    try {
      const response = await packagingApi.getPackages(params);
      updatePackagesSmartly(response);
    } catch (err: any) {
      console.error("Ошибка при получении упаковок:", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [updatePackagesSmartly]);

  // Функция для получения упаковок по ID заказа
  const fetchPackagesByOrderId = useCallback(async (orderId: string | number) => {
    setLoading(true);
    setError(null);

    try {
      const response = await packagingApi.getPackagesByOrderId(orderId);
      updatePackagesSmartly(response);
    } catch (err: any) {
      console.error(`Ошибка при получении упаковок для заказа ${orderId}:`, err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [updatePackagesSmartly]);

  // Функция для получения конкретной упаковки по ID
  const fetchPackageById = useCallback(async (packageId: string | number): Promise<PackageDto | null> => {
    setLoading(true);
    setError(null);

    try {
      const packageData = await packagingApi.getPackageById(packageId);
      return packageData;
    } catch (err: any) {
      console.error(`Ошибка при получении упаковки ${packageId}:`, err);
      setError(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Функция для обновления данных упаковок
  const refreshPackagesData = useCallback(async (status: string) => {
    try {
      if (status !== 'updated') {
        console.warn('Игнорируем неожиданный status from socket:', status);
        return;
      }

      if (refreshTimeoutRef.current) {
        window.clearTimeout(refreshTimeoutRef.current);
      }

      refreshTimeoutRef.current = window.setTimeout(async () => {
        try {
          const data = await packagingApi.getPackages();
          updatePackagesSmartly(data);
          console.log(`Данные упаковок обновлены (debounced).`);
        } catch (err) {
          console.error('Ошибка обновления данных упаковок:', err);
        }
      }, REFRESH_DEBOUNCE_MS);
    } catch (err) {
      console.error('Ошибка в refreshPackagesData:', err);
    }
  }, [updatePackagesSmartly]);

  // WebSocket обновление отключено - используйте refreshPackagesData вручную

  // Функция для очистки данных
  const clearPackages = useCallback(() => {
    setPackages([]);
    setError(null);
    setLoading(false);
  }, []);

  return {
    packages,
    loading,
    error,
    isWebSocketConnected,
    webSocketError: webSocketError as string | null,
    fetchPackages,
    fetchPackagesByOrderId,
    fetchPackageById,
    clearPackages,
    refreshPackagesData
  };
};

export default usePackaging;