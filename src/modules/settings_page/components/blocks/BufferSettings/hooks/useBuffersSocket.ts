import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSocket } from '../../../../../../contexts/SocketContext';
import { BUFFERS_QUERY_KEYS } from './useBuffersQuery';
import { 
  BufferResponse, 
  BufferDetailResponse, 
  BufferCellResponse, 
  BufferStageResponse 
} from '../types/buffers.types';

interface BufferSocketEvents {
  // События буферов
  bufferCreated: {
    buffer: BufferDetailResponse;
    timestamp: string;
  };
  bufferUpdated: {
    buffer: BufferDetailResponse;
    changes: {
      name: boolean;
      location: boolean;
    };
    timestamp: string;
  };
  bufferDeleted: {
    bufferId: number;
    bufferName: string;
    timestamp: string;
  };
  bufferCopied: {
    originalBuffer: BufferDetailResponse;
    copiedBuffer: BufferDetailResponse;
    copyOptions: {
      copyCells: boolean;
      copyStages: boolean;
    };
    timestamp: string;
  };
  
  // События ячеек буфера
  bufferCellCreated: {
    bufferId: number;
    bufferName: string;
    bufferCell: BufferCellResponse;
    timestamp: string;
  };
  bufferCellUpdated: {
    bufferId: number;
    bufferName: string;
    bufferCell: BufferCellResponse;
    changes: {
      cellCode: boolean;
      status: boolean;
    };
    timestamp: string;
  };
  bufferCellDeleted: {
    cellId: number;
    bufferId: number;
    bufferName: string;
    cellCode: string;
    timestamp: string;
  };
  
  // События этапов буфера
  bufferStageCreated: {
    bufferId: number;
    bufferName: string;
    bufferStage: BufferStageResponse;
    timestamp: string;
  };
  bufferStagesUpdated: {
    bufferId: number;
    bufferName: string;
    bufferStages: BufferStageResponse[];
    timestamp: string;
  };
  bufferStageDeleted: {
    bufferStageId: number;
    bufferId: number;
    bufferName: string;
    stageId: number;
    stageName: string;
    timestamp: string;
  };
}

export const useBuffersSocket = () => {
  const { socket, isConnected } = useSocket();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!socket || !isConnected) return;

    console.log('[BuffersSocket] Подключение к комнате буферов...');
    
    // Присоединяемся к комнате буферов согласно новой документации
    socket.emit('joinRoom', { room: 'settings-buffers' });

    // === ОБРАБОТЧИКИ СОБЫТИЙ БУФЕРОВ ===

    // Обработчик создания буфера
    const handleBufferCreated = (data: BufferSocketEvents['bufferCreated']) => {
      console.log('[BuffersSocket] Буфер создан:', data);
      
      // Добавляем новый буфер в кэш
      queryClient.setQueryData(
        BUFFERS_QUERY_KEYS.lists(),
        (oldData: BufferResponse[] | undefined) => {
          return oldData ? [...oldData, data.buffer] : [data.buffer];
        }
      );
      
      // Инвалидируем статистику
      queryClient.invalidateQueries({ queryKey: BUFFERS_QUERY_KEYS.statistics() });
    };

    // Обработчик обновления буфера
    const handleBufferUpdated = (data: BufferSocketEvents['bufferUpdated']) => {
      console.log('[BuffersSocket] Буфер обновлен:', data);
      
      // Обновляем буфер в списке
      queryClient.setQueryData(
        BUFFERS_QUERY_KEYS.lists(),
        (oldData: BufferResponse[] | undefined) => {
          return oldData?.map(buffer =>
            buffer.bufferId === data.buffer.bufferId ? data.buffer : buffer
          ) || [];
        }
      );

      // Обновляем детали буфера
      queryClient.setQueryData(
        BUFFERS_QUERY_KEYS.detail(data.buffer.bufferId),
        data.buffer
      );
    };

    // Обработчик удаления буфера
    const handleBufferDeleted = (data: BufferSocketEvents['bufferDeleted']) => {
      console.log('[BuffersSocket] Буфер удален:', data);
      
      // Удаляем буфер из списка
      queryClient.setQueryData(
        BUFFERS_QUERY_KEYS.lists(),
        (oldData: BufferResponse[] | undefined) => {
          return oldData?.filter(buffer => buffer.bufferId !== data.bufferId) || [];
        }
      );

      // Удаляем из кэша детали буфера и связанные данные
      queryClient.removeQueries({ queryKey: BUFFERS_QUERY_KEYS.detail(data.bufferId) });
      queryClient.removeQueries({ queryKey: BUFFERS_QUERY_KEYS.bufferCells(data.bufferId) });
      queryClient.removeQueries({ queryKey: BUFFERS_QUERY_KEYS.bufferStages(data.bufferId) });
      queryClient.removeQueries({ queryKey: BUFFERS_QUERY_KEYS.cellsStatistics(data.bufferId) });
      
      // Инвалидируем статистику
      queryClient.invalidateQueries({ queryKey: BUFFERS_QUERY_KEYS.statistics() });
    };

    // Обработчик копирования буфера
    const handleBufferCopied = (data: BufferSocketEvents['bufferCopied']) => {
      console.log('[BuffersSocket] Буфер скопирован:', data);
      
      // Добавляем скопированный буфер в кэш
      queryClient.setQueryData(
        BUFFERS_QUERY_KEYS.lists(),
        (oldData: BufferResponse[] | undefined) => {
          return oldData ? [...oldData, data.copiedBuffer] : [data.copiedBuffer];
        }
      );
      
      // Инвалидируем статистику
      queryClient.invalidateQueries({ queryKey: BUFFERS_QUERY_KEYS.statistics() });
    };

    // === ОБРАБОТЧИКИ СОБЫТИЙ ЯЧЕЕК БУФЕРА ===

    // Обработчик создания ячейки буфера
    const handleBufferCellCreated = (data: BufferSocketEvents['bufferCellCreated']) => {
      console.log('[BuffersSocket] Ячейка буфера создана:', data);
      
      // Добавляем ячейку в кэш
      queryClient.setQueryData(
        BUFFERS_QUERY_KEYS.bufferCells(data.bufferId),
        (oldData: BufferCellResponse[] | undefined) => {
          return oldData ? [...oldData, data.bufferCell] : [data.bufferCell];
        }
      );
      
      // Инвалидируем связанные запросы
      queryClient.invalidateQueries({ queryKey: BUFFERS_QUERY_KEYS.detail(data.bufferId) });
      queryClient.invalidateQueries({ queryKey: BUFFERS_QUERY_KEYS.cellsStatistics(data.bufferId) });
      queryClient.invalidateQueries({ queryKey: BUFFERS_QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: BUFFERS_QUERY_KEYS.statistics() });
    };

    // Обработчик обновления ячейки буфера
    const handleBufferCellUpdated = (data: BufferSocketEvents['bufferCellUpdated']) => {
      console.log('[BuffersSocket] Ячейка буфера обновлена:', data);
      
      // Обновляем ячейку в кэше
      queryClient.setQueryData(
        BUFFERS_QUERY_KEYS.bufferCells(data.bufferId),
        (oldData: BufferCellResponse[] | undefined) => {
          return oldData?.map(cell =>
            cell.cellId === data.bufferCell.cellId ? data.bufferCell : cell
          ) || [];
        }
      );
      
      // Инвалидируем связанные запросы
      queryClient.invalidateQueries({ queryKey: BUFFERS_QUERY_KEYS.detail(data.bufferId) });
      queryClient.invalidateQueries({ queryKey: BUFFERS_QUERY_KEYS.cellsStatistics(data.bufferId) });
      queryClient.invalidateQueries({ queryKey: BUFFERS_QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: BUFFERS_QUERY_KEYS.statistics() });
    };

    // Обработчик удаления ячейки буфера
    const handleBufferCellDeleted = (data: BufferSocketEvents['bufferCellDeleted']) => {
      console.log('[BuffersSocket] Ячейка буфера удалена:', data);
      
      // Удаляем ячейку из кэша
      queryClient.setQueryData(
        BUFFERS_QUERY_KEYS.bufferCells(data.bufferId),
        (oldData: BufferCellResponse[] | undefined) => {
          return oldData?.filter(cell => cell.cellId !== data.cellId) || [];
        }
      );
      
      // Инвалидируем связанные запросы
      queryClient.invalidateQueries({ queryKey: BUFFERS_QUERY_KEYS.detail(data.bufferId) });
      queryClient.invalidateQueries({ queryKey: BUFFERS_QUERY_KEYS.cellsStatistics(data.bufferId) });
      queryClient.invalidateQueries({ queryKey: BUFFERS_QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: BUFFERS_QUERY_KEYS.statistics() });
    };

    // === ОБРАБОТЧИКИ СОБЫТИЙ ЭТАПОВ БУФЕРА ===

    // Обработчик создания связи буфера с этапом
    const handleBufferStageCreated = (data: BufferSocketEvents['bufferStageCreated']) => {
      console.log('[BuffersSocket] Связь буфера с этапом создана:', data);
      
      // Добавляем этап в кэш
      queryClient.setQueryData(
        BUFFERS_QUERY_KEYS.bufferStages(data.bufferId),
        (oldData: BufferStageResponse[] | undefined) => {
          return oldData ? [...oldData, data.bufferStage] : [data.bufferStage];
        }
      );
      
      // Инвалидируем связанные запросы
      queryClient.invalidateQueries({ queryKey: BUFFERS_QUERY_KEYS.detail(data.bufferId) });
      queryClient.invalidateQueries({ queryKey: BUFFERS_QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: BUFFERS_QUERY_KEYS.stagesWithBuffers() });
      queryClient.invalidateQueries({ queryKey: BUFFERS_QUERY_KEYS.statistics() });
    };

    // Обработчик обновления связей буфера с этапами
    const handleBufferStagesUpdated = (data: BufferSocketEvents['bufferStagesUpdated']) => {
      console.log('[BuffersSocket] Связи буфера с этапами обновлены:', data);
      
      // Обновляем этапы в кэше
      queryClient.setQueryData(
        BUFFERS_QUERY_KEYS.bufferStages(data.bufferId),
        data.bufferStages
      );
      
      // Инвалидируем связанные запросы
      queryClient.invalidateQueries({ queryKey: BUFFERS_QUERY_KEYS.detail(data.bufferId) });
      queryClient.invalidateQueries({ queryKey: BUFFERS_QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: BUFFERS_QUERY_KEYS.stagesWithBuffers() });
      queryClient.invalidateQueries({ queryKey: BUFFERS_QUERY_KEYS.statistics() });
    };

    // Обработчик удаления связи буфера с этапом
    const handleBufferStageDeleted = (data: BufferSocketEvents['bufferStageDeleted']) => {
      console.log('[BuffersSocket] Связь буфера с этапом удалена:', data);
      
      // Удаляем этап из кэша
      queryClient.setQueryData(
        BUFFERS_QUERY_KEYS.bufferStages(data.bufferId),
        (oldData: BufferStageResponse[] | undefined) => {
          return oldData?.filter(stage => stage.bufferStageId !== data.bufferStageId) || [];
        }
      );
      
      // Инвалидируем связанные запросы
      queryClient.invalidateQueries({ queryKey: BUFFERS_QUERY_KEYS.detail(data.bufferId) });
      queryClient.invalidateQueries({ queryKey: BUFFERS_QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: BUFFERS_QUERY_KEYS.stagesWithBuffers() });
      queryClient.invalidateQueries({ queryKey: BUFFERS_QUERY_KEYS.statistics() });
    };

    // Регистрируем обработчики событий
    socket.on('bufferCreated', handleBufferCreated);
    socket.on('bufferUpdated', handleBufferUpdated);
    socket.on('bufferDeleted', handleBufferDeleted);
    socket.on('bufferCopied', handleBufferCopied);
    socket.on('bufferCellCreated', handleBufferCellCreated);
    socket.on('bufferCellUpdated', handleBufferCellUpdated);
    socket.on('bufferCellDeleted', handleBufferCellDeleted);
    socket.on('bufferStageCreated', handleBufferStageCreated);
    socket.on('bufferStagesUpdated', handleBufferStagesUpdated);
    socket.on('bufferStageDeleted', handleBufferStageDeleted);

    // Очистка при размонтировании компонента
    return () => {
      console.log('[BuffersSocket] Отключение от событий буферов...');
      
      socket.off('bufferCreated', handleBufferCreated);
      socket.off('bufferUpdated', handleBufferUpdated);
      socket.off('bufferDeleted', handleBufferDeleted);
      socket.off('bufferCopied', handleBufferCopied);
      socket.off('bufferCellCreated', handleBufferCellCreated);
      socket.off('bufferCellUpdated', handleBufferCellUpdated);
      socket.off('bufferCellDeleted', handleBufferCellDeleted);
      socket.off('bufferStageCreated', handleBufferStageCreated);
      socket.off('bufferStagesUpdated', handleBufferStagesUpdated);
      socket.off('bufferStageDeleted', handleBufferStageDeleted);
    };
  }, [socket, isConnected, queryClient]);

  return {
    isConnected,
  };
};