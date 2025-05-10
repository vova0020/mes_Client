import { useState, useEffect, useCallback } from 'react';
import { machineApi, Machine, getLocalMachineIds, MachineStatus } from '../../api/machinNoSmenApi/machineApi';

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
}

/**
 * Хук для работы с данными о станке
 * @param machineId - ID станка (если не указан, будет взят из localStorage)
 * @returns Объект с данными и состояниями станка
 */
export const useMachine = (machineId?: number): UseMachineResult => {
  const [machine, setMachine] = useState<Machine | null>(null);
  const [loading, setLoading] = useState<LoadingState>('loading');
  const [error, setError] = useState<Error | null>(null);
  const [effectiveId, setEffectiveId] = useState<number | undefined>(machineId);

  // Получаем ID станка из localStorage, если он не передан в параметрах
  useEffect(() => {
    if (machineId === undefined) {
      const localIds = getLocalMachineIds();
      if (localIds) {
        setEffectiveId(localIds.machineId);
      }
    } else {
      setEffectiveId(machineId);
    }
  }, [machineId]);

  // Функция для загрузки данных о станке
  const fetchMachine = async (): Promise<void> => {
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
  };

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
      setMachine(updatedMachine);
      setLoading('success');
    } catch (err) {
      setLoading('error');
      setError(err instanceof Error ? err : new Error('Ошибка при изменении статуса станка'));
      console.error('Ошибка при изменении статуса станка:', err);
    }
  }, [effectiveId]);

  // Загрузка данных о станке при изменении effectiveId
  useEffect(() => {
    if (effectiveId) {
      fetchMachine();
    }
  }, [effectiveId]);

  // Вычисляемые состояния станка
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
    changeStatus
  };
};