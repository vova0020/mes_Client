import axios from 'axios';

import { API_URL } from '../../config';

export interface PalletPart {
  customPartId: number;
  partCode: string;
  partName: string;
  materialName: string;
  status: string;
  quantity: number;
}

export interface PalletMachineInfo {
  machineId: number;
  machineName: string;
  assignmentStatus?: string;
  completedAt?: string;
}

export interface PalletAssignedMachine {
  assignmentId: number;
  machineId: number;
  machineName: string;
  machineStatus: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE' | 'BROKEN';
  routeStageId: number;
  stageName: string;
  assignmentStatus: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'NOT_PROCESSED';
  priority: number;
  assignedAt: string;
}

export interface PalletPartDetails {
  customPartId: number;
  customOrderId: number;
  partCode: string;
  partName: string;
  materialName: string;
  materialSku: string;
  thickness: number;
  thicknessWithEdging: number;
  totalQuantity: number;
  quantityOnPallet: number;
  blankLength: number;
  blankWidth: number;
  finishedLength: number;
  finishedWidth: number;
  status: string;
  stageStatus?: string;
  route: {
    routeId: number;
    routeName: string;
    routeStages: any[];
  };
}

export interface PalletDetailsResponse {
  customPalletId: number;
  palletName: string;
  isActive: boolean;
  createdAt: string;
  totalParts: number;
  parts: PalletPartDetails[];
}

export interface CustomPallet {
  customPalletId: number;
  palletName: string;
  isActive: boolean;
  createdAt: string;
  readyToProcess?: number;
  completed?: number;
  status?: 'NOT_PROCESSED' | 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  currentMachine?: PalletMachineInfo;
  completedByMachine?: PalletMachineInfo;
  assignedMachine: PalletAssignedMachine | null;
  parts: PalletPart[];
}

export interface PalletsResponse {
  status: string;
  message: string;
  pallets: CustomPallet[];
}

export interface CreatePalletRequest {
  palletName: string;
  parts: {
    customPartId: number;
    quantity: number;
  }[];
}

export const customPalletsApi = {
  getOrderPallets: async (orderId: number, stageId?: number): Promise<PalletsResponse> => {
    const response = await axios.get(`${API_URL}/custom-orders/${orderId}/pallets`, {
      params: stageId ? { stageId } : {}
    });
    return response.data;
  },

  getPalletParts: async (palletId: number, stageId?: number): Promise<PalletDetailsResponse> => {
    const response = await axios.get(`${API_URL}/custom-pallets/${palletId}/parts`, {
      params: stageId ? { stageId } : {}
    });
    return response.data;
  },

  createPallet: async (orderId: number, data: CreatePalletRequest): Promise<CustomPallet> => {
    const response = await axios.post(`${API_URL}/custom-orders/${orderId}/pallets`, data);
    return response.data;
  },

  deletePallet: async (palletId: number): Promise<{ message: string }> => {
    const response = await axios.delete(`${API_URL}/custom-pallets/${palletId}`);
    return response.data;
  }
};
