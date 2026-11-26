import { useState, useEffect, useCallback, useRef } from 'react';
import operatorWorkMonitorApi from '../../api/operatorApi/operatorWorkMonitorApi';
import type { WorkMonitorOperatorDto } from '../../api/operatorApi/operatorWorkMonitorApi';

/**
 * Хук загрузки данных монитора персонала (привязки операторов к рабочим местам).
 */
export const useOperatorWorkMonitor = () => {
  const [operators, setOperators] = useState<WorkMonitorOperatorDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshTimeoutRef = useRef<number | null>(null);
  const REFRESH_DEBOUNCE_MS = 300;

  const AUTO_REFRESH_MS = 15000;

  /**
   * Умное обновление: меняет в стейте только те записи, которые реально
   * изменились, и добавляет/удаляет операторов. Это позволяет React
   * перерисовывать только затронутые строки, а не всю страницу.
   */
  const updateOperatorsSmartly = useCallback((newOperators: WorkMonitorOperatorDto[]) => {
    setOperators(current => {
      if (current.length === 0) {
        return newOperators;
      }

      const currentMap = new Map(current.map(o => [o.userId, o]));
      const updated: WorkMonitorOperatorDto[] = [];
      let hasChanges = false;

      newOperators.forEach(newOp => {
        const currentOp = currentMap.get(newOp.userId);
        if (!currentOp) {
          updated.push(newOp);
          hasChanges = true;
        } else if (JSON.stringify(currentOp) !== JSON.stringify(newOp)) {
          updated.push(newOp);
          hasChanges = true;
        } else {
          updated.push(currentOp);
        }
      });

      const newIds = new Set(newOperators.map(o => o.userId));
      if (current.some(o => !newIds.has(o.userId))) {
        hasChanges = true;
      }

      return hasChanges ? updated : current;
    });
  }, []);

  const fetchOperators = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await operatorWorkMonitorApi.getWorkMonitor();
      updateOperatorsSmartly(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Неизвестная ошибка');
    } finally {
      setLoading(false);
    }
  }, [updateOperatorsSmartly]);

  const refreshOperatorsData = useCallback(async (status: string) => {
    try {
      if (status !== 'updated') {
        return;
      }
      if (refreshTimeoutRef.current) {
        window.clearTimeout(refreshTimeoutRef.current);
      }
      refreshTimeoutRef.current = window.setTimeout(async () => {
        try {
          const data = await operatorWorkMonitorApi.getWorkMonitor();
          updateOperatorsSmartly(data);
        } catch (err) {
          console.error('Ошибка обновления данных монитора персонала:', err);
        }
      }, REFRESH_DEBOUNCE_MS);
    } catch (err) {
      console.error('Ошибка в refreshOperatorsData:', err);
    }
  }, [updateOperatorsSmartly]);

  useEffect(() => {
    fetchOperators();
  }, [fetchOperators]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      fetchOperators();
    }, AUTO_REFRESH_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [fetchOperators]);

  return {
    operators,
    loading,
    error,
    refetch: fetchOperators,
    refreshOperatorsData,
  };
};
