import axios from 'axios';
import { API_URL } from '../config';

export interface RouteStage {
  stageName: string;
  completedAt: string | null;
  status: 'NOT_PROCESSED' | 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'AWAITING_PACKAGING';
}

export interface RouteListData {
  palletNumber: string;
  partName: string;
  partSku: string;
  partCreatedAt: string;
  palletCreatedAt: string;
  quantity: number;
  materialName: string;
  partSize: string;
  totalOrderQuantity: number;
  edgingNameL1: string | null;
  edgingSkuL1: string | null;
  edgingNameW1: string | null;
  edgingSkuW1: string | null;
  finishedLength: number | null;
  finishedWidth: number | null;
  groove: string | null;
  bufferCellAddress: string | null;
  orderName: string;
  orderNumber: string;
  routeStages: RouteStage[];
}

export const routeListApi = {
  getPalletData: async (palletId: number): Promise<RouteListData> => {
    try {
      const response = await axios.get<RouteListData>(`${API_URL}/route-list/pallet/${palletId}`);
      return response.data;
    } catch (error) {
      console.error('Ошибка при получении данных поддона:', error);
      throw error;
    }
  }
};