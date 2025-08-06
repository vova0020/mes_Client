import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { routesApi, Route, CreateRouteDto, UpdateRouteDto, CreateRouteStageDto, UpdateRouteStageDto, ReorderRouteStagesDto, ProductionLine, LineStagesResponse } from '../api/routes.api';

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

// Интерфейс для комплексного обновления маршрута
export interface UpdateRouteCompleteDto {
  routeName: string;
  lineId?: number;
  stages: Array<{
    stageId: number;
    substageId?: number;
    sequenceNumber: number;
  }>;
}

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

// Функция для сравнения этапов
const compareStages = (
  oldStages: Array<{ routeStageId: number; stageId: number; substageId?: number; sequenceNumber: number }>,
  newStages: Array<{ stageId: number; substageId?: number; sequenceNumber: number }>
) => {
  const stagesToDelete = oldStages.filter(oldStage => 
    !newStages.some(newStage => 
      newStage.stageId === oldStage.stageId && 
      newStage.substageId === oldStage.substageId
    )
  );

  const stagesToAdd = newStages.filter(newStage => 
    !oldStages.some(oldStage => 
      oldStage.stageId === newStage.stageId && 
      oldStage.substageId === newStage.substageId
    )
  );

  const stagesToUpdate = oldStages.filter(oldStage => {
    const matchingNewStage = newStages.find(newStage => 
      newStage.stageId === oldStage.stageId && 
      newStage.substageId === oldStage.substageId
    );
    return matchingNewStage && matchingNewStage.sequenceNumber !== oldStage.sequenceNumber;
  });

  return { stagesToDelete, stagesToAdd, stagesToUpdate };
};

// Комплексный хук для обновления маршрута с этапами
export const useUpdateRouteComplete = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateRouteCompleteDto }) => {
      // 1. Получаем текущий маршрут
      const currentRoute = await routesApi.getRouteById(id);
      
      // 2. Обновляем название маршрута и производственную линию
      const updatedRoute = await routesApi.updateRoute(id, { 
        routeName: data.routeName,
        lineId: data.lineId 
      });
      
      // 3. Сравниваем этапы
      const { stagesToDelete, stagesToAdd, stagesToUpdate } = compareStages(
        currentRoute.routeStages,
        data.stages
      );

      // 4. Удаляем лишние этапы
      for (const stage of stagesToDelete) {
        await routesApi.deleteRouteStage(stage.routeStageId);
      }

      // 5. Добавляем новые этапы
      for (const stage of stagesToAdd) {
        await routesApi.addRouteStage(id, {
          stageId: stage.stageId,
          substageId: stage.substageId,
          sequenceNumber: stage.sequenceNumber
        });
      }

      // 6. Обновляем измененные этапы
      for (const oldStage of stagesToUpdate) {
        const newStage = data.stages.find(s => 
          s.stageId === oldStage.stageId && s.substageId === oldStage.substageId
        );
        if (newStage) {
          await routesApi.updateRouteStage(oldStage.routeStageId, {
            sequenceNumber: newStage.sequenceNumber
          });
        }
      }

      // 7. Переупорядочиваем этапы если нужно
      const finalRoute = await routesApi.getRouteById(id);
      const needsReordering = finalRoute.routeStages.some((stage, index) => 
        stage.sequenceNumber !== data.stages[index]?.sequenceNumber
      );

      if (needsReordering) {
        const stageIds = data.stages
          .sort((a, b) => a.sequenceNumber - b.sequenceNumber)
          .map(stage => {
            const routeStage = finalRoute.routeStages.find(rs => 
              rs.stageId === stage.stageId && rs.substageId === stage.substageId
            );
            return routeStage?.routeStageId;
          })
          .filter(Boolean) as number[];

        if (stageIds.length > 0) {
          await routesApi.reorderRouteStages(id, { stageIds });
        }
      }

      // 8. Возвращаем финальный результат
      return routesApi.getRouteById(id);
    },
    onSuccess: (data) => {
      // Инвалидируем все связанные запросы
      queryClient.invalidateQueries({ queryKey: ROUTES_QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: ROUTES_QUERY_KEYS.detail(data.routeId) });
      queryClient.invalidateQueries({ queryKey: ROUTES_QUERY_KEYS.stages(data.routeId) });
      
      // Обновляем кэш
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