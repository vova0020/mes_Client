import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

export interface CustomOrder {
  id: number;
  orderNumber: string;
  orderName: string;
  completionPercentage: number;
  status: string;
  priority: number;
  available: number;
  completed: number;
}

export interface CustomOrderDetails {
  customOrderId: number;
  orderNumber: string;
  orderName: string;
  completionPercentage: number;
  createdAt: string;
  requiredDate: string;
  status: string;
  priority: number;
  customParts: any[];
}

export interface PalletMachineInfo {
  machineId: number;
  machineName: string;
  assignmentStatus?: string;
  completedAt?: string;
}

export interface PalletDetail {
  customPartId: number;
  partCode: string;
  partName: string;
  quantity: number;
}

export interface OrderPallet {
  palletId: number;
  palletNumber: string;
  readyToProcess: number;
  completed: number;
  status: 'NOT_PROCESSED' | 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  currentMachine?: PalletMachineInfo;
  completedByMachine?: PalletMachineInfo;
  details: PalletDetail[];
}

export const customOrdersApi = {
  getOrdersByStage: async (stageId: number): Promise<CustomOrder[]> => {
    const response = await axios.get(`${API_URL}/custom-orders`, {
      params: { stageId }
    });
    return response.data;
  },

  getOrderById: async (orderId: number): Promise<CustomOrderDetails> => {
    const response = await axios.get(`${API_URL}/custom-orders/${orderId}`);
    return response.data;
  },

  getOrderPallets: async (orderId: number, stageId?: number): Promise<OrderPallet[]> => {
    const response = await axios.get(`${API_URL}/custom-orders/${orderId}/pallets`, {
      params: stageId ? { stageId } : {}
    });
    return response.data;
  }
};
