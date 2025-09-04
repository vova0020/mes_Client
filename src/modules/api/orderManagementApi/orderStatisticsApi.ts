import axios from 'axios';
import { API_URL } from '../config';

export type OrderStatus = 
  | 'PRELIMINARY' 
  | 'APPROVED' 
  | 'LAUNCH_PERMITTED' 
  | 'IN_PROGRESS' 
  | 'COMPLETED'
  | 'POSTPONED';

export type PalletStageStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';

export interface OrderStatistic {
  orderId: number;
  batchNumber: string;
  orderName: string;
  status: OrderStatus;
  completionPercentage: number;
  productionProgress: number;
  packingProgress: number;
  createdAt: string;
  requiredDate: string;
}

export interface OrderPackageDetail {
  packageId: number;
  packageCode: string;
  packageName: string;
  quantity: number;
  partCount: number;
}

export interface OrderPartStage {
  routeStageId: number;
  stageName: string;
  sequenceNumber: number;
  completionPercentage: number;
}

export interface OrderPalletStage {
  routeStageId: number;
  stageName: string;
  sequenceNumber: number;
  status: PalletStageStatus;
}

export interface OrderPallet {
  palletId: number;
  palletName: string;
  quantity: number;
  stages: OrderPalletStage[];
}

export interface OrderPart {
  partId: number;
  partCode: string;
  partName: string;
  totalQuantity: number;
  packages: string[];
  stages: OrderPartStage[];
  pallets: OrderPallet[];
}

export interface OrderDetailedStatistic {
  orderId: number;
  batchNumber: string;
  orderName: string;
  status: OrderStatus;
  completionPercentage: number;
  productionProgress: number;
  packingProgress: number;
  packages: OrderPackageDetail[];
  parts: OrderPart[];
}

class OrderStatisticsApi {
  private baseUrl: string;

  constructor() {
    this.baseUrl = `${API_URL}/order-statistics`;
  }

  async getAllOrders(): Promise<OrderStatistic[]> {
    try {
      const response = await axios.get<OrderStatistic[]>(this.baseUrl);
      return response.data;
    } catch (error) {
      console.error('Ошибка при получении статистики заказов:', error);
      throw error;
    }
  }

  async getOrderDetails(orderId: number): Promise<OrderDetailedStatistic> {
    try {
      const response = await axios.get<OrderDetailedStatistic>(`${this.baseUrl}/${orderId}`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        throw new Error('Заказ не найден');
      }
      console.error('Ошибка при получении детальной статистики заказа:', error);
      throw error;
    }
  }
}

export const orderStatisticsApi = new OrderStatisticsApi();