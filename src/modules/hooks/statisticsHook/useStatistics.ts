import { useState, useEffect } from 'react';
import { statisticsApi } from '../../api/statisticsApi';
import { 
  ProductionLine, 
  StageStats, 
  MachineStats, 
  DateRangeType, 
  UnitOfMeasurement 
} from '../../api/statisticsApi';

export const useProductionLines = () => {
  const [lines, setLines] = useState<ProductionLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLines = async () => {
      try {
        setLoading(true);
        const data = await statisticsApi.getProductionLines();
        setLines(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load production lines');
      } finally {
        setLoading(false);
      }
    };

    fetchLines();
  }, []);

  return { lines, loading, error };
};

export const useLineStats = (
  lineId: number | null,
  dateRangeType: DateRangeType,
  date: string,
  startDate: string,
  endDate: string,
  unit: UnitOfMeasurement,
  refreshKey?: number
) => {
  const [stats, setStats] = useState<StageStats[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!lineId) return;

    const fetchStats = async () => {
      try {
        setLoading(true);
        const data = await statisticsApi.getLineStats({
          lineId,
          dateRangeType,
          date: dateRangeType !== DateRangeType.CUSTOM ? date : undefined,
          startDate: dateRangeType === DateRangeType.CUSTOM ? startDate : undefined,
          endDate: dateRangeType === DateRangeType.CUSTOM ? endDate : undefined,
          unit
        });
        setStats(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load line stats');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [lineId, dateRangeType, date, startDate, endDate, unit, refreshKey]);

  return { stats, loading, error };
};

export const useStageStats = (
  lineId: number | null,
  stageId: number | null,
  dateRangeType: DateRangeType,
  date: string,
  startDate: string,
  endDate: string,
  refreshKey?: number
) => {
  const [stats, setStats] = useState<MachineStats[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!lineId || !stageId) return;

    const fetchStats = async () => {
      try {
        setLoading(true);
        const data = await statisticsApi.getStageStats({
          lineId,
          stageId,
          dateRangeType,
          date: dateRangeType !== DateRangeType.CUSTOM ? date : undefined,
          startDate: dateRangeType === DateRangeType.CUSTOM ? startDate : undefined,
          endDate: dateRangeType === DateRangeType.CUSTOM ? endDate : undefined
        });
        setStats(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load stage stats');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [lineId, stageId, dateRangeType, date, startDate, endDate, refreshKey]);

  return { stats, loading, error };
};
