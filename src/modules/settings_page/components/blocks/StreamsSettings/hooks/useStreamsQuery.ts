import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useMemo } from 'react';
import { streamsApi } from '../api/streamsApi';
import { useWebSocketRoom } from '../../../../../../hooks/useWebSocketRoom';
import {
  ProductionLine,
  ProductionLineDetail,
  CreateStreamData,
  UpdateStreamData,
  ProductionStageLevel1,
  ProductionStageLevel2,
  CreateStageLevel1Data,
  UpdateStageLevel1Data,
  CreateStageLevel2Data,
  UpdateStageLevel2Data
} from '../types/streams.types';

// Ключи для кэширования запросов
export const STREAMS_QUERY_KEYS = {
  all: ['streams'] as const,
  streams: () => [...STREAMS_QUERY_KEYS.all, 'streams'] as const,
  streamsList: () => [...STREAMS_QUERY_KEYS.streams(), 'list'] as const,
  streamDetail: (id: number) => [...STREAMS_QUERY_KEYS.streams(), 'detail', id] as const,
  stages: () => [...STREAMS_QUERY_KEYS.all, 'stages'] as const,
  stagesLevel1: () => [...STREAMS_QUERY_KEYS.stages(), 'level1'] as const,
  stagesLevel2: () => [...STREAMS_QUERY_KEYS.stages(), 'level2'] as const,
  materials: () => [...STREAMS_QUERY_KEYS.all, 'materials'] as const,
};

// === WebSocket ИНТЕГРАЦИЯ ===

// Хук для WebSocket интеграции с данными потоков
export const useStreamsWebSocket = () => {
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

  // Функция для обновления данных потоков
  const refreshStreamData = async (status: string) => {
    try {
      if (status !== 'updated') {
        console.warn('Игнорируем неожиданный status from socket для потоков:', status);
        return;
      }

      if (refreshTimeoutRef.current) {
        window.clearTimeout(refreshTimeoutRef.current);
      }

      refreshTimeoutRef.current = window.setTimeout(async () => {
        try {
          // Инвалидируем запросы потоков для обновления
          queryClient.invalidateQueries({ queryKey: STREAMS_QUERY_KEYS.streams() });
          console.log('Данные потоков обновлены (debounced).');
        } catch (err) {
          console.error('Ошибка обновления данных потоков:', err);
        }
      }, REFRESH_DEBOUNCE_MS);
    } catch (err) {
      console.error('Ошибка в refreshStreamData:', err);
    }
  };

  // Функция для обновления данных этапов
  const refreshStagesData = async (status: string) => {
    try {
      if (status !== 'updated') {
        console.warn('Игнорируем неожиданный status from socket для этапов:', status);
        return;
      }

      if (refreshTimeoutRef.current) {
        window.clearTimeout(refreshTimeoutRef.current);
      }

      refreshTimeoutRef.current = window.setTimeout(async () => {
        try {
          // Инвалидируем запросы этапов для обновления
          queryClient.invalidateQueries({ queryKey: STREAMS_QUERY_KEYS.stages() });
          console.log('Данные этапов обновлены (debounced).');
        } catch (err) {
          console.error('Ошибка обновления данных этапов:', err);
        }
      }, REFRESH_DEBOUNCE_MS);
    } catch (err) {
      console.error('Ошибка в refreshStagesData:', err);
    }
  };

  // Настройка WebSocket обработчиков событий
  useEffect(() => {
    if (!socket || !isWebSocketConnected) return;

    console.log('Настройка WebSocket обработчиков для потоков в комнате:', room);

    // Обработчик события изменения потоков
    const handleStreamEvent = async (data: { status: string }) => {
      console.log('Получено WebSocket событие stream:event - status:', data.status);
      await refreshStreamData(data.status);
    };

    // Обработчик события изменения этапов
    const handleStage1Event = async (data: { status: string }) => {
      console.log('Получено WebSocket событие stage1:event - status:', data.status);
      await refreshStagesData(data.status);
    };

    // Обработчик события изменения подэтапов
    const handleStage2Event = async (data: { status: string }) => {
      console.log('Получено WebSocket событие stage2:event - status:', data.status);
      await refreshStagesData(data.status);
    };

    // Регистрируем обработчики событий
    socket.on('stream:event', handleStreamEvent);
    socket.on('stage1:event', handleStage1Event);
    socket.on('stage2:event', handleStage2Event);

    // Cleanup функция
    return () => {
      socket.off('stream:event', handleStreamEvent);
      socket.off('stage1:event', handleStage1Event);
      socket.off('stage2:event', handleStage2Event);

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

// Хуки для потоков

// Получить все потоки
export const useStreams = () => {
  // Инициализируем WebSocket интеграцию
  const { isWebSocketConnected, webSocketError } = useStreamsWebSocket();
  
  const query = useQuery({
    queryKey: STREAMS_QUERY_KEYS.streamsList(),
    queryFn: () => streamsApi.getStreams(),
    staleTime: 1000 * 60 * 5, // 5 минут
  });

  return {
    ...query,
    isWebSocketConnected,
    webSocketError
  };
};

// Получить поток по ID
export const useStream = (id: number | undefined) => {
  // Инициализируем WebSocket интеграцию
  const { isWebSocketConnected, webSocketError } = useStreamsWebSocket();
  
  const query = useQuery({
    queryKey: STREAMS_QUERY_KEYS.streamDetail(id!),
    queryFn: () => streamsApi.getStream(id!),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });

  return {
    ...query,
    isWebSocketConnected,
    webSocketError
  };
};

// Создать поток
export const useCreateStream = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateStreamData) => streamsApi.createStream(data),
    onSuccess: (newStream) => {
      // Обновляем кэш со списком потоков
      queryClient.setQueryData(
        STREAMS_QUERY_KEYS.streamsList(),
        (oldData: ProductionLine[] | undefined) => {
          return oldData ? [...oldData, newStream] : [newStream];
        }
      );
    },
  });
};

// Обновить поток
export const useUpdateStream = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateStreamData }) =>
      streamsApi.updateStream(id, data),
    onSuccess: (updatedStream) => {
      // Обновляем кэш со списком потоков
      queryClient.setQueryData(
        STREAMS_QUERY_KEYS.streamsList(),
        (oldData: ProductionLine[] | undefined) => {
          return oldData?.map(stream =>
            stream.lineId === updatedStream.lineId ? updatedStream : stream
          ) || [];
        }
      );

      // Обновляем кэш с деталями потока
      queryClient.setQueryData(
        STREAMS_QUERY_KEYS.streamDetail(updatedStream.lineId),
        updatedStream
      );
    },
  });
};

// Удалить поток
export const useDeleteStream = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => streamsApi.deleteStream(id),
    onSuccess: (_, deletedId) => {
      // Удаляем из кэша списка потоков
      queryClient.setQueryData(
        STREAMS_QUERY_KEYS.streamsList(),
        (oldData: ProductionLine[] | undefined) => {
          return oldData?.filter(stream => stream.lineId !== deletedId) || [];
        }
      );

      // Удаляем из кэша детали потока
      queryClient.removeQueries({ queryKey: STREAMS_QUERY_KEYS.streamDetail(deletedId) });
    },
  });
};

// Хуки для этапов

// Получить этапы 1 уровня
export const useStagesLevel1 = () => {
  // Инициализируем WebSocket интеграцию
  const { isWebSocketConnected, webSocketError } = useStreamsWebSocket();
  
  const query = useQuery({
    queryKey: STREAMS_QUERY_KEYS.stagesLevel1(),
    queryFn: () => streamsApi.getProductionStagesLevel1(),
    staleTime: 1000 * 60 * 5,
  });

  return {
    ...query,
    isWebSocketConnected,
    webSocketError
  };
};

// Получить этапы 2 уровня
export const useStagesLevel2 = (stageId?: number) => {
  // Инициализируем WebSocket интеграцию
  const { isWebSocketConnected, webSocketError } = useStreamsWebSocket();
  
  const query = useQuery({
    queryKey: [...STREAMS_QUERY_KEYS.stagesLevel2(), stageId || 'all'],
    queryFn: () => streamsApi.getProductionStagesLevel2(stageId ? { stageId } : undefined),
    staleTime: 1000 * 60 * 5,
  });

  return {
    ...query,
    isWebSocketConnected,
    webSocketError
  };
};

// Создать этап 1 уровня
export const useCreateStageLevel1 = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateStageLevel1Data) => streamsApi.createProductionStageLevel1(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STREAMS_QUERY_KEYS.stagesLevel1() });
    },
  });
};

// Обновить этап 1 уровня
export const useUpdateStageLevel1 = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateStageLevel1Data }) =>
      streamsApi.updateProductionStageLevel1(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STREAMS_QUERY_KEYS.stagesLevel1() });
    },
  });
};

// Удалить этап 1 уровня
export const useDeleteStageLevel1 = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => streamsApi.deleteProductionStageLevel1(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STREAMS_QUERY_KEYS.stagesLevel1() });
      queryClient.invalidateQueries({ queryKey: STREAMS_QUERY_KEYS.stagesLevel2() });
    },
  });
};

// Создать этап 2 уровня
export const useCreateStageLevel2 = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateStageLevel2Data) => streamsApi.createProductionStageLevel2(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STREAMS_QUERY_KEYS.stagesLevel2() });
    },
  });
};

// Обновить этап 2 уровня
export const useUpdateStageLevel2 = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateStageLevel2Data }) =>
      streamsApi.updateProductionStageLevel2(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STREAMS_QUERY_KEYS.stagesLevel2() });
    },
  });
};

// Удалить этап 2 уровня
export const useDeleteStageLevel2 = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => streamsApi.deleteProductionStageLevel2(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STREAMS_QUERY_KEYS.stagesLevel2() });
    },
  });
};