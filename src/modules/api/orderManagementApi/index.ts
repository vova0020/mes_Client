// src/modules/api/orderManagementApi/index.ts
import { API_URL } from '../config';

// Типы данных
export type OrderStatus = 
  | 'PRELIMINARY' 
  | 'APPROVED' 
  | 'LAUNCH_PERMITTED' 
  | 'IN_PROGRESS' 
  | 'COMPLETED';

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

// API функции
class OrderManagementApi {
  private baseUrl: string;

  constructor() {
    this.baseUrl = `${API_URL}/order-management`;
  }

  // Получение списка всех заказов
  async getOrders(): Promise<Order[]> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Ошибка при получении заказов:', error);
      throw error;
    }
  }

  // Получение детальной информации о заказе
  async getOrderDetails(orderId: number): Promise<OrderDetailsResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/${orderId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Заказ не найден');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Ошибка при получении деталей заказа:', error);
      throw error;
    }
  }

  // Изменение статуса заказа
  async updateOrderStatus(orderId: number, status: OrderStatus): Promise<StatusUpdateResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Заказ не найден');
        }
        if (response.status === 400) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Недопустимый переход статуса');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
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
}

// Экспорт экземпляра API
export const orderManagementApi = new OrderManagementApi();

// Универсальная функция обработки ошибок
export async function handleApiRequest<T>(request: () => Promise<Response>): Promise<T> {
  try {
    const response = await request();
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const message = errorData.message || `HTTP error! status: ${response.status}`;
      throw new Error(message);
    }
    
    return await response.json();
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Неизвестная ошибка при выполнении запроса');
  }
}