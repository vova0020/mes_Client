import { useState, useEffect } from 'react';
import { workMonitorApi, StreamResponse, StageResponse, WorkplaceResponse } from '../../api/workMonitorApi';

export const useStreams = () => {
  const [streams, setStreams] = useState<StreamResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStreams = async () => {
    try {
      setLoading(true);
      const data = await workMonitorApi.getStreams();
      setStreams(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки потоков');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStreams();
  }, []);

  return { streams, loading, error, refetch: fetchStreams };
};

export const useStages = (streamId: number | null) => {
  const [stages, setStages] = useState<StageResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!streamId) {
      setStages([]);
      return;
    }

    const fetchStages = async () => {
      try {
        setLoading(true);
        const data = await workMonitorApi.getStages(streamId);
        setStages(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ошибка загрузки этапов');
      } finally {
        setLoading(false);
      }
    };

    fetchStages();
  }, [streamId]);

  return { stages, loading, error };
};

export const useWorkplaces = (streamId: number | null, stageId: number | null) => {
  const [workplaces, setWorkplaces] = useState<WorkplaceResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!streamId || !stageId) {
      setWorkplaces([]);
      return;
    }

    const fetchWorkplaces = async () => {
      try {
        setLoading(true);
        const data = await workMonitorApi.getWorkplaces(streamId, stageId);
        setWorkplaces(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ошибка загрузки рабочих мест');
      } finally {
        setLoading(false);
      }
    };

    fetchWorkplaces();
  }, [streamId, stageId]);

  return { workplaces, loading, error };
};
