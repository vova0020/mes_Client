// src/modules/api/orderManagementApi/index.ts
import axios from 'axios';
import { API_URL } from '../config';

// Типы данных
export type OrderStatus = 
  | 'PRELIMINARY' 
  | 'APPROVED' 
  | 'LAUNCH_PERMITTED' 
  | 'IN_PROGRESS' 
  | 'COMPLETED'
  | 'POSTPONED';

export interface Order {
  orderId: number;
  batchNumber: string;
  orderName: string;
  completionPercentage: number;
  createdAt: string;
  completedAt?: string;
  requiredDate: string;
  status: OrderStatus;
  launchPermission: boolean;
  isCompleted: boolean;
  packagesCount: number;
  totalPartsCount: number;
  priority?: number;
}

export interface OrderDetail {
  partId: number;
  partCode: string;
  partName: string;
  totalQuantity: number;
  status: string;
  size: string;
  materialId: number;
}

export interface OrderPackage {
  packageId: number;
  packageCode: string;
  packageName: string;
  quantity: number;
  completionPercentage: number;
  details: OrderDetail[];
}

export interface OrderDetailsResponse {
  order: {
    orderId: number;
    batchNumber: string;
    orderName: string;
    completionPercentage: number;
    createdAt: string;
    completedAt?: string;
    requiredDate: string;
    status: OrderStatus;
    launchPermission: boolean;
    isCompleted: boolean;
  };
  packages: OrderPackage[];
}

export interface StatusUpdateRequest {
  status: OrderStatus;
}

export interface StatusUpdateResponse {
  orderId: number;
  previousStatus: OrderStatus;
  newStatus: OrderStatus;
  launchPermission: boolean;
  updatedAt: string;
}

export interface PriorityUpdateRequest {
  priority: number;
}

export interface PriorityUpdateResponse {
  orderId: number;
  previousPriority: number;
  newPriority: number;
  updatedAt: string;
}

// API функции
class OrderManagementApi {
  private baseUrl: string;

  constructor() {
    this.baseUrl = `${API_URL}/order-management`;
  }

  // Получение списка всех заказов
  async getOrders(): Promise<Order[]> {
    try {
      const response = await axios.get<Order[]>(this.baseUrl);
      return response.data;
    } catch (error) {
      console.error('Ошибка при получении заказов:', error);
      throw error;
    }
  }

  // Получение детальной информации о заказе
  async getOrderDetails(orderId: number): Promise<OrderDetailsResponse> {
    try {
      const response = await axios.get<OrderDetailsResponse>(`${this.baseUrl}/${orderId}`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        throw new Error('Заказ не найден');
      }
      console.error('Ошибка при получении деталей заказа:', error);
      throw error;
    }
  }

  // Изменение статуса заказа
  async updateOrderStatus(orderId: number, status: OrderStatus): Promise<StatusUpdateResponse> {
    try {
      const response = await axios.patch<StatusUpdateResponse>(`${this.baseUrl}/${orderId}/status`, { status });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          throw new Error('Заказ не найден');
        }
        if (error.response?.status === 400) {
          throw new Error(error.response.data?.message || 'Недопустимый переход статуса');
        }
      }
      console.error('Ошибка при изменении статуса заказа:', error);
      throw error;
    }
  }

  // Функция для разрешения заказа к запуску
  async approveOrderForLaunch(orderId: number): Promise<StatusUpdateResponse> {
    return this.updateOrderStatus(orderId, 'LAUNCH_PERMITTED');
  }

  // Функция для запуска заказа в производство
  async startOrderProduction(orderId: number): Promise<StatusUpdateResponse> {
    return this.updateOrderStatus(orderId, 'IN_PROGRESS');
  }

  // Функция для завершения заказа
  async completeOrder(orderId: number): Promise<StatusUpdateResponse> {
    return this.updateOrderStatus(orderId, 'COMPLETED');
  }

  // Функция для отложения заказа
  async postponeOrder(orderId: number): Promise<StatusUpdateResponse> {
    try {
      const response = await axios.patch<StatusUpdateResponse>(`${this.baseUrl}/${orderId}/postpone`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          throw new Error('Заказ не найден');
        }
        if (error.response?.status === 400) {
          throw new Error(error.response.data?.message || 'Недопустимая операция отложения');
        }
      }
      console.error('Ошибка при отложении заказа:', error);
      throw error;
    }
  }

  // Функция для удаления заказа
  async deleteOrder(orderId: number): Promise<{ message: string }> {
    try {
      const response = await axios.delete<{ message: string }>(`${this.baseUrl}/${orderId}`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          throw new Error('Заказ не найден');
        }
        if (error.response?.status === 400) {
          throw new Error(error.response.data?.message || 'Недопустимая операция удаления');
        }
      }
      console.error('Ошибка при удалении заказа:', error);
      throw error;
    }
  }

  // Функция для изменения приоритета заказа
  async updateOrderPriority(orderId: number, priority: number): Promise<Order> {
    try {
      const response = await axios.patch<Order>(`${API_URL}/production-orders/${orderId}/priority`, { priority });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          throw new Error('Заказ не найден');
        }
        if (error.response?.status === 400) {
          throw new Error(error.response.data?.message || 'Недопустимое значение приоритета');
        }
      }
      console.error('Ошибка при изменении приоритета заказа:', error);
      throw error;
    }
  }
}

// Экспорт экземпляра API
export const orderManagementApi = new OrderManagementApi();

// Универсальная функция обработки ошибок
export async function handleApiRequest<T>(request: () => Promise<{ data: T }>): Promise<T> {
  try {
    const response = await request();
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.message || error.message;
      throw new Error(message);
    }
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Неизвестная ошибка при выполнении запроса');
  }
}