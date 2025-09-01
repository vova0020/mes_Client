// src/modules/hooks/masterPage/usePackagingMaster.tsx
import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { fetchPackagingByOrderId, PackagingDataDto } from '../../api/masterPage/ypakServiceMaster';
import { useWebSocketRoom } from '../../../hooks/useWebSocketRoom';

// Получение комнаты из localStorage
const getRoomFromStorage = (): string => {
  // Временно закомментировано - используем фиксированную комнату
  // try {
  //   const userData = localStorage.getItem('user');
  //   if (userData) {
  //     const user = JSON.parse(userData);
  //     if (user.department) {
  //       return `room:${user.department}`;
  //     }
  //     if (user.role === 'master') {
  //       return 'room:masterceh';
  //     }
  //   }
  //   return 'room:masterceh';
  // } catch (error) {
  //   console.error('Ошибка при получении комнаты из localStorage:', error);
  //   return 'room:masterceh';
  // }
  
  // Фиксированная комната (может быть несколько: room1, room2, etc.)
  return 'room:masterceh';
};

const usePackaging = () => {
  const [packagingData, setPackagingData] = useState<PackagingDataDto[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [currentOrderId, setCurrentOrderId] = useState<number | null>(null);
  
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
  const updatePackagingSmartly = useCallback((newPackaging: PackagingDataDto[]) => {
    setPackagingData(currentPackaging => {
      if (currentPackaging.length === 0) {
        return newPackaging;
      }

      const currentPackagingMap = new Map(currentPackaging.map(p => [p.id, p]));
      const updatedPackaging: PackagingDataDto[] = [];
      let hasChanges = false;

      newPackaging.forEach(newPack => {
        const currentPack = currentPackagingMap.get(newPack.id);
        
        if (!currentPack) {
          updatedPackaging.push(newPack);
          hasChanges = true;
        } else {
          const packChanged = JSON.stringify(currentPack) !== JSON.stringify(newPack);

          if (packChanged) {
            updatedPackaging.push(newPack);
            hasChanges = true;
          } else {
            updatedPackaging.push(currentPack);
          }
        }
      });

      const newPackIds = new Set(newPackaging.map(p => p.id));
      const removedPacks = currentPackaging.filter(p => !newPackIds.has(p.id));
      if (removedPacks.length > 0) {
        hasChanges = true;
      }

      return hasChanges ? updatedPackaging : currentPackaging;
    });
  }, []);

  // Функция загрузки упаковок по ID заказа
  const fetchPackaging = useCallback(async (orderId: number | null) => {
    if (orderId === null) {
      setPackagingData([]);
      setCurrentOrderId(null);
      return;
    }

    setLoading(true);
    setError(null);
    setCurrentOrderId(orderId);
    
    try {
      const data = await fetchPackagingByOrderId(orderId);
      // Сортируем по возрастанию ID
      const sortedData = data.sort((a, b) => a.id - b.id);
      updatePackagingSmartly(sortedData);
    } catch (err: any) {
      console.error("Ошибка при загрузке паковок:", err);
      setError(err);
      setPackagingData([]);
    } finally {
      setLoading(false);
    }
  }, [updatePackagingSmartly]);

  // Функция для обновления данных упаковок
  const refreshPackagingData = useCallback(async (status: string) => {
    try {
      if (status !== 'updated') {
        console.warn('Игнорируем неожиданный status from socket:', status);
        return;
      }

      // Проверяем, что есть текущий заказ и данные упаковок уже загружены
      if (currentOrderId === null || packagingData.length === 0) {
        console.log('Пропускаем обновление: нет активного заказа или данных упаковок');
        return;
      }

      if (refreshTimeoutRef.current) {
        window.clearTimeout(refreshTimeoutRef.current);
      }

      refreshTimeoutRef.current = window.setTimeout(async () => {
        try {
          const data = await fetchPackagingByOrderId(currentOrderId);
          const sortedData = data.sort((a, b) => a.id - b.id);
          updatePackagingSmartly(sortedData);
          console.log(`Данные упаковок обновлены для заказа ${currentOrderId} (debounced).`);
        } catch (err) {
          console.error('Ошибка обновления данных упаковок:', err);
        }
      }, REFRESH_DEBOUNCE_MS);
    } catch (err) {
      console.error('Ошибка в refreshPackagingData:', err);
    }
  }, [currentOrderId, packagingData.length, updatePackagingSmartly]);

  // Настройка WebSocket обработчиков событий
  useEffect(() => {
    if (!socket || !isWebSocketConnected) return;

    console.log('Настройка WebSocket обработчиков для упаковок в комнате:', room);

    const handlePackagingEvent = async (data: { status: string }) => {
      console.log('Получено WebSocket событие для упаковок - status:', data.status, 'currentOrderId:', currentOrderId);
      // Обновляем данные только если модальное окно открыто и есть активный заказ
      if (currentOrderId !== null && packagingData.length > 0) {
        await refreshPackagingData(data.status);
      }
    };

    socket.on('package:event', handlePackagingEvent);

    return () => {
      socket.off('package:event', handlePackagingEvent);
      if (refreshTimeoutRef.current) {
        window.clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
      }
    };
  }, [socket, isWebSocketConnected, room, refreshPackagingData]);

  // Функция для очистки данных
  const clearPackaging = useCallback(() => {
    setPackagingData([]);
    setError(null);
    setLoading(false);
    setCurrentOrderId(null);
  }, []);

  return {
    packagingData,
    loading,
    error,
    isWebSocketConnected,
    webSocketError,
    fetchPackaging,
    clearPackaging,
    refreshPackagingData
  };
};

export default usePackaging;