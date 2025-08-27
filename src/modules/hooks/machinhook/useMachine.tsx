import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { machineApi, Machine, getLocalMachineIds, MachineStatus, DefectPalletPartsDto, DefectPartsResponse } from '../../api/machineApi/machineApi';
import { socketService, SocketEvent } from '../../api/socket/socketService';
import { useWebSocketRoom } from '../../../hooks/useWebSocketRoom';

// Типы состояний загрузки
export type LoadingState = 'loading' | 'success' | 'error';

// Тип для результата хука
interface UseMachineResult {
  machine: Machine | null;
  loading: LoadingState;
  error: Error | null;
  isActive: boolean;
  isInactive: boolean;
  isBroken: boolean;
  isOnMaintenance: boolean;
  refetch: () => Promise<void>;
  forceRefresh: () => void;
  machineId: number | undefined;
  segmentId: number | null | undefined;
  changeStatus: (status: MachineStatus) => Promise<void>;
  isSocketConnected: boolean;
  isWebSocketConnected: boolean;
  webSocketError: string | null;
  refreshMachineData: (status: string) => Promise<void>;
  defectPalletParts: (defectData: DefectPalletPartsDto) => Promise<DefectPartsResponse>;
}

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
  return 'room:machines';
};

/**
 * Хук для работы с данными о станке, с поддержкой Socket.IO
 * @param machineId - ID станка (если не указан, будет взят из localStorage)
 * @returns Объект с данными и состояниями станка
 */
export const useMachine = (machineId?: number): UseMachineResult => {
  const [machine, setMachine] = useState<Machine | null>(null);
  const [loading, setLoading] = useState<LoadingState>('loading');
  const [error, setError] = useState<Error | null>(null);
  const [effectiveId, setEffectiveId] = useState<number | undefined>(machineId);
  const [isSocketConnected, setIsSocketConnected] = useState<boolean>(false);
  
  // Используем ref для отслеживания актуального состояния в обработчиках событий
  const machineRef = useRef<Machine | null>(null);
  const loadingRef = useRef<LoadingState>('loading');
  
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
  
  // При изменении machine обновляем ref
  useEffect(() => {
    machineRef.current = machine;
  }, [machine]);
  
  // При изменении loading обновляем ref
  useEffect(() => {
    loadingRef.current = loading;
  }, [loading]);

  // Получаем ID станка из localStorage, если он не передан в параметрах
  useEffect(() => {
    if (machineId === undefined) {
      const localIds = getLocalMachineIds();
      if (localIds) {
        setEffectiveId(localIds.machineId);
      } else {
        console.error('ID станка не найден в localStorage');
      }
    } else {
      setEffectiveId(machineId);
    }
  }, [machineId]);

  // Функция для загрузки данных о станке через REST API
  const fetchMachine = useCallback(async (): Promise<void> => {
    if (!effectiveId) {
      setLoading('error');
      setError(new Error('ID станка не определен'));
      return;
    }

    try {
      setLoading('loading');
      setError(null);
      
      const data = await machineApi.getMachineById(effectiveId);
      setMachine(data);
      setLoading('success');
    } catch (err) {
      setLoading('error');
      setError(err instanceof Error ? err : new Error('Неизвестная ошибка'));
      console.error('Ошибка при загрузке данных о станке:', err);
    }
  }, [effectiveId]);

  // Функция для обновления данных станка
  const refreshMachineData = useCallback(async (status: string) => {
    try {
      if (status !== 'updated') {
        console.warn('Игнорируем неожиданный status from socket:', status);
        return;
      }

      if (!effectiveId) return;

      if (refreshTimeoutRef.current) {
        window.clearTimeout(refreshTimeoutRef.current);
      }

      refreshTimeoutRef.current = window.setTimeout(async () => {
        try {
          const data = await machineApi.getMachineById(effectiveId);
          setMachine(data);
          
          // Обновляем состояние загрузки
          if (loadingRef.current === 'loading') {
            setLoading('success');
          }
          
          console.log(`Данные станка обновлены (debounced):`, data);
        } catch (err) {
          console.error('Ошибка обновления данных станка:', err);
          setLoading('error');
          setError(err instanceof Error ? err : new Error('Ошибка обновления'));
        }
      }, REFRESH_DEBOUNCE_MS);
    } catch (err) {
      console.error('Ошибка в refreshMachineData:', err);
    }
  }, [effectiveId]);

  // Функция для обработки событий обновления статуса станка от Socket.IO
  const handleMachineStatusUpdate = useCallback((updatedMachine: Machine) => {
    // Проверяем, что ID станка соответствует текущему
    if (updatedMachine && updatedMachine.id === effectiveId) {
      // Обновляем состояние machine
      setMachine(updatedMachine);
      
      // Также обновляем состояние loading, если оно было в состоянии загрузки
      if (loadingRef.current === 'loading') {
        setLoading('success');
      }
    } else {
      console.warn(
        `ID станка не совпадает: получено=${updatedMachine?.id}, ожидается=${effectiveId}. ` +
        'Обновление проигнорировано.'
      );
    }
  }, [effectiveId]);

  // Настройка WebSocket обработчиков событий
  useEffect(() => {
    if (!socket || !isWebSocketConnected || !effectiveId) return;

    console.log('Настройка WebSocket обработчиков для станка в комнате:', room);

    const handleMachineEvent = async (data: { status: string }) => {
      console.log('Получено WebSocket событие для станка - status:', data.status);
      await refreshMachineData(data.status);
    };

    const handleDisconnect = () => {
      console.log('WebSocket соединение потеряно для станка, перезагружаем данные');
      fetchMachine();
    };

    const handleReconnect = () => {
      console.log('WebSocket переподключение для станка, обновляем данные');
      fetchMachine();
    };

    socket.on('machine:event', handleMachineEvent);
    socket.on('disconnect', handleDisconnect);
    socket.on('reconnect', handleReconnect);

    return () => {
      socket.off('machine:event', handleMachineEvent);
      socket.off('disconnect', handleDisconnect);
      socket.off('reconnect', handleReconnect);
      if (refreshTimeoutRef.current) {
        window.clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
      }
    };
  }, [socket, isWebSocketConnected, room, refreshMachineData, effectiveId]);

  // Инициализация Socket.IO и настройка обработчиков событий
  useEffect(() => {
    if (!effectiveId) {
      console.warn('effectiveId не определен, не инициализируем сокет');
      return;
    }
    
    try {
      // Инициализируем сокет
      const socket = socketService.initialize();
      
      // Присоединяемся к комнате product-machines для получения обновлений статуса станков
      socketService.joinMachinesRoom();
      
      // Устанавливаем обработчики событий
      socketService.setHandlers({
        onConnect: () => {
          setIsSocketConnected(true);
          // При подключении заново присоединяемся к комнате
          socketService.joinMachinesRoom();
        },
        onDisconnect: () => {
          setIsSocketConnected(false);
        },
        onError: (error) => {
          console.error('Socket.IO ошибка для станка:', error);
          setIsSocketConnected(false);
          // Если возникла ошибка сокета, попробуем загрузить данные через REST API
          fetchMachine();
        },
        onMachineStatusUpdate: handleMachineStatusUpdate,
        onRoomJoined: (room) => {
          if (room === 'product-machines') {
            // Подключение к комнате product-machines подтверждено
          }
        },
        onRoomLeft: (room) => {
          // Покинули комнату
        }
      });
      
      // Проверяем текущее состояние соединения
      setIsSocketConnected(socketService.isConnected());
      
      // Первоначальная загрузка данных через REST API
      fetchMachine();
      
      // Очистка при размонтировании компонента
      return () => {
        socketService.clearHandlers();
      };
    } catch (error) {
      console.error('Ошибка при инициализации Socket.IO для станка:', error);
      setIsSocketConnected(false);
      // В случае ошибки с сокетом, используем обычный REST API
      fetchMachine();
    }
  }, [effectiveId, handleMachineStatusUpdate, fetchMachine]);

  // Функция для изменения статуса станка
  const changeStatus = useCallback(async (status: MachineStatus): Promise<void> => {
    if (!effectiveId) {
      setError(new Error('ID станка не определен'));
      return;
    }

    try {
      setLoading('loading');
      setError(null);
      
      const updatedMachine = await machineApi.changeMachineStatus(effectiveId, status);
      
      // Если соединение через Socket.IO неактивно, обновляем состояние напрямую
      if (!isSocketConnected) {
        setMachine(updatedMachine);
        setLoading('success');
      } else {
        // Форсируем обновление через небольшую задержку для корректного рендеринга компонентов
        setTimeout(() => {
          // Проверяем, пришло ли обновление через сокет
          if (machineRef.current?.status !== status) {
            setMachine({
              ...updatedMachine,
              // Убедимся, что статус обновился
              status: status
            });
            setLoading('success');
          }
        }, 1000); // Уменьшаем таймаут до 1 секунды для более быстрой реакции UI
      }
    } catch (err) {
      setLoading('error');
      setError(err instanceof Error ? err : new Error('Ошибка при изменении статуса станка'));
      console.error('Ошибка при изменении статуса станка:', err);
    }
  }, [effectiveId, isSocketConnected]);

  // Функция для отбраковки деталей с поддона
  const defectPalletParts = useCallback(async (defectData: DefectPalletPartsDto): Promise<DefectPartsResponse> => {
    try {
      const response = await machineApi.defectPalletParts(defectData);
      return response;
    } catch (err) {
      console.error('Ошибка при отбраковке деталей:', err);
      throw err;
    }
  }, []);

  // Вычисляемые состояния станка на основе текущего статуса
  const isActive = machine?.status === 'ACTIVE';
  const isInactive = machine?.status === 'INACTIVE';
  const isBroken = machine?.status === 'BROKEN';
  const isOnMaintenance = machine?.status === 'MAINTENANCE';

  return {
    machine,
    loading,
    error,
    isActive,
    isInactive,
    isBroken,
    isOnMaintenance,
    refetch: fetchMachine,
    forceRefresh: () => {
      console.log('Принудительное обновление данных станка');
      fetchMachine();
    },
    machineId: effectiveId,
    segmentId: machine?.segmentId,
    changeStatus,
    isSocketConnected,
    isWebSocketConnected,
    webSocketError,
    refreshMachineData,
    defectPalletParts
  };
};