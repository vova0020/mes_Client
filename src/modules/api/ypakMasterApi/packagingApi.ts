import axios from 'axios';
import { API_URL } from '../config';

// Интерфейсы для заданий упаковки
export interface PackingTaskDto {
  taskId: number;
  status: string;
  priority: number;
  assignedAt: string;
  completedAt: string | null;
  machine: {
    machineId: number;
    machineName: string;
    status: string;
  };
  assignedUser: {
    userId: number;
    login: string;
    userDetail: {
      firstName: string;
      lastName: string;
    } | null;
  } | null;
}

// Интерфейсы для упаковок
export interface PackageDto {
  id: number;
  orderId: number;
  packageCode: string;
  packageName: string;
  completionPercentage: number;
  packingStatus: string;
  packingAssignedAt: string | null;
  packingCompletedAt: string | null;
  order: {
    orderName: string;
    batchNumber: string;
  };
  parts: PartInPackageDto[];
  totalQuantity: number;
  readyForPackaging: number;
  distributed: number;
  assembled: number;
  packaged: number;
  tasks: PackingTaskDto[];
}

export interface PartInPackageDto {
  partId: number;
  partCode: string;
  partName: string;
  quantity: number;
}

export interface PackagesResponse {
  packages: PackageDto[];
}

export interface PackagingQueryParams {
  orderId?: number;
  page?: number;
  limit?: number;
}

// API функции для работы с упаковками
export const packagingApi = {
  // Получение списка упаковок с фильтрами
  getPackages: async (params?: PackagingQueryParams): Promise<PackageDto[]> => {
    try {
      const response = await axios.get(`${API_URL}/packaging`, { params });
      return response.data.packages;
    } catch (error) {
      console.error('Ошибка при получении списка упаковок:', error);
      throw error;
    }
  },

  // Получение упаковок по ID заказа
  getPackagesByOrderId: async (orderId: string | number): Promise<PackageDto[]> => {
    try {
      const response = await axios.get(`${API_URL}/packaging/by-order/${orderId}`);
      return response.data.packages;
    } catch (error) {
      console.error(`Ошибка при получении упаковок для заказа ${orderId}:`, error);
      throw error;
    }
  },

  // Получение упаковки по ID
  getPackageById: async (packageId: string | number): Promise<PackageDto> => {
    try {
      const response = await axios.get(`${API_URL}/packaging/${packageId}`);
      return response.data;
    } catch (error) {
      console.error(`Ошибка при получении упаковки ${packageId}:`, error);
      throw error;
    }
  }
};