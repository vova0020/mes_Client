import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  MasterSegment,
  MachineWithOperators,
  OperatorInfo,
  fetchMasterSegments,
  fetchMachinesWithOperators,
  fetchOperators,
  bindOperator,
  unbindOperator,
  changeOperatorNumber,
  BindOperatorResponse,
  UnbindOperatorResponse,
  ChangeNumberResponse,
} from '../../api/masterPage/operatorBindingMasterService';
import { useWebSocketRoom } from '../../../hooks/useWebSocketRoom';

// ===== Интерфейс результата хука =====

interface UseOperatorBindingResult {
  // Участки мастера
  segments: MasterSegment[];
  segmentsLoading: boolean;
  segmentsError: string | null;
  loadSegments: () => Promise<void>;

  // Станки с операторами
  machines: MachineWithOperators[];
  machinesLoading: boolean;
  machinesError: string | null;
  loadMachines: (stageId: number) => Promise<void>;

  // Список операторов
  operators: OperatorInfo[];
  operatorsLoading: boolean;
  operatorsError: string | null;
  loadOperators: (stageId?: number) => Promise<void>;

  // Действия
  handleBind: (operatorId: number, machineId: number, operatorNumber?: number) => Promise<{ success: boolean; message: string }>;
  handleUnbind: (operatorId: number, machineId: number) => Promise<{ success: boolean; message: string }>;
  handleChangeNumber: (operatorId: number, machineId: number, newNumber: number) => Promise<{ success: boolean; message: string }>;
  actionLoading: boolean;

  // WebSocket
  isWebSocketConnected: boolean;
  webSocketError: string | null;
}

// ===== Вспомогательные функции =====

/**
 * Получает ID мастера из localStorage
 */
const getMasterIdFromStorage = (): number | null => {
  try {
    const userData = localStorage.getItem('user');
    if (!userData) return null;
    const user = JSON.parse(userData);
    return user.id || null;
  } catch {
    return null;
  }
};

// ===== Хук =====

const useOperatorBindingMaster = (): UseOperatorBindingResult => {
  // --- Участки ---
  const [segments, setSegments] = useState<MasterSegment[]>([]);
  const [segmentsLoading, setSegmentsLoading] = useState(false);
  const [segmentsError, setSegmentsError] = useState<string | null>(null);

  // --- Станки ---
  const [machines, setMachines] = useState<MachineWithOperators[]>([]);
  const [machinesLoading, setMachinesLoading] = useState(false);
  const [machinesError, setMachinesError] = useState<string | null>(null);

  // --- Операторы ---
  const [operators, setOperators] = useState<OperatorInfo[]>([]);
  const [operatorsLoading, setOperatorsLoading] = useState(false);
  const [operatorsError, setOperatorsError] = useState<string | null>(null);

  // --- Действия ---
  const [actionLoading, setActionLoading] = useState(false);

  // --- Текущий stageId для обновления по WebSocket ---
  const currentStageIdRef = useRef<number | null>(null);

  // --- Debounce ---
  const refreshTimeoutRef = useRef<number | null>(null);
  const REFRESH_DEBOUNCE_MS = 300;

  // --- WebSocket ---
  const room = useMemo(() => 'room:masterceh', []);
  const {
    socket,
    isConnected: isWebSocketConnected,
    error: webSocketError,
  } = useWebSocketRoom({ room, autoJoin: true });

  // ===== Загрузка участков =====
  const loadSegments = useCallback(async () => {
    const masterId = getMasterIdFromStorage();
    if (!masterId) {
      setSegmentsError('Не удалось определить ID мастера из localStorage');
      return;
    }

    setSegmentsLoading(true);
    setSegmentsError(null);

    try {
      const data = await fetchMasterSegments(masterId);
      setSegments(data);
    } catch (err: any) {
      const message = err?.message || 'Ошибка при загрузке участков';
      setSegmentsError(message);
      console.error('Ошибка загрузки участков:', err);
    } finally {
      setSegmentsLoading(false);
    }
  }, []);

  // ===== Загрузка станков =====
  const loadMachines = useCallback(async (stageId: number) => {
    currentStageIdRef.current = stageId;
    setMachinesLoading(true);
    setMachinesError(null);

    try {
      const data = await fetchMachinesWithOperators(stageId);
      setMachines(data);
    } catch (err: any) {
      const message = err?.message || 'Ошибка при загрузке станков';
      setMachinesError(message);
      console.error('Ошибка загрузки станков:', err);
    } finally {
      setMachinesLoading(false);
    }
  }, []);

  // ===== Загрузка операторов =====
  const loadOperators = useCallback(async (stageId?: number) => {
    setOperatorsLoading(true);
    setOperatorsError(null);

    try {
      const data = await fetchOperators(stageId);
      setOperators(data);
    } catch (err: any) {
      const message = err?.message || 'Ошибка при загрузке операторов';
      setOperatorsError(message);
      console.error('Ошибка загрузки операторов:', err);
    } finally {
      setOperatorsLoading(false);
    }
  }, []);

  // ===== Привязка оператора =====
  const handleBind = useCallback(
    async (
      operatorId: number,
      machineId: number,
      operatorNumber?: number
    ): Promise<{ success: boolean; message: string }> => {
      setActionLoading(true);
      try {
        const result: BindOperatorResponse = await bindOperator(operatorId, machineId, operatorNumber);
        // Перезагружаем данные после успешной привязки
        if (currentStageIdRef.current) {
          await loadMachines(currentStageIdRef.current);
        }
        await loadOperators();
        return { success: true, message: result.message };
      } catch (err: any) {
        const message = err?.message || 'Ошибка при привязке оператора';
        return { success: false, message };
      } finally {
        setActionLoading(false);
      }
    },
    [loadMachines, loadOperators]
  );

  // ===== Отвязка оператора =====
  const handleUnbind = useCallback(
    async (
      operatorId: number,
      machineId: number
    ): Promise<{ success: boolean; message: string }> => {
      setActionLoading(true);
      try {
        const result: UnbindOperatorResponse = await unbindOperator(operatorId, machineId);
        // Перезагружаем данные после успешной отвязки
        if (currentStageIdRef.current) {
          await loadMachines(currentStageIdRef.current);
        }
        await loadOperators();
        return { success: true, message: result.message };
      } catch (err: any) {
        const message = err?.message || 'Ошибка при отвязке оператора';
        return { success: false, message };
      } finally {
        setActionLoading(false);
      }
    },
    [loadMachines, loadOperators]
  );

  // ===== Смена номера оператора =====
  const handleChangeNumber = useCallback(
    async (
      operatorId: number,
      machineId: number,
      newNumber: number
    ): Promise<{ success: boolean; message: string }> => {
      setActionLoading(true);
      try {
        const result: ChangeNumberResponse = await changeOperatorNumber(operatorId, machineId, newNumber);
        // Перезагружаем данные после смены номера
        if (currentStageIdRef.current) {
          await loadMachines(currentStageIdRef.current);
        }
        return { success: true, message: result.message };
      } catch (err: any) {
        const message = err?.message || 'Ошибка при смене номера оператора';
        return { success: false, message };
      } finally {
        setActionLoading(false);
      }
    },
    [loadMachines]
  );

  // ===== WebSocket: обновление данных при событиях =====
  useEffect(() => {
    if (!socket || !isWebSocketConnected) return;

    const handleMachineEvent = async (data: { status: string }) => {
      if (data.status !== 'updated') return;

      // Debounce обновления
      if (refreshTimeoutRef.current) {
        window.clearTimeout(refreshTimeoutRef.current);
      }

      refreshTimeoutRef.current = window.setTimeout(async () => {
        try {
          if (currentStageIdRef.current) {
            const freshMachines = await fetchMachinesWithOperators(currentStageIdRef.current);
            setMachines(freshMachines);
          }
          const freshOperators = await fetchOperators();
          setOperators(freshOperators);
          console.log('[useOperatorBindingMaster] Данные обновлены по WebSocket');
        } catch (err) {
          console.error('[useOperatorBindingMaster] Ошибка обновления по WebSocket:', err);
        }
      }, REFRESH_DEBOUNCE_MS);
    };

    socket.on('machine:event', handleMachineEvent);

    return () => {
      socket.off('machine:event', handleMachineEvent);
      if (refreshTimeoutRef.current) {
        window.clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
      }
    };
  }, [socket, isWebSocketConnected]);

  return {
    // Участки
    segments,
    segmentsLoading,
    segmentsError,
    loadSegments,

    // Станки
    machines,
    machinesLoading,
    machinesError,
    loadMachines,

    // Операторы
    operators,
    operatorsLoading,
    operatorsError,
    loadOperators,

    // Действия
    handleBind,
    handleUnbind,
    handleChangeNumber,
    actionLoading,

    // WebSocket
    isWebSocketConnected,
    webSocketError,
  };
};

export default useOperatorBindingMaster;
