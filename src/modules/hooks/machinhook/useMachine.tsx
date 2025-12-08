import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  machineApi,
  Machine,
  getLocalMachineIds,
  MachineStatus,
  DefectPalletPartsDto,
  DefectPartsResponse
} from '../../api/machineApi/machineApi';
import { useWebSocketRoom } from '../../../hooks/useWebSocketRoom';

export type LoadingState = 'loading' | 'success' | 'error';

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
  selectedStageId: number | null;
}

// Используем единый ROOM_NAME по умолчанию
const ROOM_NAME = 'room:machines';

const getRoomFromStorage = (): string => {
  try {
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      if (user.department) return `room:${user.department}`;
      if (user.role === 'master') return 'room:masterceh';
    }
  } catch (e) {
    // ignore
  }
  return ROOM_NAME;
};

export const useMachine = (machineId?: number): UseMachineResult => {
  const [machine, setMachine] = useState<Machine | null>(null);
  const [loading, setLoading] = useState<LoadingState>('loading');
  const [error, setError] = useState<Error | null>(null);
  const [effectiveId, setEffectiveId] = useState<number | undefined>(machineId);
  const [isSocketConnected, setIsSocketConnected] = useState<boolean>(false);
  const [selectedStageId, setSelectedStageId] = useState<number | null>(null);

  const machineRef = useRef<Machine | null>(null);
  const loadingRef = useRef<LoadingState>(loading);
  useEffect(() => { machineRef.current = machine; }, [machine]);
  useEffect(() => { loadingRef.current = loading; }, [loading]);

  const REFRESH_DEBOUNCE_MS = 300;
  const refreshTimeoutRef = useRef<number | null>(null);

  const room = useMemo(() => getRoomFromStorage(), []);
  const {
    socket,
    isConnected: isWebSocketConnected,
    error: webSocketError
  } = useWebSocketRoom({ room, autoJoin: true });

  useEffect(() => {
    if (machineId === undefined) {
      const localIds = getLocalMachineIds();
      if (localIds && typeof localIds.machineId === 'number') {
        setEffectiveId(localIds.machineId);
      } else {
        console.warn('ID станка не найден в localStorage и не передан в параметрах');
      }
    } else {
      setEffectiveId(machineId);
    }

    const savedStageId = localStorage.getItem('selectedMachineStageId');
    if (savedStageId) {
      setSelectedStageId(Number(savedStageId));
    }
  }, [machineId]);

  useEffect(() => {
    const handleStageChange = (event: Event) => {
      const customEvent = event as CustomEvent<number>;
      setSelectedStageId(customEvent.detail);
      console.log('Этап изменен в useMachine:', customEvent.detail);
      if (effectiveId) {
        void fetchMachine();
      }
    };

    window.addEventListener('machineStageChanged', handleStageChange);
    return () => window.removeEventListener('machineStageChanged', handleStageChange);
  }, [effectiveId]);

  // fetchMachine: тихо выходим если нет effectiveId
  const fetchMachine = useCallback(async (): Promise<void> => {
    if (!effectiveId) return;
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

  // refreshMachineData: дебаунс и лог статусов
  const refreshMachineData = useCallback(async (status: string) => {
    try {
      if (!effectiveId) return;

      console.log('[useMachine] refreshMachineData status:', status);

      if (refreshTimeoutRef.current) {
        window.clearTimeout(refreshTimeoutRef.current);
      }

      refreshTimeoutRef.current = window.setTimeout(async () => {
        try {
          const data = await machineApi.getMachineById(effectiveId);
          setMachine(data);
          if (loadingRef.current === 'loading') setLoading('success');
          console.log('[useMachine] machine data refreshed (debounced):', data);
        } catch (err) {
          console.error('Ошибка обновления данных станка:', err);
          setLoading('error');
          setError(err instanceof Error ? err : new Error('Ошибка обновления'));
        } finally {
          refreshTimeoutRef.current = null;
        }
      }, REFRESH_DEBOUNCE_MS) as unknown as number;
    } catch (err) {
      console.error('Ошибка в refreshMachineData:', err);
    }
  }, [effectiveId]);

  /**
   * === DIAGNOSTIC EFFECT ===
   * Логирует:
   *  - socket info (handshake/auth/opts)
   *  - все входящие события через onAny (если поддерживается)
   *  - сырые WS фреймы (низкоуровневые) — для проверки реального трафика
   *  - делает join с ack (если сервер ожидает join from client)
   *
   * Оставь этот эффект временно (несколько запусков), затем предоставь сюда вывод консоли.
   */
  useEffect(() => {
    if (!socket) return;

    try {
      console.log('[SOCKET INFO]', {
        id: (socket as any).id,
        connected: (socket as any).connected,
        nsp: (socket as any).nsp ? (socket as any).nsp.name : undefined,
        auth: (socket as any).auth ?? (socket as any).io?.opts?.auth ?? (socket as any).io?.opts?.query,
        opts: (socket as any).io?.opts
      });
    } catch (e) {
      console.warn('[SOCKET INFO] error', e);
    }

    // onAny: лог всех событий (если доступен)
    const anyHandler = (event: string, ...args: any[]) => {
      console.log('[SOCKET ANY]', event, args);
    };
    if ((socket as any).onAny) {
      (socket as any).onAny(anyHandler);
    }

    // Лог конкретного события (на случай, если он совпадает с серверным emit)
    const handleMachineEvent = (payload: any) => {
      console.log('[SOCKET HANDLER] machine:event ->', payload);
      // не делаем refresh здесь — это диагностический эффект; реальный refresh в основном эффекте
    };
    socket.on('machine:event', handleMachineEvent);

    // Raw WS frames (attach to underlying websocket if доступно)
    let rawListener: ((ev: MessageEvent) => void) | null = null;
    try {
      const engine = (socket as any).io?.engine;
      // engine.ws (engine.socket) location may vary by client version
      const ws = engine?.ws ?? engine?.transport?.ws;
      if (ws && ws.addEventListener) {
        rawListener = (ev: MessageEvent) => {
          try {
            console.log('[WS RAW]', String(ev.data).slice(0, 400));
          } catch (e) { /* ignore */ }
        };
        ws.addEventListener('message', rawListener);
        console.log('[WS RAW] attached to underlying websocket');
      } else {
        console.log('[WS RAW] underlying ws not available (engine.ws missing)');
      }
    } catch (e) {
      console.warn('[WS RAW] attach error', e);
    }

    // Попытка join с разными именами (если сервер ожидает join event от клиента)
    try {
      socket.emit('join', room, (ack: any) => console.log('[SOCKET] join ack (join):', ack));
    } catch (e) { /* ignore */ }
    try {
      socket.emit('joinRoom', room, (ack: any) => console.log('[SOCKET] join ack (joinRoom):', ack));
    } catch (e) { /* ignore */ }
    try {
      socket.emit('subscribe', room, (ack: any) => console.log('[SOCKET] join ack (subscribe):', ack));
    } catch (e) { /* ignore */ }

    const onConnectDiag = () => console.log('[SOCKET] connect (diagnostic)');
    const onDisconnectDiag = (reason: any) => console.log('[SOCKET] disconnect (diagnostic)', reason);
    const onConnectErrorDiag = (err: any) => console.log('[SOCKET] connect_error (diagnostic)', err);

    socket.on('connect', onConnectDiag);
    socket.on('disconnect', onDisconnectDiag);
    socket.on('connect_error', onConnectErrorDiag);

    return () => {
      if ((socket as any).offAny) (socket as any).offAny(anyHandler);
      socket.off('machine:event', handleMachineEvent);
      socket.off('connect', onConnectDiag);
      socket.off('disconnect', onDisconnectDiag);
      socket.off('connect_error', onConnectErrorDiag);
      if (rawListener) {
        try {
          const engine = (socket as any).io?.engine;
          const ws = engine?.ws ?? engine?.transport?.ws;
          if (ws && ws.removeEventListener) ws.removeEventListener('message', rawListener);
        } catch (e) {}
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, room]);

  /**
   * === Основная подписка/логика обработки событий ===
   * Подписываемся на события, делаем join при connect, вызываем refreshMachineData.
   */
  useEffect(() => {
    if (!socket || !effectiveId) return;

    // debug onAny (optional, but left here for clarity)
    const onAny = (event: string, ...args: any[]) => {
      console.log('[SOCKET ANY main]', event, args);
    };
    if ((socket as any).onAny) {
      (socket as any).onAny(onAny);
    }

    const handleMachineEvent = (payload: any) => {
      console.log('[SOCKET main] machine:event payload:', payload);
      void refreshMachineData(payload?.status ?? '');
    };

    const handleMachineUpdate = (payload: any) => {
      console.log('[SOCKET main] alternative payload:', payload);
      void refreshMachineData(payload?.status ?? '');
    };

    const connectHandler = () => {
      console.log('[SOCKET main] connect - re-joining room:', room);
      setIsSocketConnected(true);
      try { socket.emit('join', room, (ack: any) => console.log('[SOCKET main] join ack:', ack)); } catch (e) {}
      void fetchMachine();
    };

    const disconnectHandler = (reason: any) => {
      console.log('[SOCKET main] disconnect', reason);
      setIsSocketConnected(false);
      void fetchMachine();
    };

    socket.on('machine:event', handleMachineEvent);
    socket.on('machine:update', handleMachineUpdate);
    socket.on('machines:update', handleMachineUpdate);
    socket.on('machine:status', handleMachineUpdate);

    socket.on('connect', connectHandler);
    socket.on('disconnect', disconnectHandler);

    // если уже подключён — выполнить сразу connectHandler (join + fetch)
    if ((socket as any).connected) {
      connectHandler();
    }

    return () => {
      if ((socket as any).offAny) (socket as any).offAny(onAny);
      socket.off('machine:event', handleMachineEvent);
      socket.off('machine:update', handleMachineUpdate);
      socket.off('machines:update', handleMachineUpdate);
      socket.off('machine:status', handleMachineUpdate);
      socket.off('connect', connectHandler);
      socket.off('disconnect', disconnectHandler);
      if (refreshTimeoutRef.current) {
        window.clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, effectiveId, room, refreshMachineData, fetchMachine]);

  // Инициалная загрузка только при наличии effectiveId
  useEffect(() => {
    if (!effectiveId) return;
    void fetchMachine();
  }, [effectiveId, fetchMachine]);

  const changeStatus = useCallback(async (status: MachineStatus): Promise<void> => {
    if (!effectiveId) {
      setError(new Error('ID станка не определен'));
      return;
    }

    try {
      setLoading('loading');
      setError(null);

      const updatedMachine = await machineApi.changeMachineStatus(effectiveId, status);

      if (!isSocketConnected) {
        setMachine(updatedMachine);
        setLoading('success');
      } else {
        setTimeout(() => {
          if (machineRef.current?.status !== status) {
            setMachine({ ...updatedMachine, status });
          }
          setLoading('success');
        }, 800);
      }
    } catch (err) {
      setLoading('error');
      setError(err instanceof Error ? err : new Error('Ошибка при изменении статуса станка'));
      console.error('Ошибка при изменении статуса станка:', err);
    }
  }, [effectiveId, isSocketConnected]);

  const defectPalletParts = useCallback(async (defectData: DefectPalletPartsDto): Promise<DefectPartsResponse> => {
    try {
      const response = await machineApi.defectPalletParts(defectData);
      return response;
    } catch (err) {
      console.error('Ошибка при отбраковке деталей:', err);
      throw err;
    }
  }, []);

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
    forceRefresh: () => { void fetchMachine(); },
    machineId: effectiveId,
    segmentId: machine?.segmentId,
    changeStatus,
    isSocketConnected,
    isWebSocketConnected: !!isWebSocketConnected,
    webSocketError: webSocketError ? String(webSocketError) : null,
    refreshMachineData,
    defectPalletParts,
    selectedStageId
  };
};
