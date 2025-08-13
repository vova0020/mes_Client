import axios from 'axios';
import { API_URL } from '../config';

// Интерфейсы для поддонов
export interface BufferDto {
  bufferId: number;
  bufferName: string;
  location: string;
}

export interface CellDto {
  cellId: number;
  cellCode: string;
  status: string;
  capacity: number;
  currentLoad: number;
  buffer: BufferDto;
}

export interface MachineAssignmentDto {
  assignmentId: number;
  machineId: number;
  machineName: string;
  assignedAt: Date;
  completedAt?: Date | null;
}

export interface StageProgressDto {
  routeStageId: number;
  stageName: string;
  status: string;
  completedAt?: Date | null;
}

export interface PalletDto {
  palletId: number;
  palletName: string;
  quantity: number;
  status: string;
  assignedToPackage: boolean;
  currentCell?: CellDto;
  placedAt?: Date;
  machineAssignments: MachineAssignmentDto[];
  stageProgress: StageProgressDto[];
}

export interface PartInfoDto {
  partId: number;
  partCode: string;
  partName: string;
  status: string;
  totalQuantity: number;
  isSubassembly: boolean;
  readyForMainFlow: boolean;
  size: string;
  material: {
    materialId: number;
    materialName: string;
    article: string;
    unit: string;
  };
  route: {
    routeId: number;
    routeName: string;
  };
}

export interface PalletsResponse {
  partInfo: PartInfoDto;
  palletsCount: number;
  pallets: PalletDto[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PalletsQueryParams {
  page?: number;
  limit?: number;
  palletName?: string;
  onlyInCells?: boolean;
}

export interface PalletsStatisticsDto {
  partId: number;
  totalPallets: number;
  palletsInCells: number;
  palletsInProgress: number;
  completedPallets: number;
}

// API функции для работы с поддонами
export const palletsApi = {
  // Получение всех поддонов детали по ID детали
  getPalletsByPartId: async (
    partId: string | number, 
    params?: PalletsQueryParams
  ): Promise<PalletsResponse> => {
    try {
      const response = await axios.get(`${API_URL}/packaging/pallets/by-part/${partId}`, { params });
      return response.data;
    } catch (error) {
      console.error(`Ошибка при получении поддонов для детали ${partId}:`, error);
      throw error;
    }
  },

  // Получение конкретного поддо��а детали
  getPalletByPartAndPalletId: async (
    partId: string | number, 
    palletId: string | number
  ): Promise<PalletDto> => {
    try {
      const response = await axios.get(`${API_URL}/packaging/pallets/by-part/${partId}/pallet/${palletId}`);
      return response.data;
    } catch (error) {
      console.error(`Ошибка при получении поддона ${palletId} для детали ${partId}:`, error);
      throw error;
    }
  },

  // Получение статистики по поддонам детали
  getPalletsStatistics: async (partId: string | number): Promise<PalletsStatisticsDto> => {
    try {
      const response = await axios.get(`${API_URL}/packaging/pallets/statistics/${partId}`);
      return response.data;
    } catch (error) {
      console.error(`Ошибка при получении статистики поддонов для детали ${partId}:`, error);
      throw error;
    }
  }
};