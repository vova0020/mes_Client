import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useMemo } from 'react';
import { BuffersApiService } from '../services/buffersApi';
import { 
  BufferResponse, 
  BufferDetailResponse, 
  BufferCellResponse, 
  BufferStageResponse,
  CreateBufferDto,
  UpdateBufferDto,
  CreateBufferCellDto,
  UpdateBufferCellDto,
  CopyBufferDto,
  CreateBufferStageDto,
  UpdateBufferStagesDto
} from '../types/buffers.types';
import { useWebSocketRoom } from '../../../../../../hooks/useWebSocketRoom';

// Ключи для кэширования запросов
export const BUFFERS_QUERY_KEYS = {
  all: ['buffers'] as const,
  lists: () => [...BUFFERS_QUERY_KEYS.all, 'list'] as const,
  list: (filters?: any) => [...BUFFERS_QUERY_KEYS.lists(), filters] as const,
  details: () => [...BUFFERS_QUERY_KEYS.all, 'detail'] as const,
  detail: (id: number) => [...BUFFERS_QUERY_KEYS.details(), id] as const,
  cells: () => [...BUFFERS_QUERY_KEYS.all, 'cells'] as const,
  bufferCells: (bufferId: number) => [...BUFFERS_QUERY_KEYS.cells(), bufferId] as const,
  cellsStatistics: (bufferId: number) => [...BUFFERS_QUERY_KEYS.cells(), 'statistics', bufferId] as const,
  stages: () => [...BUFFERS_QUERY_KEYS.all, 'stages'] as const,
  bufferStages: (bufferId: number) => [...BUFFERS_QUERY_KEYS.stages(), bufferId] as const,
  availableStages: () => [...BUFFERS_QUERY_KEYS.stages(), 'available'] as const,
  stagesWithBuffers: () => [...BUFFERS_QUERY_KEYS.stages(), 'with-buffers'] as const,
  statistics: () => [...BUFFERS_QUERY_KEYS.all, 'statistics'] as const,
};

// === WebSocket ИНТЕГРАЦИЯ ===

// Хук для WebSocket интеграции с буферными данными
export const useBuffersWebSocket = () => {
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

  // Функция для обновления всех буферных данных
  const refreshBufferData = async (status: string) => {
    try {
      if (status !== 'updated') {
        console.warn('Игнорируем неожиданный status from socket для буферов:', status);
        return;
      }

      if (refreshTimeoutRef.current) {
        window.clearTimeout(refreshTimeoutRef.current);
      }

      refreshTimeoutRef.current = window.setTimeout(async () => {
        try {
          // Инвалидируем все буферные запросы для обновления
          queryClient.invalidateQueries({ queryKey: BUFFERS_QUERY_KEYS.all });
          console.log('Буферные данные обновлены (debounced).');
        } catch (err) {
          console.error('Ошибка обновления буферных данных:', err);
        }
      }, REFRESH_DEBOUNCE_MS);
    } catch (err) {
      console.error('Ошибка в refreshBufferData:', err);
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
          queryClient.invalidateQueries({ queryKey: BUFFERS_QUERY_KEYS.stages() });
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

    console.log('Настройка WebSocket обработчиков для буферов в комнате:', room);

    // Обработчик события изменения настроек буфера
    const handleBufferSettingsEvent = async (data: { status: string }) => {
      console.log('Получено WebSocket событие buffer_settings:event - status:', data.status);
      await refreshBufferData(data.status);
    };

    // Обработчик события изменения этапов
    const handleStageEvent = async (data: { status: string }) => {
      console.log('Получено WebSocket событие stage1:event - status:', data.status);
      await refreshStagesData(data.status);
    };

    // Регистрируем обработчики событий
    socket.on('buffer_settings:event', handleBufferSettingsEvent);
    socket.on('stage1:event', handleStageEvent);

    // Cleanup функция
    return () => {
      socket.off('buffer_settings:event', handleBufferSettingsEvent);
      socket.off('stage1:event', handleStageEvent);

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

// === ОСНОВНЫЕ ХУКИ ДЛЯ БУФЕРОВ ===

// Хук для получения всех буферов
export const useBuffers = () => {
  // Инициализируем WebSocket интеграцию
  const { isWebSocketConnected, webSocketError } = useBuffersWebSocket();
  
  const query = useQuery({
    queryKey: BUFFERS_QUERY_KEYS.lists(),
    queryFn: BuffersApiService.getAllBuffers,
    staleTime: 1000 * 60 * 5, // 5 минут
  });

  return {
    ...query,
    isWebSocketConnected,
    webSocketError
  };
};

// Хук для получения буфера по ID
export const useBuffer = (id: number | undefined) => {
  // Инициализируем WebSocket интеграцию
  const { isWebSocketConnected, webSocketError } = useBuffersWebSocket();
  
  const query = useQuery({
    queryKey: BUFFERS_QUERY_KEYS.detail(id!),
    queryFn: () => BuffersApiService.getBufferById(id!),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });

  return {
    ...query,
    isWebSocketConnected,
    webSocketError
  };
};

// Хук для получения статистики буферов
export const useBuffersStatistics = () => {
  // Инициализируем WebSocket интеграцию
  const { isWebSocketConnected, webSocketError } = useBuffersWebSocket();
  
  const query = useQuery({
    queryKey: BUFFERS_QUERY_KEYS.statistics(),
    queryFn: BuffersApiService.getBuffersStatistics,
    staleTime: 1000 * 60 * 2, // 2 минуты
  });

  return {
    ...query,
    isWebSocketConnected,
    webSocketError
  };
};

// === МУТАЦИИ ДЛЯ БУФЕРОВ ===

// Хук для создания буфера
export const useCreateBuffer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (bufferData: CreateBufferDto) => 
      BuffersApiService.createBuffer(bufferData),
    onSuccess: (newBuffer) => {
      // Обновляем кэш со списком буферов
      queryClient.setQueryData(
        BUFFERS_QUERY_KEYS.lists(),
        (oldData: BufferResponse[] | undefined) => {
          return oldData ? [...oldData, newBuffer] : [newBuffer];
        }
      );
      
      // Инвалидируем связанные запросы
      queryClient.invalidateQueries({ queryKey: BUFFERS_QUERY_KEYS.statistics() });
    },
  });
};

// Хук для обновления буфера
export const useUpdateBuffer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateBufferDto }) =>
      BuffersApiService.updateBuffer(id, data),
    onSuccess: (updatedBuffer) => {
      // Обновляем кэш со списком буферов
      queryClient.setQueryData(
        BUFFERS_QUERY_KEYS.lists(),
        (oldData: BufferResponse[] | undefined) => {
          return oldData?.map(buffer =>
            buffer.bufferId === updatedBuffer.bufferId ? updatedBuffer : buffer
          ) || [];
        }
      );

      // Обновляем кэш с деталями буфера
      queryClient.setQueryData(
        BUFFERS_QUERY_KEYS.detail(updatedBuffer.bufferId),
        updatedBuffer
      );
    },
  });
};

// Хук для удаления буфера
export const useDeleteBuffer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => BuffersApiService.deleteBuffer(id),
    onSuccess: (_, deletedId) => {
      // Удаляем из кэша списка буферов
      queryClient.setQueryData(
        BUFFERS_QUERY_KEYS.lists(),
        (oldData: BufferResponse[] | undefined) => {
          return oldData?.filter(buffer => buffer.bufferId !== deletedId) || [];
        }
      );

      // Удаляем из кэша детали буфера и связанные данные
      queryClient.removeQueries({ queryKey: BUFFERS_QUERY_KEYS.detail(deletedId) });
      queryClient.removeQueries({ queryKey: BUFFERS_QUERY_KEYS.bufferCells(deletedId) });
      queryClient.removeQueries({ queryKey: BUFFERS_QUERY_KEYS.bufferStages(deletedId) });
      queryClient.removeQueries({ queryKey: BUFFERS_QUERY_KEYS.cellsStatistics(deletedId) });
      
      // Инвалидируем связанные запросы
      queryClient.invalidateQueries({ queryKey: BUFFERS_QUERY_KEYS.statistics() });
    },
  });
};

// Хук для копирования буфера
export const useCopyBuffer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: CopyBufferDto }) =>
      BuffersApiService.copyBuffer(id, data),
    onSuccess: (copiedBuffer) => {
      // Добавляем скопированный буфер в кэш
      queryClient.setQueryData(
        BUFFERS_QUERY_KEYS.lists(),
        (oldData: BufferResponse[] | undefined) => {
          return oldData ? [...oldData, copiedBuffer] : [copiedBuffer];
        }
      );
      
      // Инвалидируем статистику
      queryClient.invalidateQueries({ queryKey: BUFFERS_QUERY_KEYS.statistics() });
    },
  });
};

// === ХУКИ ДЛЯ ЯЧЕЕК БУФЕРА ===

// Хук для получения ячеек буфера
export const useBufferCells = (bufferId: number | undefined) => {
  // Инициализируем WebSocket интеграцию
  const { isWebSocketConnected, webSocketError } = useBuffersWebSocket();
  
  const query = useQuery({
    queryKey: BUFFERS_QUERY_KEYS.bufferCells(bufferId!),
    queryFn: () => BuffersApiService.getBufferCells(bufferId!),
    enabled: !!bufferId,
    staleTime: 1000 * 60 * 5,
  });

  return {
    ...query,
    isWebSocketConnected,
    webSocketError
  };
};

// Хук для получения статистики ячеек буфера
export const useBufferCellsStatistics = (bufferId: number | undefined) => {
  // Инициализируем WebSocket интеграцию
  const { isWebSocketConnected, webSocketError } = useBuffersWebSocket();
  
  const query = useQuery({
    queryKey: BUFFERS_QUERY_KEYS.cellsStatistics(bufferId!),
    queryFn: () => BuffersApiService.getBufferCellsStatistics(bufferId!),
    enabled: !!bufferId,
    staleTime: 1000 * 60 * 2,
  });

  return {
    ...query,
    isWebSocketConnected,
    webSocketError
  };
};

// Хук для создания ячейки буфера
export const useCreateBufferCell = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ bufferId, data }: { bufferId: number; data: CreateBufferCellDto }) =>
      BuffersApiService.createBufferCell(bufferId, data),
    onSuccess: (newCell, { bufferId }) => {
      // Обновляем кэш ячеек буфера
      queryClient.setQueryData(
        BUFFERS_QUERY_KEYS.bufferCells(bufferId),
        (oldData: BufferCellResponse[] | undefined) => {
          return oldData ? [...oldData, newCell] : [newCell];
        }
      );
      
      // Инвалидируем связанные запросы
      queryClient.invalidateQueries({ queryKey: BUFFERS_QUERY_KEYS.detail(bufferId) });
      queryClient.invalidateQueries({ queryKey: BUFFERS_QUERY_KEYS.cellsStatistics(bufferId) });
      queryClient.invalidateQueries({ queryKey: BUFFERS_QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: BUFFERS_QUERY_KEYS.statistics() });
    },
  });
};

// Хук для обновления ячейки буфера
export const useUpdateBufferCell = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ cellId, bufferId, data }: { cellId: number; bufferId: number; data: UpdateBufferCellDto }) =>
      BuffersApiService.updateBufferCell(cellId, data),
    onSuccess: (updatedCell, { bufferId }) => {
      // Обновляем кэш ячеек буфера
      queryClient.setQueryData(
        BUFFERS_QUERY_KEYS.bufferCells(bufferId),
        (oldData: BufferCellResponse[] | undefined) => {
          return oldData?.map(cell =>
            cell.cellId === updatedCell.cellId ? updatedCell : cell
          ) || [];
        }
      );
      
      // Инвалидируем связанные запросы
      queryClient.invalidateQueries({ queryKey: BUFFERS_QUERY_KEYS.detail(bufferId) });
      queryClient.invalidateQueries({ queryKey: BUFFERS_QUERY_KEYS.cellsStatistics(bufferId) });
      queryClient.invalidateQueries({ queryKey: BUFFERS_QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: BUFFERS_QUERY_KEYS.statistics() });
    },
  });
};

// Хук для удаления ячейки буфера
export const useDeleteBufferCell = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ cellId, bufferId }: { cellId: number; bufferId: number }) =>
      BuffersApiService.deleteBufferCell(cellId),
    onSuccess: (_, { cellId, bufferId }) => {
      // Удаляем ячейку из кэша
      queryClient.setQueryData(
        BUFFERS_QUERY_KEYS.bufferCells(bufferId),
        (oldData: BufferCellResponse[] | undefined) => {
          return oldData?.filter(cell => cell.cellId !== cellId) || [];
        }
      );
      
      // Инвалидируем связанные запросы
      queryClient.invalidateQueries({ queryKey: BUFFERS_QUERY_KEYS.detail(bufferId) });
      queryClient.invalidateQueries({ queryKey: BUFFERS_QUERY_KEYS.cellsStatistics(bufferId) });
      queryClient.invalidateQueries({ queryKey: BUFFERS_QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: BUFFERS_QUERY_KEYS.statistics() });
    },
  });
};

// === ХУКИ ДЛЯ ЭТАПОВ БУФЕРА ===

// Хук для получения связей буфера с этапами
export const useBufferStages = (bufferId: number | undefined) => {
  // Инициализируем WebSocket интеграцию
  const { isWebSocketConnected, webSocketError } = useBuffersWebSocket();
  
  const query = useQuery({
    queryKey: BUFFERS_QUERY_KEYS.bufferStages(bufferId!),
    queryFn: () => BuffersApiService.getBufferStages(bufferId!),
    enabled: !!bufferId,
    staleTime: 1000 * 60 * 5,
  });

  return {
    ...query,
    isWebSocketConnected,
    webSocketError
  };
};

// Хук для получения доступных этапов
export const useAvailableStages = () => {
  // Инициализируем WebSocket интеграцию
  const { isWebSocketConnected, webSocketError } = useBuffersWebSocket();
  
  const query = useQuery({
    queryKey: BUFFERS_QUERY_KEYS.availableStages(),
    queryFn: BuffersApiService.getAvailableStages,
    staleTime: 1000 * 60 * 10, // 10 минут (данные изменяются редко)
  });

  return {
    ...query,
    isWebSocketConnected,
    webSocketError
  };
};

// Хук для получения этапов с информацией о буферах
export const useStagesWithBuffers = () => {
  // Инициализируем WebSocket интеграцию
  const { isWebSocketConnected, webSocketError } = useBuffersWebSocket();
  
  const query = useQuery({
    queryKey: BUFFERS_QUERY_KEYS.stagesWithBuffers(),
    queryFn: BuffersApiService.getStagesWithBuffers,
    staleTime: 1000 * 60 * 10,
  });

  return {
    ...query,
    isWebSocketConnected,
    webSocketError
  };
};

// Хук для создания связи буфера с этапом
export const useCreateBufferStage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ bufferId, stageData }: { bufferId: number; stageData: CreateBufferStageDto }) =>
      BuffersApiService.createBufferStage(bufferId, stageData),
    onSuccess: (newBufferStage, { bufferId }) => {
      // Обновляем кэш этапов буфера
      queryClient.setQueryData(
        BUFFERS_QUERY_KEYS.bufferStages(bufferId),
        (oldData: BufferStageResponse[] | undefined) => {
          return oldData ? [...oldData, newBufferStage] : [newBufferStage];
        }
      );
      
      // Инвалидируем связанные запросы
      queryClient.invalidateQueries({ queryKey: BUFFERS_QUERY_KEYS.detail(bufferId) });
      queryClient.invalidateQueries({ queryKey: BUFFERS_QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: BUFFERS_QUERY_KEYS.stagesWithBuffers() });
      queryClient.invalidateQueries({ queryKey: BUFFERS_QUERY_KEYS.statistics() });
    },
  });
};

// Хук для обновления связей буфера с этапами
export const useUpdateBufferStages = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ bufferId, stagesData }: { bufferId: number; stagesData: UpdateBufferStagesDto }) =>
      BuffersApiService.updateBufferStages(bufferId, stagesData),
    onSuccess: (updatedStages, { bufferId }) => {
      // Обновляем кэш этапов буфера
      queryClient.setQueryData(
        BUFFERS_QUERY_KEYS.bufferStages(bufferId),
        updatedStages
      );
      
      // Инвалидируем связанные запросы
      queryClient.invalidateQueries({ queryKey: BUFFERS_QUERY_KEYS.detail(bufferId) });
      queryClient.invalidateQueries({ queryKey: BUFFERS_QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: BUFFERS_QUERY_KEYS.stagesWithBuffers() });
      queryClient.invalidateQueries({ queryKey: BUFFERS_QUERY_KEYS.statistics() });
    },
  });
};

// Хук для удаления связи буфера с этапом
export const useDeleteBufferStage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ bufferStageId, bufferId }: { bufferStageId: number; bufferId: number }) =>
      BuffersApiService.deleteBufferStage(bufferStageId),
    onSuccess: (_, { bufferStageId, bufferId }) => {
      // Удаляем этап из кэша
      queryClient.setQueryData(
        BUFFERS_QUERY_KEYS.bufferStages(bufferId),
        (oldData: BufferStageResponse[] | undefined) => {
          return oldData?.filter(stage => stage.bufferStageId !== bufferStageId) || [];
        }
      );
      
      // Инвалидируем связанные запросы
      queryClient.invalidateQueries({ queryKey: BUFFERS_QUERY_KEYS.detail(bufferId) });
      queryClient.invalidateQueries({ queryKey: BUFFERS_QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: BUFFERS_QUERY_KEYS.stagesWithBuffers() });
      queryClient.invalidateQueries({ queryKey: BUFFERS_QUERY_KEYS.statistics() });
    },
  });
};

// === ДОПОЛНИТЕЛЬНЫЕ ХУКИ ===

// Хук для поиска буферов
export const useSearchBuffers = (query: string | undefined) => {
  return useQuery({
    queryKey: [...BUFFERS_QUERY_KEYS.lists(), 'search', query],
    queryFn: () => BuffersApiService.searchBuffers(query!),
    enabled: !!query && query.length > 0,
    staleTime: 1000 * 60 * 1, // 1 минута для поиска
  });
};

// Хук для получения буферов по местоположению
export const useBuffersByLocation = (location: string | undefined) => {
  return useQuery({
    queryKey: [...BUFFERS_QUERY_KEYS.lists(), 'location', location],
    queryFn: () => BuffersApiService.getBuffersByLocation(location!),
    enabled: !!location && location.length > 0,
    staleTime: 1000 * 60 * 5,
  });
};

// Хук для проверки здоровья API
export const useHealthCheck = () => {
  return useQuery({
    queryKey: ['health'],
    queryFn: BuffersApiService.healthCheck,
    staleTime: 1000 * 60 * 1, // 1 минута
    retry: 3,
  });
};