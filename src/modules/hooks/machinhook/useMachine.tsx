import { useState, useEffect, useCallback, useRef } from 'react';
import { machineApi, Machine, getLocalMachineIds, MachineStatus, DefectPalletPartsDto, DefectPartsResponse } from '../../api/machineApi/machineApi';
import { socketService, SocketEvent } from '../../api/socket/socketService';

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
  machineId: number | undefined;
  segmentId: number | null | undefined;
  changeStatus: (status: MachineStatus) => Promise<void>;
  isSocketConnected: boolean;
  defectPalletParts: (defectData: DefectPalletPartsDto) => Promise<DefectPartsResponse>;
}

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
        // // console.log(`Получен ID станка из localStorage: ${localIds.machineId}`);
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
      
      // // console.log(`Загрузка данных о станке через REST API, ID: ${effectiveId}`);
      const data = await machineApi.getMachineById(effectiveId);
      // // console.log('Полученные данные о станке:', data);
      setMachine(data);
      setLoading('success');
    } catch (err) {
      setLoading('error');
      setError(err instanceof Error ? err : new Error('Неизвестная ошибка'));
      console.error('Ошибка при загрузке данных о станке:', err);
    }
  }, [effectiveId]);

  // Функция для обработки событий обновления статуса станка от Socket.IO
  const handleMachineStatusUpdate = useCallback((updatedMachine: Machine) => {
    // // console.log('Получено обновление статуса станка через Socket.IO:', updatedMachine);
    // // console.log('Текущий effectiveId:', effectiveId);
    
    // Проверяем, что ID станка соответствует текущему
    if (updatedMachine && updatedMachine.id === effectiveId) {
      // // console.log('ID совпадает, обновляем данные станка...');
      // // console.log('Старый статус:', machineRef.current?.status);
      // // console.log('Новый статус:', updatedMachine.status);
      
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

  // Инициализация Socket.IO и настройка обработчиков событий
  useEffect(() => {
    if (!effectiveId) {
      console.warn('effectiveId не определен, не инициализируем с��кет');
      return;
    }
    
    try {
      // // console.log(`Инициализация сокета для станка с ID=${effectiveId}`);
      
      // Инициализируем сокет
      const socket = socketService.initialize();
      
      // Присоединяемся к комнате product-machines для получения обновлений статуса станков
      // // console.log('Подключение к комнате product-machines для получения обновлений статуса станков');
      socketService.joinMachinesRoom();
      
      // Устанавливаем обработчики событий
      socketService.setHandlers({
        onConnect: () => {
          // // console.log('Socket.IO подключен успешно для станка');
          setIsSocketConnected(true);
          // При подключении заново присоединяемся к комнате
          socketService.joinMachinesRoom();
        },
        onDisconnect: () => {
          // // console.log('Socket.IO отключен для станка');
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
          // // console.log(`Успешно присоединились к комнате: ${room}`);
          if (room === 'product-machines') {
            // // console.log('Подключение к комнате product-machines подтверждено');
          }
        },
        onRoomLeft: (room) => {
          // // console.log(`Покинули комнату: ${room}`);
        }
      });
      
      // Проверяем текущее состояние соединения
      setIsSocketConnected(socketService.isConnected());
      
      // Первоначальная загрузка данных через REST API
      fetchMachine();
      
      // Очистка при размонтировании компонента
      return () => {
        // // console.log('Очистка обработчиков Socket.IO для станка');
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
      
      // // console.log(`Изменение статуса станка с ID=${effectiveId} на ${status}`);
      const updatedMachine = await machineApi.changeMachineStatus(effectiveId, status);
      // // console.log('Ответ после изменения статуса:', updatedMachine);
      
      // Если соединение через Socket.IO неактивно, обновляем состояние напрямую
      if (!isSocketConnected) {
        // // console.log('Socket.IO отключен, обновляем данные напрямую');
        setMachine(updatedMachine);
        setLoading('success');
      } else {
        // // console.log('Socket.IO активен, ожидаем обновления через событие updateStatus');
        
        // Форсируем обновление через небольшую задержку для корректного рендеринга компонентов
        setTimeout(() => {
          // Проверяем, пришло ли обновление через сокет
          if (machineRef.current?.status !== status) {
            // // console.log('Обновление через Socket.IO не пришло или не обновило состояние, обновляем данные напрямую');
            setMachine({
              ...updatedMachine,
              // Убедимся, что статус обновился
              status: status
            });
            setLoading('success');
          } else {
            // // console.log('Состояние успешно обновлено через Socket.IO');
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
    machineId: effectiveId,
    segmentId: machine?.segmentId,
    changeStatus,
    isSocketConnected,
    defectPalletParts
  };
};