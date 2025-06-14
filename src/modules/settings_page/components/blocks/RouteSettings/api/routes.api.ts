import { axiosInstance } from './axios-instance';

// Интерфейсы для API
export interface Stage {
  stageId: number;
  stageName: string;
}

export interface Substage {
  substageId: number;
  substageName: string;
  stageId: number;
}

export interface RouteStage {
  routeStageId: number;
  routeId: number;
  stageId: number;
  substageId?: number;
  sequenceNumber: number;
  stage: Stage;
  substage?: Substage;
}

export interface Route {
  routeId: number;
  routeName: string;
  routeStages: RouteStage[];
  _count?: {
    parts: number;
  };
  parts?: Array<{
    partId: number;
    partName: string;
    partCode: string;
  }>;
}

export interface CreateRouteDto {
  routeName: string;
  stages?: Array<{
    stageId: number;
    substageId?: number;
    sequenceNumber?: number;
  }>;
}

export interface UpdateRouteDto {
  routeName: string;
}

export interface CreateRouteStageDto {
  stageId: number;
  substageId?: number;
  sequenceNumber?: number;
}

export interface UpdateRouteStageDto {
  stageId?: number;
  substageId?: number;
  sequenceNumber?: number;
}

export interface ReorderRouteStagesDto {
  stageIds: number[];
}

export interface AvailableStage {
  stageId: number;
  stageName: string;
  productionStagesLevel2: Substage[];
}

// API методы для маршрутов
export const routesApi = {
  // Получить все маршруты
  getAllRoutes: async (): Promise<Route[]> => {
    const response = await axiosInstance.get('/settings/routes');
    return response.data;
  },

  // Получить маршрут по ID
  getRouteById: async (id: number): Promise<Route> => {
    const response = await axiosInstance.get(`/settings/routes/${id}`);
    return response.data;
  },

  // Создать новый маршрут
  createRoute: async (data: CreateRouteDto): Promise<Route> => {
    const response = await axiosInstance.post('/settings/routes', data);
    return response.data;
  },

  // Обновить маршрут (только название)
  updateRoute: async (id: number, data: UpdateRouteDto): Promise<Route> => {
    const response = await axiosInstance.put(`/settings/routes/${id}`, data);
    return response.data;
  },

  // Удалить маршрут
  deleteRoute: async (id: number): Promise<{ message: string }> => {
    const response = await axiosInstance.delete(`/settings/routes/${id}`);
    return response.data;
  },

  // Получить этапы маршрута
  getRouteStages: async (routeId: number): Promise<RouteStage[]> => {
    const response = await axiosInstance.get(`/settings/routes/${routeId}/stages`);
    return response.data;
  },

  // Добавить этап к маршруту
  addRouteStage: async (routeId: number, data: CreateRouteStageDto): Promise<RouteStage> => {
    const response = await axiosInstance.post(`/settings/routes/${routeId}/stages`, data);
    return response.data;
  },

  // Обновить этап маршрута
  updateRouteStage: async (stageId: number, data: UpdateRouteStageDto): Promise<RouteStage> => {
    const response = await axiosInstance.put(`/settings/routes/stages/${stageId}`, data);
    return response.data;
  },

  // Удалить этап маршрута
  deleteRouteStage: async (stageId: number): Promise<{ message: string }> => {
    const response = await axiosInstance.delete(`/settings/routes/stages/${stageId}`);
    return response.data;
  },

  // Изменить порядок этапов в маршруте
  reorderRouteStages: async (routeId: number, data: ReorderRouteStagesDto): Promise<RouteStage[]> => {
    const response = await axiosInstance.put(`/settings/routes/${routeId}/stages/reorder`, data);
    return response.data;
  },

  // Переместить этап на новую позицию
  moveRouteStage: async (stageId: number, newSequenceNumber: number): Promise<RouteStage[]> => {
    const response = await axiosInstance.put(`/settings/routes/stages/${stageId}/move`, {
      newSequenceNumber
    });
    return response.data;
  },

  // Получить доступные этапы уровня 1
  getAvailableStagesLevel1: async (): Promise<AvailableStage[]> => {
    const response = await axiosInstance.get('/settings/routes/available-stages/level1');
    return response.data;
  },

  // Получить доступные этапы уровня 2
  getAvailableStagesLevel2: async (stageId: number): Promise<Substage[]> => {
    const response = await axiosInstance.get(`/settings/routes/available-stages/level2/${stageId}`);
    return response.data;
  },

  // Скопировать маршрут
  copyRoute: async (id: number, newRouteName: string): Promise<Route> => {
    const response = await axiosInstance.post(`/settings/routes/${id}/copy`, {
      newRouteName
    });
    return response.data;
  },
};
