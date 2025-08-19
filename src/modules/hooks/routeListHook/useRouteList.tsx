import { useState, useEffect } from 'react';
import { routeListApi, RouteListData } from '../../api/routeListApi';

export const useRouteList = (palletId: number | null) => {
  const [data, setData] = useState<RouteListData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      const result = await routeListApi.getPalletData(id);
      setData(result);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка при загрузке данных');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (palletId) {
      fetchData(palletId);
    }
  }, [palletId]);

  return { data, loading, error, refetch: () => palletId && fetchData(palletId) };
};