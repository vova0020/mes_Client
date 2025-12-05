
import axios, { AxiosResponse } from 'axios';
import { Machine, CreateMachineDto, UpdateMachineDto, StageWithSubstages, MachineSubstage } from '../MachineSettings';

const API_BASE_URL = import.meta.env.VITE_API_URL;
const MACHINES_URL = '/machines';

// Создаем экземпляр axios с базовой конфигурацией
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10 секунд
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor для обработки ошибок
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log(`[API] ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`);
    return response;
  },
  (error) => {
    console.error(`[API Error] ${error.config?.method?.toUpperCase()} ${error.config?.url}:`, error);
    
    // Обработка различных типов ошибок
    if (error.response) {
      // Сервер вернул ошибку
      const status = error.response.status;
      const message = error.response.data?.message || error.response.statusText;
      
      switch (status) {
        case 400:
          throw new Error(`Неверный запрос: ${message}`);
        case 401:
          throw new Error('Не авторизован');
        case 403:
          throw new Error('Доступ запрещен');
        case 404:
          throw new Error('Ресурс не найден');
        case 409:
          throw new Error(`Конфликт: ${message}`);
        case 422:
          throw new Error(`Ошибка валидации: ${message}`);
        case 500:
          throw new Error('Внутренняя ошибка сервера');
        default:
          throw new Error(`Ошибка сервера (${status}): ${message}`);
      }
    } else if (error.request) {
      // Запрос был отправлен, но ответ не получен
      throw new Error('Сервер не отвечает. Проверьте подключение к интернету.');
    } else {
      // Ошибка при настройке запроса
      throw new Error(`Ошибка запроса: ${error.message}`);
    }
  }
);

// Interceptor для логирования запросов
apiClient.interceptors.request.use(
  (config) => {
    console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('[API Request Error]:', error);
    return Promise.reject(error);
  }
);

export class MachinesApiService {
  // Получить все станки
  static async getAllMachines(): Promise<Machine[]> {
    try {
      const response = await apiClient.get<Machine[]>(MACHINES_URL);
      return response.data;
    } catch (error: any) {
      throw new Error(error.message || 'Ошибка получения станков');
    }
  }

  // Получить станок по ID
  static async getMachineById(id: number): Promise<Machine> {
    try {
      const response = await apiClient.get<Machine>(`${MACHINES_URL}/${id}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.message || 'Ошибка получения станка');
    }
  }

  // Создать новый станок
  static async createMachine(machineData: CreateMachineDto): Promise<Machine> {
    try {
      const response = await apiClient.post<Machine>(MACHINES_URL, machineData);
      return response.data;
    } catch (error: any) {
      throw new Error(error.message || 'Ошибка создания станка');
    }
  }

  // Обновить станок
  static async updateMachine(id: number, machineData: UpdateMachineDto): Promise<Machine> {
    try {
      const response = await apiClient.put<Machine>(`${MACHINES_URL}/${id}`, machineData);
      return response.data;
    } catch (error: any) {
      throw new Error(error.message || 'Ошибка обновления станка');
    }
  }

  // Удалить станок
  static async deleteMachine(id: number): Promise<void> {
    try {
      await apiClient.delete(`${MACHINES_URL}/${id}`);
    } catch (error: any) {
      throw new Error(error.message || 'Ошибка удаления станка');
    }
  }

  // Получить доступные этапы с подэтапами
  static async getAvailableStagesWithSubstages(): Promise<StageWithSubstages[]> {
    try {
      const response = await apiClient.get<StageWithSubstages[]>(`${MACHINES_URL}/available/stages-with-substages`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.message || 'Ошибка получения этапов');
    }
  }

  // Получить подэтапы сгруппированные по этапам
  static async getSubstagesGrouped(): Promise<MachineSubstage[]> {
    try {
      const response = await apiClient.get<MachineSubstage[]>(`${MACHINES_URL}/available/substages-grouped`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.message || 'Ошибка получения подэтапов');
    }
  }

  // Получить статистику этапов и подэтапов
  static async getStagesStatistics(): Promise<{
    stages: number;
    substages: number;
    machines: number;
    machineStageConnections: number;
    machineSubstageConnections: number;
  }> {
    try {
      const response = await apiClient.get<{
        stages: number;
        substages: number;
        machines: number;
        machineStageConnections: number;
        machineSubstageConnections: number;
      }>(`${MACHINES_URL}/statistics/stages`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.message || 'Ошибка получения статистики');
    }
  }

  // Добавить связь с этапом
  static async addMachineStage(machineId: number, stageId: number): Promise<any> {
    try {
      const response = await apiClient.post(`${MACHINES_URL}/${machineId}/stages`, { stageId });
      return response.data;
    } catch (error: any) {
      throw new Error(error.message || 'Ошибка добавления этапа');
    }
  }

  // Удалить связь с этапом
  static async removeMachineStage(machineId: number, stageId: number): Promise<void> {
    try {
      await apiClient.delete(`${MACHINES_URL}/${machineId}/stages/${stageId}`);
    } catch (error: any) {
      throw new Error(error.message || 'Ошибка удаления этапа');
    }
  }

  // Добавить связь с подэтапом
  static async addMachineSubstage(machineId: number, substageId: number): Promise<any> {
    try {
      const response = await apiClient.post(`${MACHINES_URL}/${machineId}/substages`, { substageId });
      return response.data;
    } catch (error: any) {
      throw new Error(error.message || 'Ошибка добавления подэтапа');
    }
  }

  // Удалить связь с подэтапом
  static async removeMachineSubstage(machineId: number, substageId: number): Promise<void> {
    try {
      await apiClient.delete(`${MACHINES_URL}/${machineId}/substages/${substageId}`);
    } catch (error: any) {
      throw new Error(error.message || 'Ошибка удаления подэтапа');
    }
  }

  // Получить этапы и подэтапы станка
  static async getMachineStages(machineId: number): Promise<any> {
    try {
      const response = await apiClient.get(`${MACHINES_URL}/${machineId}/stages`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.message || 'Ошибка получения этапов станка');
    }
  }

  // Дополнительные методы для работы с API

  // Проверить доступность API
  static async healthCheck(): Promise<{ status: string; timestamp: string }> {
    try {
      const response = await apiClient.get<{ status: string; timestamp: string }>('/health');
      return response.data;
    } catch (error: any) {
      throw new Error(error.message || 'API недоступен');
    }
  }

  // Массовое обновление статусов станков
  static async bulkUpdateMachineStatus(
    machineIds: number[], 
    status: string
  ): Promise<Machine[]> {
    try {
      const response = await apiClient.patch<Machine[]>(`${MACHINES_URL}/bulk/status`, {
        machineIds,
        status
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.message || 'Ошибка массового обновления статусов');
    }
  }

  // Получить станки по статусу
  static async getMachinesByStatus(status: string): Promise<Machine[]> {
    try {
      const response = await apiClient.get<Machine[]>(`${MACHINES_URL}`, {
        params: { status }
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.message || 'Ошибка получения станков по статусу');
    }
  }

  // Поиск станков
  static async searchMachines(query: string): Promise<Machine[]> {
    try {
      const response = await apiClient.get<Machine[]>(`${MACHINES_URL}/search`, {
        params: { q: query }
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.message || 'Ошибка поиска станков');
    }
  }
}

// Экспортируем настроенный клиент для использования в других местах
export { apiClient };

// Типы для расширенного API
export interface ApiResponse<T> {
  data: T;
  message?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: any;
}
