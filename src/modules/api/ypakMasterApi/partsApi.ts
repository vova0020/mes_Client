import axios from 'axios';
import { API_URL } from '../config';

// Интерфейсы для деталей
export interface MaterialDto {
  materialId: number;
  materialName: string;
  article: string;
  unit: string;
}

export interface RouteDto {
  routeId: number;
  routeName: string;
}

export interface RouteProgressDto {
  routeStageId: number;
  stageName: string;
  status: string;
  completedAt?: Date | null;
}

export interface PalletInPartDto {
  palletId: number;
  palletName: string;
}

export interface PartDto {
  partId: number;
  partCode: string;
  partName: string;
  status: string;
  totalQuantity: number;
  requiredQuantity: number;
  isSubassembly: boolean;
  readyForMainFlow: boolean;
  size: string;
  material: MaterialDto;
  route: RouteDto;
  pallets?: PalletInPartDto[];
  routeProgress?: RouteProgressDto[];
}

export interface PackageInfoDto {
  packageId: number;
  packageCode: string;
  packageName: string;
  completionPercentage: number;
  order: {
    orderId: number;
    orderName: string;
    batchNumber: string;
  };
}

export interface PartsResponse {
  packageInfo: PackageInfoDto;
  partsCount: number;
  parts: PartDto[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PartsQueryParams {
  packageId?: number;
  status?: string;
  page?: number;
  limit?: number;
}

export interface PartsStatisticsDto {
  packageId: number;
  totalParts: number;
  completedParts: number;
  inProgressParts: number;
  pendingParts: number;
  completionPercentage: number;
}

// API функции для работы с деталями упаковок
export const partsApi = {
  // Получение всех деталей упаковки по ID упаковки
  getPartsByPackageId: async (
    packageId: string | number, 
    params?: Omit<PartsQueryParams, 'packageId'>
  ): Promise<PartsResponse> => {
    try {
      const response = await axios.get(`${API_URL}/packaging/parts/by-package/${packageId}`, { params });
      return response.data;
    } catch (error) {
      console.error(`Ошибка при получении деталей для упаковки ${packageId}:`, error);
      throw error;
    }
  },

  // Получение конкретной детали из упаковки
  getPartFromPackage: async (
    packageId: string | number, 
    partId: string | number
  ): Promise<PartDto> => {
    try {
      const response = await axios.get(`${API_URL}/packaging/parts/by-package/${packageId}/part/${partId}`);
      return response.data;
    } catch (error) {
      console.error(`Ошибка при получении детали ${partId} из упаковки ${packageId}:`, error);
      throw error;
    }
  },

  // Получение статистики по деталям упаковки
  getPartsStatistics: async (packageId: string | number): Promise<PartsStatisticsDto> => {
    try {
      const response = await axios.get(`${API_URL}/packaging/parts/statistics/${packageId}`);
      return response.data;
    } catch (error) {
      console.error(`Ошибка при получении статистики деталей для упаковки ${packageId}:`, error);
      throw error;
    }
  }
};