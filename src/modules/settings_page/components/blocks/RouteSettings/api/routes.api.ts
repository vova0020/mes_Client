import axios from 'axios';
// import { api } from './axios-instance';

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

export interface ProductionLine {
  lineId: number;
  lineName: string;
  lineType: string;
  _count?: {
    routes: number;
  };
  routes?: Array<{
    routeId: number;
    routeName: string;
  }>;
  isOccupied?: boolean;
  routesCount?: number;
}

export interface Route {
  routeId: number;
  routeName: string;
  lineId?: number;
  productionLine?: ProductionLine;
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
  lineId?: number;
  stages?: Array<{
    stageId: number;
    substageId?: number;
    sequenceNumber?: number;
  }>;
}

export interface UpdateRouteDto {
  routeName?: string;
  lineId?: number;
}

export interface UpdateRouteCompleteDto {
  routeName: string;
  lineId?: number;
  stages: Array<{
    stageId: number;
    substageId?: number;
    sequenceNumber: number;
  }>;
}

export interface UpdateRoutePartialDto {
  routeName?: string;
  lineId?: number;
  stageIds?: number[];
}

export interface LineStagesResponse {
  productionLine: {
    lineId: number;
    lineName: string;
    lineType: string;
  };
  stagesLevel1: {
    stageId: number;
    stageName: string;
    description?: string;
    finalStage: boolean;
    createdAt: string;
    updatedAt: string;
  }[];
  stagesLevel2: {
    substageId: number;
    stageId: number;
    substageName: string;
    description?: string;
    allowance: number;
  }[];
  routesCount: number;
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

export interface FlowDetails {
  flowId: number;
  flowName: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  routes: {
    routeId: number;
    routeName: string;
    _count: {
      parts: number;
    };
  }[];
}


const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { 'Content-Type': 'application/json' }
});

// API методы для маршрутов
export const routesApi = {
  // Получить все маршруты
  getAllRoutes: async (): Promise<Route[]> => {
    const response = await api.get('/settings/routes');
    return response.data;
  },

  // Получить маршрут по ID
  getRouteById: async (id: number): Promise<Route> => {
    const response = await api.get(`/settings/routes/${id}`);
    return response.data;
  },

  // Создать новый маршрут
  createRoute: async (data: CreateRouteDto): Promise<Route> => {
    const response = await api.post('/settings/routes', data);
    return response.data;
  },

  // Обновить маршрут (только название)
  updateRoute: async (id: number, data: UpdateRouteDto): Promise<Route> => {
    const response = await api.put(`/settings/routes/${id}`, data);
    return response.data;
  },

  // Удалить маршрут
  deleteRoute: async (id: number): Promise<{ message: string }> => {
    const response = await api.delete(`/settings/routes/${id}`);
    return response.data;
  },

  // Получить этапы маршрута
  getRouteStages: async (routeId: number): Promise<RouteStage[]> => {
    const response = await api.get(`/settings/routes/${routeId}/stages`);
    return response.data;
  },

  // Добавить этап к маршруту
  addRouteStage: async (routeId: number, data: CreateRouteStageDto): Promise<RouteStage> => {
    const response = await api.post(`/settings/routes/${routeId}/stages`, data);
    return response.data;
  },

  // Обновить этап маршрута
  updateRouteStage: async (stageId: number, data: UpdateRouteStageDto): Promise<RouteStage> => {
    const response = await api.put(`/settings/routes/stages/${stageId}`, data);
    return response.data;
  },

  // Удалить этап маршрута
  deleteRouteStage: async (stageId: number): Promise<{ message: string }> => {
    const response = await api.delete(`/settings/routes/stages/${stageId}`);
    return response.data;
  },

  // Удалить все этапы из маршрута и связь с линией
  deleteAllRouteStages: async (routeId: number): Promise<{ message: string }> => {
    const response = await api.delete(`/settings/routes/${routeId}/stages`);
    return response.data;
  },

  // Изменить порядок этапов в маршруте
  reorderRouteStages: async (routeId: number, data: ReorderRouteStagesDto): Promise<RouteStage[]> => {
    const response = await api.put(`/settings/routes/${routeId}/stages/reorder`, data);
    return response.data;
  },

  // Переместить этап на новую позицию
  moveRouteStage: async (stageId: number, newSequenceNumber: number): Promise<RouteStage[]> => {
    const response = await api.put(`/settings/routes/stages/${stageId}/move`, {
      newSequenceNumber
    });
    return response.data;
  },

  // Получить все производственные линии
  getProductionLines: async (): Promise<ProductionLine[]> => {
    const response = await api.get('/settings/routes/production-lines');
    return response.data;
  },

  // Получить этапы по ID производственной линии
  getLineStages: async (lineId: number): Promise<LineStagesResponse> => {
    const response = await api.get(`/settings/routes/line/${lineId}/stages`);
    return response.data;
  },

  // Скопировать маршрут
  copyRoute: async (id: number, newRouteName: string): Promise<Route> => {
    const response = await api.post(`/settings/routes/${id}/copy`, {
      newRouteName
    });
    return response.data;
  },

  // Полное обновление маршрута с этапами (используем тот же эндпоинт что и updateRoute)
  updateRouteComplete: async (id: number, data: UpdateRouteCompleteDto): Promise<Route> => {
    const response = await api.put(`/settings/routes/${id}`, data);
    return response.data;
  },

  // Частичное обновление маршрута (новый API)
  updateRoutePartial: async (id: number, data: UpdateRoutePartialDto): Promise<Route> => {
    const response = await api.put(`/settings/routes/${id}`, data);
    return response.data;
  },
};