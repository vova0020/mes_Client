import axios, { AxiosResponse } from 'axios';
import { 
  BufferResponse, 
  BufferDetailResponse, 
  BufferCellResponse, 
  BufferStageResponse,
  CreateBufferDto,
  UpdateBufferDto,
  CreateBufferCellDto,
  UpdateBufferCellDto,
  CopyBufferDto,
  CreateBufferStageDto,
  UpdateBufferStagesDto,
  BuffersStatistics,
  BufferCellsStatistics,
  AvailableStage,
  StagesWithBuffersResponse
} from '../types/buffers.types';

const API_BASE_URL = 'http://localhost:5000';
const BUFFERS_URL = '/buffers';

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
    console.log(`[BuffersAPI] ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`);
    return response;
  },
  (error) => {
    console.error(`[BuffersAPI Error] ${error.config?.method?.toUpperCase()} ${error.config?.url}:`, error);
    
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
    console.log(`[BuffersAPI Request] ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('[BuffersAPI Request Error]:', error);
    return Promise.reject(error);
  }
);

export class BuffersApiService {
  // === УПРАВЛЕНИЕ БУФЕРАМИ ===

  // Получить все буферы
  static async getAllBuffers(): Promise<BufferResponse[]> {
    try {
      const response = await apiClient.get<BufferResponse[]>(BUFFERS_URL);
      return response.data;
    } catch (error: any) {
      throw new Error(error.message || 'Ошибка получения буферов');
    }
  }

  // Получить буфер по ID
  static async getBufferById(id: number): Promise<BufferDetailResponse> {
    try {
      const response = await apiClient.get<BufferDetailResponse>(`${BUFFERS_URL}/${id}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.message || 'Ошибка получения буфера');
    }
  }

  // Создать новый буфер
  static async createBuffer(bufferData: CreateBufferDto): Promise<BufferDetailResponse> {
    try {
      const response = await apiClient.post<BufferDetailResponse>(BUFFERS_URL, bufferData);
      return response.data;
    } catch (error: any) {
      throw new Error(error.message || 'Ошибка создания буфера');
    }
  }

  // Обновить буфер
  static async updateBuffer(id: number, bufferData: UpdateBufferDto): Promise<BufferDetailResponse> {
    try {
      const response = await apiClient.put<BufferDetailResponse>(`${BUFFERS_URL}/${id}`, bufferData);
      return response.data;
    } catch (error: any) {
      throw new Error(error.message || 'Ошибка обновления буфера');
    }
  }

  // Удалить буфер
  static async deleteBuffer(id: number): Promise<void> {
    try {
      await apiClient.delete(`${BUFFERS_URL}/${id}`);
    } catch (error: any) {
      throw new Error(error.message || 'Ошибка удаления буфера');
    }
  }

  // Скопировать буфер
  static async copyBuffer(id: number, copyData: CopyBufferDto): Promise<BufferDetailResponse> {
    try {
      const response = await apiClient.post<BufferDetailResponse>(`${BUFFERS_URL}/${id}/copy`, copyData);
      return response.data;
    } catch (error: any) {
      throw new Error(error.message || 'Ошибка копирования буфера');
    }
  }

  // Получить статистику буферов
  static async getBuffersStatistics(): Promise<BuffersStatistics> {
    try {
      const response = await apiClient.get<BuffersStatistics>(`${BUFFERS_URL}/statistics`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.message || 'Ошибка получения статистики буферов');
    }
  }

  // === УПРАВЛЕНИЕ ЯЧЕЙКАМИ БУФЕРА ===

  // Получить ячейки буфера
  static async getBufferCells(bufferId: number): Promise<BufferCellResponse[]> {
    try {
      const response = await apiClient.get<BufferCellResponse[]>(`${BUFFERS_URL}/${bufferId}/cells`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.message || 'Ошибка получения ячеек буфера');
    }
  }

  // Создать ячейку буфера
  static async createBufferCell(bufferId: number, cellData: CreateBufferCellDto): Promise<BufferCellResponse> {
    try {
      const response = await apiClient.post<BufferCellResponse>(`${BUFFERS_URL}/${bufferId}/cells`, cellData);
      return response.data;
    } catch (error: any) {
      throw new Error(error.message || 'Ошибка создания ячейки буфера');
    }
  }

  // Обновить ячейку буфера
  static async updateBufferCell(cellId: number, cellData: UpdateBufferCellDto): Promise<BufferCellResponse> {
    try {
      const response = await apiClient.put<BufferCellResponse>(`${BUFFERS_URL}/cells/${cellId}`, cellData);
      return response.data;
    } catch (error: any) {
      throw new Error(error.message || 'Ошибка обновления ячейки буфера');
    }
  }

  // Удалить ячейку буфера
  static async deleteBufferCell(cellId: number): Promise<void> {
    try {
      await apiClient.delete(`${BUFFERS_URL}/cells/${cellId}`);
    } catch (error: any) {
      throw new Error(error.message || 'Ошибка удаления ячейки буфера');
    }
  }

  // Получить статистику ячеек буфера
  static async getBufferCellsStatistics(bufferId: number): Promise<BufferCellsStatistics> {
    try {
      const response = await apiClient.get<BufferCellsStatistics>(`${BUFFERS_URL}/${bufferId}/cells/statistics`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.message || 'Ошибка получения статистики ячеек буфера');
    }
  }

  // === УПРАВЛЕНИЕ СВЯЗЯМИ С ЭТАПАМИ ===

  // Получить связи буфера с этапами
  static async getBufferStages(bufferId: number): Promise<BufferStageResponse[]> {
    try {
      const response = await apiClient.get<BufferStageResponse[]>(`${BUFFERS_URL}/${bufferId}/stages`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.message || 'Ошибка получения связей буфера с этапами');
    }
  }

  // Добавить связь с этапом
  static async createBufferStage(bufferId: number, stageData: CreateBufferStageDto): Promise<BufferStageResponse> {
    try {
      const response = await apiClient.post<BufferStageResponse>(`${BUFFERS_URL}/${bufferId}/stages`, stageData);
      return response.data;
    } catch (error: any) {
      throw new Error(error.message || 'Ошибка добавления связи с этапом');
    }
  }

  // Обновить связи с этапами
  static async updateBufferStages(bufferId: number, stagesData: UpdateBufferStagesDto): Promise<BufferStageResponse[]> {
    try {
      const response = await apiClient.put<BufferStageResponse[]>(`${BUFFERS_URL}/${bufferId}/stages`, stagesData);
      return response.data;
    } catch (error: any) {
      throw new Error(error.message || 'Ошибка обновления связей с этапами');
    }
  }

  // Удалить связь с этапом
  static async deleteBufferStage(bufferStageId: number): Promise<void> {
    try {
      await apiClient.delete(`${BUFFERS_URL}/stages/${bufferStageId}`);
    } catch (error: any) {
      throw new Error(error.message || 'Ошибка удаления связи с этапом');
    }
  }

  // === ДОПОЛНИТЕЛЬНЫЕ ЭНДПОИНТЫ ===

  // Получить доступные этапы
  static async getAvailableStages(): Promise<AvailableStage[]> {
    try {
      const response = await apiClient.get<AvailableStage[]>(`${BUFFERS_URL}/stages/available`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.message || 'Ошибка получения доступных этапов');
    }
  }

  // Получить этапы с информацией о буферах
  static async getStagesWithBuffers(): Promise<StagesWithBuffersResponse[]> {
    try {
      const response = await apiClient.get<StagesWithBuffersResponse[]>(`${BUFFERS_URL}/stages/with-buffers`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.message || 'Ошибка получения этапов с информацией о буферах');
    }
  }

  // === ДОПОЛНИТЕЛЬНЫЕ МЕТОДЫ ===

  // Проверить доступность API
  static async healthCheck(): Promise<{ status: string; timestamp: string }> {
    try {
      const response = await apiClient.get<{ status: string; timestamp: string }>('/health');
      return response.data;
    } catch (error: any) {
      throw new Error(error.message || 'API недоступен');
    }
  }

  // Поиск буферов
  static async searchBuffers(query: string): Promise<BufferResponse[]> {
    try {
      const response = await apiClient.get<BufferResponse[]>(`${BUFFERS_URL}/search`, {
        params: { q: query }
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.message || 'Ошибка поиска буферов');
    }
  }

  // Получить буферы по местоположению
  static async getBuffersByLocation(location: string): Promise<BufferResponse[]> {
    try {
      const response = await apiClient.get<BufferResponse[]>(`${BUFFERS_URL}`, {
        params: { location }
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.message || 'Ошибка получения буферов по местоположению');
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