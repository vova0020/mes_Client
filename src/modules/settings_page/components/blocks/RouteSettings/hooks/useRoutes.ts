import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { routesApi, Route, CreateRouteDto, UpdateRouteDto, UpdateRouteCompleteDto, UpdateRoutePartialDto, CreateRouteStageDto, UpdateRouteStageDto, ReorderRouteStagesDto, ProductionLine, LineStagesResponse } from '../api/routes.api';

// Ключи для запросов
export const ROUTES_QUERY_KEYS = {
  all: ['routes'] as const,
  lists: () => [...ROUTES_QUERY_KEYS.all, 'list'] as const,
  list: (filters: string) => [...ROUTES_QUERY_KEYS.lists(), { filters }] as const,
  details: () => [...ROUTES_QUERY_KEYS.all, 'detail'] as const,
  detail: (id: number) => [...ROUTES_QUERY_KEYS.details(), id] as const,
  stages: (routeId: number) => [...ROUTES_QUERY_KEYS.all, 'stages', routeId] as const,
  productionLines: ['productionLines'] as const,
  lineStages: (lineId: number) => [...ROUTES_QUERY_KEYS.productionLines, 'stages', lineId] as const,
};



// Хук для получения всех маршрутов
export const useRoutes = () => {
  return useQuery({
    queryKey: ROUTES_QUERY_KEYS.lists(),
    queryFn: routesApi.getAllRoutes,
    staleTime: 5 * 60 * 1000, // 5 минут
  });
};

// Хук для получения маршрута по ID
export const useRoute = (id: number) => {
  return useQuery({
    queryKey: ROUTES_QUERY_KEYS.detail(id),
    queryFn: () => routesApi.getRouteById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

// Хук для получения этапов маршрута
export const useRouteStages = (routeId: number) => {
  return useQuery({
    queryKey: ROUTES_QUERY_KEYS.stages(routeId),
    queryFn: () => routesApi.getRouteStages(routeId),
    enabled: !!routeId,
    staleTime: 5 * 60 * 1000,
  });
};

// Хук для получения всех производственных линий
export const useProductionLines = () => {
  return useQuery({
    queryKey: ROUTES_QUERY_KEYS.productionLines,
    queryFn: routesApi.getProductionLines,
    staleTime: 10 * 60 * 1000, // 10 минут
  });
};

// Хук для получения этапов производственной линии
export const useLineStages = (lineId: number) => {
  return useQuery({
    queryKey: ROUTES_QUERY_KEYS.lineStages(lineId),
    queryFn: () => routesApi.getLineStages(lineId),
    enabled: !!lineId,
    staleTime: 10 * 60 * 1000, // 10 минут
  });
};

// Хук для создания маршрута
export const useCreateRoute = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: routesApi.createRoute,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ROUTES_QUERY_KEYS.lists() });
    },
  });
};

// Хук для обновления маршрута (только название)
export const useUpdateRoute = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateRouteDto }) =>
      routesApi.updateRoute(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ROUTES_QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: ROUTES_QUERY_KEYS.detail(data.routeId) });
    },
  });
};



// Комплексный хук для обновления маршрута с этапами
export const useUpdateRouteComplete = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateRouteCompleteDto }) => 
      routesApi.updateRouteComplete(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ROUTES_QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: ROUTES_QUERY_KEYS.detail(data.routeId) });
      queryClient.invalidateQueries({ queryKey: ROUTES_QUERY_KEYS.stages(data.routeId) });
      
      queryClient.setQueryData(ROUTES_QUERY_KEYS.detail(data.routeId), data);
      queryClient.setQueryData(ROUTES_QUERY_KEYS.lists(), (oldData: Route[] | undefined) => {
        if (!oldData) return oldData;
        return oldData.map(route => 
          route.routeId === data.routeId ? data : route
        );
      });
    },
  });
};

// Хук для частичного обновления маршрута (новый API)
export const useUpdateRoutePartial = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateRoutePartialDto }) => 
      routesApi.updateRoutePartial(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ROUTES_QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: ROUTES_QUERY_KEYS.detail(data.routeId) });
      queryClient.invalidateQueries({ queryKey: ROUTES_QUERY_KEYS.stages(data.routeId) });
      
      // Обновляем кэш немедленно
      queryClient.setQueryData(ROUTES_QUERY_KEYS.detail(data.routeId), data);
      queryClient.setQueryData(ROUTES_QUERY_KEYS.lists(), (oldData: Route[] | undefined) => {
        if (!oldData) return oldData;
        return oldData.map(route => 
          route.routeId === data.routeId ? data : route
        );
      });
    },
  });
};

// Хук для удаления маршрута
export const useDeleteRoute = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: routesApi.deleteRoute,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ROUTES_QUERY_KEYS.lists() });
    },
  });
};

// Хук для добавления этапа к маршруту
export const useAddRouteStage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ routeId, data }: { routeId: number; data: CreateRouteStageDto }) =>
      routesApi.addRouteStage(routeId, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ROUTES_QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: ROUTES_QUERY_KEYS.detail(data.routeId) });
      queryClient.invalidateQueries({ queryKey: ROUTES_QUERY_KEYS.stages(data.routeId) });
    },
  });
};

// Хук для обновления этапа маршрута
export const useUpdateRouteStage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ stageId, data }: { stageId: number; data: UpdateRouteStageDto }) =>
      routesApi.updateRouteStage(stageId, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ROUTES_QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: ROUTES_QUERY_KEYS.detail(data.routeId) });
      queryClient.invalidateQueries({ queryKey: ROUTES_QUERY_KEYS.stages(data.routeId) });
    },
  });
};

// Хук для удаления этапа маршрута
export const useDeleteRouteStage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ stageId, routeId }: { stageId: number; routeId: number }) => {
      return routesApi.deleteRouteStage(stageId);
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ROUTES_QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: ROUTES_QUERY_KEYS.detail(variables.routeId) });
      queryClient.invalidateQueries({ queryKey: ROUTES_QUERY_KEYS.stages(variables.routeId) });
    },
  });
};

// Хук для удаления всех этапов маршрута
export const useDeleteAllRouteStages = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (routeId: number) => {
      return routesApi.deleteAllRouteStages(routeId);
    },
    onSuccess: (data, routeId) => {
      queryClient.invalidateQueries({ queryKey: ROUTES_QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: ROUTES_QUERY_KEYS.detail(routeId) });
      queryClient.invalidateQueries({ queryKey: ROUTES_QUERY_KEYS.stages(routeId) });
    },
  });
};

// Хук для изменения порядка этапов
export const useReorderRouteStages = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ routeId, data }: { routeId: number; data: ReorderRouteStagesDto }) =>
      routesApi.reorderRouteStages(routeId, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ROUTES_QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: ROUTES_QUERY_KEYS.detail(variables.routeId) });
      queryClient.invalidateQueries({ queryKey: ROUTES_QUERY_KEYS.stages(variables.routeId) });
    },
  });
};

// Хук для перемещения этапа
export const useMoveRouteStage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ stageId, newSequenceNumber }: { stageId: number; newSequenceNumber: number }) => {
      console.log('API call: moveRouteStage', { stageId, newSequenceNumber });
      return routesApi.moveRouteStage(stageId, newSequenceNumber);
    },
    onSuccess: (updatedStages) => {
      console.log('Move stage success:', updatedStages);
      
      // Инвалидируем список маршрутов
      queryClient.invalidateQueries({ queryKey: ROUTES_QUERY_KEYS.lists() });
      
      // Если у нас есть обновленные этапы, найдем routeId и инвалидируем кэш для конкретного маршрута
      if (updatedStages && updatedStages.length > 0) {
        const routeId = updatedStages[0].routeId;
        console.log('Invalidating cache for route:', routeId);
        queryClient.invalidateQueries({ queryKey: ROUTES_QUERY_KEYS.detail(routeId) });
        queryClient.invalidateQueries({ queryKey: ROUTES_QUERY_KEYS.stages(routeId) });
      }
    },
    onError: (error) => {
      console.error('Move stage error:', error);
    },
  });
};

// Хук для копирования маршрута
export const useCopyRoute = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, newRouteName }: { id: number; newRouteName: string }) =>
      routesApi.copyRoute(id, newRouteName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ROUTES_QUERY_KEYS.lists() });
    },
  });
};

//