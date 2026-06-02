import axios from 'axios';

import { API_URL } from '../../config';

export interface CustomPart {
  customPartId: number;
  customOrderId: number;
  partCode: string;
  partName: string;
  materialName: string;
  materialSku: string;
  thickness: number;
  thicknessWithEdging: number;
  quantity: number;
  distributedQuantity?: number;
  undistributedQuantity?: number;
  blankLength: number;
  blankWidth: number;
  finishedLength: number;
  finishedWidth: number;
  groove: string | null;
  edgingSkuL1: string | null;
  edgingNameL1: string | null;
  status: string;
  route: {
    routeId: number;
    routeName: string;
    routeStages: any[];
  };
  pallets: any[];
}

export interface OrderDetailsResponse {
  orderId: number;
  orderNumber: string;
  orderName: string;
  totalParts: number;
  parts: CustomPart[];
}

export const customDetailsApi = {
  getOrderDetails: async (orderId: number, stageId?: number): Promise<OrderDetailsResponse> => {
    const params = stageId ? { stageId } : {};
    console.log(`API request: GET /custom-orders/${orderId}/details`, params);
    const response = await axios.get(`${API_URL}/custom-orders/${orderId}/details`, {
      params
    });
    return response.data;
  }
};
