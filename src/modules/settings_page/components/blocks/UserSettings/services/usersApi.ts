import axios, { AxiosResponse } from 'axios';

const API_BASE_URL = 'http://localhost:5000';
const USERS_URL = '/settings/users';

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
    
    if (error.response) {
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
          throw new Error('Пользователь не найден');
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
      throw new Error('Сервер не отвечает. Проверьте подключение к интернету.');
    } else {
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

// Утилитная функция для форматирования salary
const formatSalaryForApi = (salary?: number): string | undefined => {
  if (salary === undefined || salary === null) {
    return undefined;
  }
  // Преобразуем число в строку с двумя десятичными знаками
  return salary.toFixed(2);
};

// Функция для подготовки данных пользователя перед отправкой
const prepareUserDataForApi = (userData: CreateUserDto | UpdateUserDto) => {
  const preparedData = { ...userData };
  
  // Форматируем salary если оно присутствует
  if ('salary' in preparedData && preparedData.salary !== undefined) {
    (preparedData as any).salary = formatSalaryForApi(preparedData.salary);
  }
  
  return preparedData;
};

// Типы для API
export interface User {
  userId: number;
  login: string;
  createdAt: string;
  updatedAt: string;
  userDetail: {
    firstName: string;
    lastName: string;
    phone?: string;
    position?: string;
    salary?: number;
  };
}

export interface CreateUserDto {
  login: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  position?: string;
  salary?: number;
}

export interface UpdateUserDto {
  login?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  position?: string;
  salary?: number;
}

export interface UserRoles {
  userId: number;
  globalRoles: string[];
  roleBindings: {
    id: number;
    role: string;
    contextType: string;
    contextId: number;
    contextName: string;
  }[];
}

export interface CreateRoleBindingDto {
  userId: number;
  role: string;
  contextType: 'MACHINE' | 'STAGE_LEVEL1' | 'ORDER_PICKER';
  contextId: number;
}

export interface AssignGlobalRoleDto {
  userId: number;
  role: string;
}

export interface AvailableRoles {
  roles: string[];
}

export interface ContextMachine {
  machineId: number;
  machineName: string;
}

export interface ContextStage {
  stageId: number;
  stageName: string;
}

export interface ContextPicker {
  pickerId: number;
  pickerName: string;
}

export class UsersApiService {
  // CRUD операции с пользователями
  
  // Получить всех пользователей
  static async getAllUsers(): Promise<User[]> {
    try {
      const response = await apiClient.get<User[]>(USERS_URL);
      return response.data;
    } catch (error: any) {
      throw new Error(error.message || 'Ошибка получения пользователей');
    }
  }

  // Получить пользователя по ID
  static async getUserById(id: number): Promise<User> {
    try {
      const response = await apiClient.get<User>(`${USERS_URL}/${id}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.message || 'Ошибка получения пользователя');
    }
  }

  // Создать нового пользователя
  static async createUser(userData: CreateUserDto): Promise<User> {
    try {
      // Подготавливаем данные перед отправкой
      const preparedData = prepareUserDataForApi(userData);
      console.log('Подготовленные данные для отправки:', preparedData);
      
      const response = await apiClient.post<User>(USERS_URL, preparedData);
      return response.data;
    } catch (error: any) {
      throw new Error(error.message || 'Ошибка создания пользователя');
    }
  }

  // Обновить пользователя
  static async updateUser(id: number, userData: UpdateUserDto): Promise<User> {
    try {
      // Подготавливаем данные перед отправкой
      const preparedData = prepareUserDataForApi(userData);
      console.log('Подготовленные данные для обновления:', preparedData);
      
      const response = await apiClient.put<User>(`${USERS_URL}/${id}`, preparedData);
      return response.data;
    } catch (error: any) {
      throw new Error(error.message || 'Ошибка обновления пользователя');
    }
  }

  // Удалить пользователя
  static async deleteUser(id: number): Promise<void> {
    try {
      await apiClient.delete(`${USERS_URL}/${id}`);
    } catch (error: any) {
      throw new Error(error.message || 'Ошибка удаления пользователя');
    }
  }

  // Управление ролями

  // Получить роли пользователя
  static async getUserRoles(userId: number): Promise<UserRoles> {
    try {
      const response = await apiClient.get<UserRoles>(`${USERS_URL}/${userId}/roles`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.message || 'Ошибка получения ролей пользователя');
    }
  }

  // Получить доступные роли
  static async getAvailableRoles(): Promise<AvailableRoles> {
    try {
      const response = await apiClient.get<AvailableRoles>(`${USERS_URL}/roles/available`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.message || 'Ошибка получения доступных ролей');
    }
  }

  // Назначить глобальную роль
  static async assignGlobalRole(data: AssignGlobalRoleDto): Promise<void> {
    try {
      await apiClient.post(`${USERS_URL}/roles/global`, data);
    } catch (error: any) {
      throw new Error(error.message || 'Ошибка назначения глобальной роли');
    }
  }

  // Удалить глобальную роль
  static async removeGlobalRole(userId: number, role: string): Promise<void> {
    try {
      await apiClient.delete(`${USERS_URL}/roles/global/${userId}/${role}`);
    } catch (error: any) {
      throw new Error(error.message || 'Ошибка удаления глобальной роли');
    }
  }

  // Создать контекстную привязку
  static async createRoleBinding(data: CreateRoleBindingDto): Promise<void> {
    try {
      await apiClient.post(`${USERS_URL}/roles/bindings`, data);
    } catch (error: any) {
      throw new Error(error.message || 'Ошибка создания контекстной привязки');
    }
  }

  // Удалить контекстную привязку
  static async removeRoleBinding(bindingId: number): Promise<void> {
    try {
      await apiClient.delete(`${USERS_URL}/roles/bindings/${bindingId}`);
    } catch (error: any) {
      throw new Error(error.message || 'Ошибка удаления контекстной привязки');
    }
  }

  // Контекстные данные для привязок

  // Получить станки для привязки
  static async getContextMachines(): Promise<ContextMachine[]> {
    try {
      const response = await apiClient.get<{ machines: ContextMachine[] }>(`${USERS_URL}/context/machines`);
      return response.data.machines;
    } catch (error: any) {
      throw new Error(error.message || 'Ошибка получения станков');
    }
  }

  // Получить этапы для привязки
  static async getContextStages(): Promise<ContextStage[]> {
    try {
      const response = await apiClient.get<{ stages: ContextStage[] }>(`${USERS_URL}/context/stages`);
      return response.data.stages;
    } catch (error: any) {
      throw new Error(error.message || 'Ошибка получения этапов');
    }
  }

  // Получить комплектовщиков для привязки
  static async getContextPickers(): Promise<ContextPicker[]> {
    try {
      const response = await apiClient.get<{ pickers: ContextPicker[] }>(`${USERS_URL}/context/pickers`);
      return response.data.pickers;
    } catch (error: any) {
      throw new Error(error.message || 'Ошибка получения комплектовщиков');
    }
  }

  // Проверить доступность API
  static async healthCheck(): Promise<{ status: string; timestamp: string }> {
    try {
      const response = await apiClient.get<{ status: string; timestamp: string }>('/health');
      return response.data;
    } catch (error: any) {
      throw new Error(error.message || 'API недоступен');
    }
  }
}

// Экспортируем настроенный клиент для использования в других местах
export { apiClient };

// Дополнительные типы для API ответов
export interface ApiResponse<T> {
  data: T;
  message?: string;
  timestamp: string;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: any;
}