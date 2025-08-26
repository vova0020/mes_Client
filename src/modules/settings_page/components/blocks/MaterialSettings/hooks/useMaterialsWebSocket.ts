import { useEffect, useRef, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useWebSocketRoom } from '../../../../../../hooks/useWebSocketRoom';

// Ключи для кэширования запросов материалов
export const MATERIALS_QUERY_KEYS = {
  all: ['materials'] as const,
  lists: () => [...MATERIALS_QUERY_KEYS.all, 'list'] as const,
  details: () => [...MATERIALS_QUERY_KEYS.all, 'detail'] as const,
  statistics: () => [...MATERIALS_QUERY_KEYS.all, 'statistics'] as const,
};

// Хук для WebSocket интеграции с данными материалов
export const useMaterialsWebSocket = () => {
  const queryClient = useQueryClient();
  const refreshTimeoutRef = useRef<number | null>(null);
  const REFRESH_DEBOUNCE_MS = 300;
  
  // Получаем комнату для WebSocket подключения
  const room = useMemo(() => 'room:technologist', []);
  
  // Инициализируем WebSocket подключение
  const { 
    socket, 
    isConnected: isWebSocketConnected, 
    error: webSocketError 
  } = useWebSocketRoom({ 
    room,
    autoJoin: true 
  });

  // Функция для обновления всех данных материалов
  const refreshMaterialData = async (status: string) => {
    try {
      if (status !== 'updated') {
        console.warn('Игнорируем неожиданный status from socket для материалов:', status);
        return;
      }

      if (refreshTimeoutRef.current) {
        window.clearTimeout(refreshTimeoutRef.current);
      }

      refreshTimeoutRef.current = window.setTimeout(async () => {
        try {
          // Инвалидируем все запросы материалов для обновления
          queryClient.invalidateQueries({ queryKey: MATERIALS_QUERY_KEYS.all });
          console.log('Данные материалов обновлены (debounced).');
        } catch (err) {
          console.error('Ошибка обновления данных материалов:', err);
        }
      }, REFRESH_DEBOUNCE_MS);
    } catch (err) {
      console.error('Ошибка в refreshMaterialData:', err);
    }
  };

  // Настройка WebSocket обработчиков событий
  useEffect(() => {
    if (!socket || !isWebSocketConnected) return;

    console.log('Настройка WebSocket обработчиков для материалов в комнате:', room);

    // Обработчик события изменения материалов
    const handleMaterialEvent = async (data: { status: string }) => {
      console.log('Получено WebSocket событие material:event - status:', data.status);
      await refreshMaterialData(data.status);
    };

    // Регистрируем обработчик события
    socket.on('material:event', handleMaterialEvent);

    // Cleanup функция
    return () => {
      socket.off('material:event', handleMaterialEvent);

      // очистка debounce таймера при unmount/переподключении
      if (refreshTimeoutRef.current) {
        window.clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
      }
    };
  }, [socket, isWebSocketConnected, room, queryClient]);

  return {
    isWebSocketConnected,
    webSocketError
  };
};